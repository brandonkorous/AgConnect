# 10 — Infra & CI/CD: Architecture & Manifests

This file describes the cluster topology and Kubernetes manifest structure. There is no DB schema specific to infra.

## AKS namespaces

| namespace        | purpose                                     |
| ---------------- | ------------------------------------------- |
| `agconn-prod`    | production                                  |
| `agconn-staging` | staging — mirror of prod config             |
| `pr-<id>`        | per-PR preview, auto-deleted on PR close    |
| `cert-manager`   | cert-manager + Let's Encrypt                |
| `ingress-nginx`  | Nginx Ingress controller                    |
| `monitoring`     | Prometheus / Grafana (or use Azure Monitor) |

## Deployments

### web

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: web, namespace: agconn-prod }
spec:
  replicas: 2          # HPA scales 2..10
  template:
    spec:
      imagePullSecrets: [{ name: ghcr-pull }]
      containers:
        - name: web
          image: ghcr.io/agconn/web:<SHA>
          ports: [{ containerPort: 3000 }]
          env:
            - name: NEXT_PUBLIC_API_URL ; value: https://api.agconn.com
            - name: CLERK_PUBLISHABLE_KEY ; valueFrom: { secretKeyRef: { name: clerk-keys, key: pub } }
          resources:
            requests: { cpu: 200m, memory: 256Mi }
            limits:   { cpu: 1000m, memory: 768Mi }
          readinessProbe: { httpGet: { path: /api/health, port: 3000 }, initialDelaySeconds: 5 }
          livenessProbe:  { httpGet: { path: /api/health, port: 3000 }, initialDelaySeconds: 30 }
```

### api

Similar shape; runs `node apps/api/dist/index.js`. Env includes `DATABASE_URL`, `CLERK_SECRET_KEY`, `RESEND_API_KEY`, `TWILIO_AUTH_TOKEN`, all from Key Vault via CSI.

### admin

Internal only; ingress uses Cloudflare Access or Azure AD authentication (Key Vault-managed) before reaching the pod.

### workers

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: workers, namespace: agconn-prod }
spec:
    replicas: 1 # HPA can scale 1..5 based on pg-boss queue depth (custom metric)
    template:
        spec:
            containers:
                - name: workers
                  image: ghcr.io/agconn/workers:<SHA>
                  command: ['node', 'apps/workers/dist/index.js']
                  env: { ... DB and queue creds ... }
```

## Services

```yaml
- web: ClusterIP, port 80 → 3000
- api: ClusterIP, port 80 → 3000
- admin: ClusterIP, port 80 → 3000
```

Workers have no Service — they only connect outbound (DB + Twilio + Resend + Anthropic).

## Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
    name: agconn
    namespace: agconn-prod
    annotations:
        cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
    ingressClassName: nginx
    tls:
        - hosts: [agconn.com, www.agconn.com, api.agconn.com, admin.agconn.com]
          secretName: agconn-tls
    rules:
        - host: agconn.com
          http: { paths: [{ path: /, pathType: Prefix, backend: { service: { name: web, port: { number: 80 } } } }] }
        - host: www.agconn.com
          http: { paths: [{ path: /, pathType: Prefix, backend: { service: { name: web, port: { number: 80 } } } }] }
        - host: api.agconn.com
          http: { paths: [{ path: /, pathType: Prefix, backend: { service: { name: api, port: { number: 80 } } } }] }
        - host: admin.agconn.com
          http: { paths: [{ path: /, pathType: Prefix, backend: { service: { name: admin, port: { number: 80 } } } }] }
```

`www.agconn.com` 301-redirects to `agconn.com` via an Nginx annotation.

## HorizontalPodAutoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web-hpa, namespace: agconn-prod }
spec:
    scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: web }
    minReplicas: 2
    maxReplicas: 10
    metrics:
        - type: Resource
          resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```

API and workers similar. Workers scale on a custom metric: `pg_boss_queue_depth` exposed via a Prometheus exporter sidecar.

## Secrets via Azure Key Vault + CSI

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata: { name: agconn-secrets, namespace: agconn-prod }
spec:
  provider: azure
  parameters:
    keyvaultName: agconn-prod-kv
    objects: |
      array:
        - |
          objectName: DATABASE-URL
          objectType: secret
        - |
          objectName: CLERK-SECRET-KEY
          objectType: secret
        - ...
  secretObjects:
    - secretName: app-secrets
      type: Opaque
      data:
        - objectName: DATABASE-URL ; key: DATABASE_URL
        - objectName: CLERK-SECRET-KEY ; key: CLERK_SECRET_KEY
```

The Deployment then `envFrom`s `app-secrets`. Pods get fresh secret values at start; no plaintext on disk.

## Database init

Migrations run in an init container before the api Deployment becomes Ready:

```yaml
initContainers:
    - name: prisma-migrate
      image: ghcr.io/agconn/api:<SHA>
      command: ['sh', '-c', 'pnpm --filter db prisma migrate deploy && node scripts/log-migration.mjs $GITHUB_SHA']
      envFrom: [{ secretRef: { name: app-secrets } }]
```

If the migration fails, the pod doesn't start. Rolling deploy preserves the previous version.

## Monitoring

- **Azure Monitor for containers** enabled on the AKS cluster — handles cluster-level metrics + log aggregation.
- **Sentry SDK** initialized in `apps/api`, `apps/web`, `apps/admin`, `apps/workers`. Each release is tagged with the `GITHUB_SHA`.
- **Custom dashboards** in Azure Monitor: API request rate, error rate, P50/P99 latency; Worker queue depth, processing latency; web Core Web Vitals (via real-user monitoring SDK).

## Backups

- **Azure Postgres PITR** — 7-day retention, geo-redundant.
- **Supabase Storage** — object versioning enabled; nightly snapshot of the bucket inventory exported to a separate S3-compatible cold-storage bucket for disaster recovery.
- **Key Vault** — soft-delete + purge protection enabled.

Postgres + Key Vault backups are managed by Azure; storage backups orchestrated by Supabase + a small nightly job.

## Cost estimate (rough, MVP)

| component                             | monthly   |
| ------------------------------------- | --------- |
| AKS (3 × Standard_DS2_v2 nodes)       | $230      |
| Azure Postgres Flexible (2 vCPU, 8GB) | $130      |
| Supabase Storage (50 GB)              | $2        |
| Azure Key Vault                       | $5        |
| Bandwidth                             | $20       |
| **Total**                             | **~$390** |

External services (Twilio, Resend, Stripe, Anthropic, Clerk, Sentry) bill separately based on usage.
