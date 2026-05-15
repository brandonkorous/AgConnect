# 10 — Infra & CI/CD: Architecture & Manifests

This file describes the cluster topology and Kubernetes manifest structure. There is no DB schema specific to infra. **Authoritative manifests live in [`deploy/k8s/base/`](../../../deploy/k8s/base/)** — this doc summarizes intent; if the two disagree, the manifests win.

## GKE namespaces

| namespace        | purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `agconn`         | production workloads                                 |
| `pr-<id>`        | per-PR preview, auto-deleted on PR close *(planned)* |
| `cert-manager`   | cert-manager + Let's Encrypt                         |
| `ingress-nginx`  | nginx-ingress controller                             |
| `kube-system`    | GKE-managed (kube-dns, Calico, metrics-server)       |

The `agconn` namespace is labelled `pod-security.kubernetes.io/enforce: restricted`. Every container in the namespace runs as non-root, drops all Linux capabilities, has `allowPrivilegeEscalation: false`, and uses the `RuntimeDefault` seccomp profile.

## Node pools

| pool     | machine type | mode      | autoscale | taint               | who runs here                                    |
| -------- | ------------ | --------- | --------- | ------------------- | ------------------------------------------------ |
| `system` | e2-small     | on-demand | fixed 1   | none                | ingress-nginx, cert-manager, kube-system         |
| `app`    | e2-medium    | on-demand | 1–3       | `pool=app:NoSchedule` | web, admin, api, db-migrate Job                  |
| `worker` | e2-small     | **spot**  | 0–N       | spot taint          | pg-boss consumers, audit CronJobs                |

Spot eviction is safe because every worker is a pg-boss consumer — interrupted jobs requeue. Min=0 means idle worker capacity costs nothing.

## Deployments (canonical shape)

### web

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: web, namespace: agconn }
spec:
  replicas: 1                  # HPA scales 1..2 on cpu=70%
  template:
    spec:
      serviceAccountName: agconn
      nodeSelector: { pool: app }
      tolerations: [{ key: pool, value: app, effect: NoSchedule }]
      securityContext: { runAsNonRoot: true, runAsUser: 1001, seccompProfile: { type: RuntimeDefault } }
      containers:
        - name: web
          image: us-west1-docker.pkg.dev/<proj>/containers/web:<SHA>
          securityContext: { allowPrivilegeEscalation: false, capabilities: { drop: ["ALL"] } }
          ports: [{ containerPort: 3000, name: http }]
          envFrom:
            - configMapRef: { name: agconn-config }
            - secretRef:    { name: agconn-env }
          readinessProbe: { httpGet: { path: /api/health, port: http } }
```

### api

Hono `node services/api/dist/index.js`, port 3001. Reads tenant from Clerk org in middleware, pins via `set_config('app.tenant_id', ...)` for RLS.

### admin

Internal-only Next.js, port 3100. Cloudflare WAF + Clerk admin instance guard ingress; pod still enforces auth server-side.

### workers (per-service)

`email-worker`, `sms-worker`, `resume-parser`, `cert-generator`, `scheduler`, `flc-verifier`. Each is its own image and Deployment on the `worker` (spot) pool. Scheduler is a singleton (`replicas: 1`, `strategy: Recreate`) — multiple replicas would double-enqueue time-based jobs.

### CronJobs

`audit-retention` (02:00 UTC) and `audit-verifier` (03:00 UTC). `concurrencyPolicy: Forbid` prevents overlap on slow nights.

## Services

```
- web:   ClusterIP, port 80 → 3000
- admin: ClusterIP, port 80 → 3100
- api:   ClusterIP, port 80 → 3001
```

Worker pods have no Service. Outbound only (Supabase, Twilio, Resend, Anthropic, Stripe, Sentry).

## Ingress + TLS

Three Ingress objects, all `ingressClassName: nginx`, all gated by `cert-manager.io/cluster-issuer: letsencrypt-prod`:

- `agconn.com`, `www.agconn.com` → web
- `api.agconn.com` → api
- `admin.agconn.com` → admin

The `letsencrypt-prod` ClusterIssuer uses Cloudflare DNS01 (HTTP01 doesn't traverse Cloudflare's orange-cloud proxy). The Cloudflare API token Secret lives in the `cert-manager` namespace and is provisioned by Terraform.

Single static IP allocated by Terraform (`google_compute_address.ingress`) and patched onto the ingress-nginx LoadBalancer Service at bootstrap.

## NetworkPolicy *(staged but inert at MVP)*

Manifests are committed at `deploy/k8s/base/network-policy.yaml` and applied to the cluster, but GKE silently ignores them because `network_policy.enabled = false` in `infra/terraform/cluster.tf`. Enforcement is deferred until business demand justifies the cluster recycle that enabling Calico requires — see Phase 6 item 6.9b in [GAP-CLOSURE-PLAN.md](../../GAP-CLOSURE-PLAN.md).

The intended topology, when enabled, is default-deny ingress for the `agconn` namespace plus:

- `web` accepts TCP/3000 from pods in the `ingress-nginx` namespace.
- `admin` accepts TCP/3100 from pods in the `ingress-nginx` namespace.
- `api` accepts TCP/3001 from `ingress-nginx` **and** from any pod in `agconn` (web RSCs call api server-to-server).

Egress is unrestricted — every pod can reach Supabase, Stripe, Twilio, Resend, Sentry, Clerk, Anthropic, Cloudflare, and GCP control plane. Allow-listing those destinations by IP is more brittle than the gain.

## HorizontalPodAutoscaler

`web` and `api` autoscale 1–2 replicas on `cpu = 70%`. Workers are scaled manually for now — pg-boss queue depth is the right signal but exposing it as a custom metric (HPA `External` source via prometheus-adapter) is deferred until queue depth becomes a real bottleneck.

## Secrets

GitHub Actions secrets → applied as a single `agconn-env` K8s Secret on every deploy. Each Deployment `envFrom`s that Secret + a non-sensitive `agconn-config` ConfigMap. There is no in-cluster KMS or CSI secret store at MVP. Sentry release tag (`SENTRY_RELEASE = GITHUB_SHA`) is included in the Secret.

A Workload Identity binding for the K8s ServiceAccount `agconn/agconn` is provisioned by Terraform; pods that need GCP API access (Cloud Logging, Artifact Registry pulls) auth via WI, not service-account keys.

## Database init

Prisma migrations run as a one-shot `Job` (not an Init Container) **before** the kustomize apply step in the deploy pipeline:

```yaml
apiVersion: batch/v1
kind: Job
metadata: { name: db-migrate-<SHA>, namespace: agconn }
spec:
  backoffLimit: 0
  template:
    spec:
      containers:
        - name: migrate
          image: us-west1-docker.pkg.dev/<proj>/containers/api:<SHA>
          command: ["bash", "-c"]
          args: ["cd /app/packages/db && npx prisma migrate deploy && npx tsx scripts/seed-translations.ts && npx tsx scripts/seed-lookups.ts"]
          envFrom: [{ secretRef: { name: agconn-env } }]
```

The pipeline waits on `kubectl wait --for=condition=complete job/db-migrate-<SHA>` before flipping any Deployment. A failed migration fails the deploy and leaves the previous image rollout intact.

Init Container was rejected because every web/admin/api pod would re-run migrations on every restart — a Job runs once per release.

## Observability

- **GCP Cloud Logging** — stdout from every pod is collected automatically. Structured JSON logs from each service flow through this.
- **Sentry** — initialized in `apps/web`, `apps/admin`, `services/api`, `services/audit-retention`, `services/audit-verifier`. Release is tagged with `GITHUB_SHA` so regressions bisect to a commit.
- **Cloud Monitoring dashboards** — request rate, error rate, P50/P99 latency, HPA replica counts. Custom dashboards are TODO; default GKE cluster overview is sufficient day-1.
- **Lighthouse CI** — runs on PRs that touch `apps/web/`, gates Perf ≥80 / A11y ≥95 / SEO ≥95 on top public pages.

In-cluster Prometheus/Grafana was rejected at MVP — Cloud Logging + Sentry cover the diagnostic surface, and a Prometheus stack adds two pods worth of memory pressure on a small cluster.

## Backups

- **Supabase Postgres PITR** — 7-day retention (Pro tier).
- **Supabase Storage** — object versioning enabled. Cert PDFs are immutable after first write.
- **GitHub repository** — single source of truth for all manifests, Terraform, and code. Loss of the cluster is a `terraform apply` + `gh workflow run deploy.yml` away.

## Cost estimate (rough, MVP)

| component                                     | monthly   |
| --------------------------------------------- | --------- |
| GKE control plane (zonal, ~$0.10/hr)          | $73       |
| 1× e2-small system + 1× e2-medium app on-demand | ~$45    |
| Worker pool (spot, scales 0–N; ~50% utilization) | ~$10  |
| Static IP                                     | $3        |
| Cloud Logging (50GB ingest)                   | $25       |
| Supabase Pro (Postgres + Storage)             | $25       |
| Bandwidth                                     | $20       |
| **Total**                                     | **~$200** |

External services (Twilio, Resend, Stripe, Anthropic, Clerk, Sentry) bill separately based on usage.
