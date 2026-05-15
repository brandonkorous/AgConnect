# 10 — Infra & CI/CD: Acceptance Criteria

## Functional

- [x] GKE Standard zonal cluster (`us-west1-a`) provisioned via Terraform with three node pools: `system` (e2-small on-demand, fixed 1), `app` (e2-medium on-demand, autoscale 1–3, tainted `pool=app`), `worker` (e2-small spot, autoscale 0–N).
- [x] nginx-ingress controller + cert-manager + Cloudflare DNS01 ClusterIssuer bootstrapped declaratively via Terraform null-resources pinned to upstream manifest versions.
- [x] Artifact Registry repository in `us-west1` + Workload Identity Federation provider for GitHub Actions; no static service-account keys in CI.
- [x] All apps + services deploy as `Deployment`s with `envFrom: secretRef: agconn-env` and `envFrom: configMapRef: agconn-config`; web and api have HPA (cpu=70%, 1–2 replicas).
- [x] All runtime secrets sourced from GitHub Actions secrets → applied as the `agconn-env` K8s Secret each deploy; no plaintext secrets in manifests or repo.
- [x] TLS certificates auto-provisioned via cert-manager + Let's Encrypt for: `agconn.com`, `www.agconn.com`, `api.agconn.com`, `admin.agconn.com`.
- [x] Push to `main` triggers: build matrix → migrate Job → kustomize apply → rollout status for every Deployment. *(Trivy scan step deferred — see 6.8.)*
- [ ] Per-PR preview environments deploy to `pr-<id>.preview.agconn.com` within 10 minutes of PR open and tear down on PR close. *(planned — Phase 6 gap 6.7.)*
- [x] Database migrations run as a one-shot `Job` (not Init Container) before the kustomize apply step; failed migrations dump logs and exit 1, leaving the previous rollout intact.
- [x] Rolling deploy: zero-downtime under normal load — every Deployment uses `maxSurge: 1, maxUnavailable: 0` and a readiness probe.
- [x] `kubectl rollout undo deployment/<name>` restores the previous image within 2 minutes.

## Non-functional

- [x] Build time per service (warm GHA cache) < 90 seconds.
- [x] Build time per service (cold cache) < 5 minutes.
- [x] Total `main` → prod time < 15 minutes (excluding manual approval wait).
- [x] HPA scales web/api from 1 to 2 replicas under sustained 70% CPU.
- [ ] Load test before launch: 1000 RPS to api with P99 < 500ms. *(not yet executed)*

## Security

- [x] Pod Security Standards: `enforce: restricted` on the `agconn` namespace; pod-level `runAsNonRoot: true`, non-zero `runAsUser`, `seccompProfile: RuntimeDefault`; container-level `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`.
- [x] No privileged containers, no host-network, no host-path mounts.
- [ ] Container images scanned by Trivy after push; HIGH/CRITICAL with `ignore-unfixed: true` fails the deploy. *(Deferred until real users hit prod — see Phase 6 item 6.8 in [GAP-CLOSURE-PLAN.md](../../GAP-CLOSURE-PLAN.md).)*
- [~] NetworkPolicy default-deny ingress on `agconn` namespace; scoped allow rules for ingress-nginx → web/api/admin and intra-namespace → api. *(Manifests staged but inert — cluster-level `network_policy.enabled = false`. Enable when business demand justifies the node-pool recycle; see Phase 6 item 6.9b in [GAP-CLOSURE-PLAN.md](../../GAP-CLOSURE-PLAN.md).)*
- [x] Workload Identity Federation: no long-lived GCP keys in GH secrets.
- [x] Cloudflare WAF in front of all public hostnames (orange-cloud proxied).
- [ ] Admin ingress restricted to Cloudflare Access or IP allowlist. *(currently relies on Clerk admin instance auth — acceptable but a defense-in-depth gap.)*

## Observability

- [x] Sentry receives errors from web, admin, api, audit-retention, audit-verifier; events tagged with `release = GITHUB_SHA` and `environment = APP_ENV`.
- [x] GCP Cloud Logging collects stdout from every pod; structured JSON logs flow through.
- [x] Lighthouse CI runs on PRs touching `apps/web/`; thresholds Perf ≥80 / A11y ≥95 / SEO ≥95 gate merge.
- [ ] Cloud Monitoring dashboards: API request rate, error rate, latency P50/P99; pg-boss queue depth; pod CPU/memory. *(default GKE dashboards only; custom dashboards TODO.)*
- [ ] Alerts: P0 production error spike, queue depth > 5000, DB CPU > 80% sustained 5 min. *(not yet configured.)*

## Test scenarios

### Manual smoke

1. Push a commit to `main` → build matrix green → migrate Job succeeds → prod deploy succeeds → all rollouts converge within 15 min.
2. Force a failed migration in a test branch → deploy run → migrate Job exits 1 → kustomize apply step is not reached → previous version still serving.
3. `kubectl rollout undo deployment/web -n agconn` → previous image deployed within 2 minutes.
4. Open a PR touching `apps/web/` → Lighthouse CI runs → fails if any threshold regresses → must fix before merge.

### Load

1. k6 run hitting `api.agconn.com/v1/landing/jobs` at 1000 RPS for 5 minutes → P99 < 500ms, error rate < 0.1%. *(pre-launch run pending.)*
2. Drop 10k pg-boss SMS jobs → queue drains within 5 minutes; spot worker pool autoscaler brings up nodes.

### DR

1. Supabase Postgres failover drill — API healthy within 60 seconds (Supabase-managed).
2. PITR restore drill: restore a snapshot to a temp DB, run integration tests against it.

## Definition of done

- [x] GKE cluster provisioned and documented in `infra/terraform/README.md`.
- [x] Kustomize base + prod overlay covering every app + service.
- [x] All four production workflows (`ci`, `deploy`, `lighthouse`, `resume-parser-eval`) green.
- [ ] Preview workflow shipped. *(Phase 6 gap 6.7.)*
- [ ] Runbook: how to deploy, how to roll back, how to scale, how to update a secret, how to handle a P0 incident. *(deploy/README.md exists; expand into a full runbook before scale.)*
- [ ] On-call rotation set up. *(deferred until paying tenants exist.)*
