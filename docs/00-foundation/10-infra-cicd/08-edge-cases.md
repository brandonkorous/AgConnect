# 10 — Infra & CI/CD: Edge Cases & Risks

## Artifact Registry rate limits

Artifact Registry has generous quotas; bursts during multi-pod rollout are not a concern at MVP scale. Authenticated pulls are gated by Workload Identity.

**Mitigation:**

- WI binding on `agconn/agconn` ServiceAccount → AR Reader role; no `imagePullSecrets` needed.
- HPA scaling adds pods one at a time on a deploy; large bursts handled by Kubernetes' default pull-throttle.

## Failed migration mid-deploy

Migration succeeds in dev but fails in prod (different data shape).

**Mitigation:**

- The `db-migrate-<SHA>` Job runs **before** the kustomize apply step. Job failure exits the workflow before any Deployment is updated; the previous version keeps serving.
- Workflow dumps Job logs on failure so the failed migration is in the GitHub Actions run output.
- Sentry alert fires on the Job pod's error logs. On-call manually reverses the migration via `psql` and the rollback SQL committed in the migration folder.

## Secrets rotation

Twilio auth token, Resend API key, Stripe webhook secret, Clerk keys, etc.

**Process (manual, MVP):**

1. Generate new value in the provider.
2. Update the corresponding GitHub Actions secret.
3. Trigger a deploy (`gh workflow run deploy.yml`). Each deploy rewrites the `agconn-env` K8s Secret via `kubectl create secret --dry-run | apply`.
4. Pods that read the rotated value need a rolling restart: `kubectl rollout restart deployment/<name> -n agconn`.
5. Revoke old value in provider.

A future CSI-backed secret store (GCP Secret Manager + secret-store-csi-driver) would automate steps 3–4. Not on the MVP path — the GH-secret-to-K8s-Secret pattern is simpler and audited via the GH Actions run log.

## TLS cert renewal failure

Let's Encrypt rate-limit hit, or Cloudflare DNS01 challenge fails.

**Mitigation:**

- cert-manager retries automatically with exponential backoff.
- Sentry alert on `cert-manager` namespace error log entries.
- Cloudflare API token has DNS edit scope only; rotated via the same process as other secrets.

## Cluster upgrade

GKE Standard auto-upgrades follow the `REGULAR` release channel.

**Process:**

- Auto-upgrade off-peak; surge upgrade strategy (`max_surge: 1`) preserves workload capacity.
- Pin to `STABLE` channel before any high-stakes window (paying tenants growing, regulator engagement, etc.).
- Monitor cluster events via Cloud Logging during the upgrade window.

## DNS misconfiguration

Wrong DNS record points production traffic to staging or to nothing.

**Mitigation:**

- DNS managed via Terraform (`infra/terraform/dns.tf`) — same repo as infra; changes go through PR review.
- Static ingress IP in Terraform; DNS A record points at it. Drift between Terraform and Cloudflare is detected by `terraform plan`.
- `rollout status` in `deploy.yml` catches a bad pod, but DNS bugs need manual smoke-test post-deploy.

## GitHub Actions outage

GHA can be slow or unavailable.

**Mitigation:**

- Manual deploy fallback: a developer with `kubectl` context can run the same commands the workflow runs (`kubectl apply -k deploy/k8s/overlays/prod`, image tags already pushed to AR).
- Document the manual procedure in `deploy/README.md`.
- Self-hosted runners not on the MVP path.

## PgBouncer / pooler config drift

Connection limits on the Supabase pooler must accommodate the sum of pod connection limits (Prisma defaults to 10 per pod).

**Mitigation:**

- Supabase Pro tier ships with sufficient pooler capacity for current pod counts.
- Alert if Prisma reports `connection_limit` errors via Sentry.
- Use the pooler URL for the `DATABASE_URL` and the direct URL only for `DIRECT_URL` (used by `prisma migrate`).

## Costs runaway

A misconfigured HPA scales aggressively and the GCP bill spikes.

**Mitigation:**

- `maxReplicas` set conservatively (2 for web, 2 for api) — current load is well below the floor.
- GCP billing alert at $500/month for the project → email.
- Worker pool floor is `min_node_count = 0` on spot; idle queues cost nothing.

## Preview environment quota *(planned, Phase 6 gap 6.7)*

Many open PRs create many namespaces; cluster resources are finite.

**Planned mitigation:**

- Preview deployments use minimal resources (`replicas: 1`, half the prod CPU/memory requests).
- Auto-cleanup on PR close via the `preview.yml` workflow.
- Hard cap: > 10 preview namespaces → block new previews; alert via Sentry.

## Sentry quota

Sentry has event quotas; an error storm can exhaust the monthly quota in hours.

**Mitigation:**

- `tracesSampleRate: 0.1` in prod for every service.
- Replay session rate `0.1` on web; `1.0` only on error.
- Sentry-side rate limits and spike protection configured at the project level.

## Image vulnerability discovery post-deploy

A CVE is published for a base image after deploy.

**Mitigation:**

- Trivy scans every image after push in `deploy.yml`; HIGH/CRITICAL + fix-available fails the deploy.
- Trivy `ignore-unfixed: true` keeps the gate actionable — CVEs without an upstream patch can't be remediated by a rebuild.
- Periodic dependency bumps via Renovate or Dependabot keep base images current. *(not yet wired.)*

## NetworkPolicy gotcha *(currently inert)*

NetworkPolicy resources are silently ignored unless `network_policy.enabled = true` at the cluster level (or Dataplane V2 is enabled). At MVP we leave this `false` — the manifests in `deploy/k8s/base/network-policy.yaml` are staged but do nothing. See Phase 6 item 6.9b in [GAP-CLOSURE-PLAN.md](../../GAP-CLOSURE-PLAN.md) for the deferral rationale and trigger.

**When the cluster setting is flipped:**

- Verify with `kubectl describe networkpolicy default-deny-ingress -n agconn` — `Annotations: networking.gke.io/policy` shows the active provider.
- Smoke test: `kubectl exec -n agconn deploy/web -- curl -m 5 http://api.agconn:80/health` from a non-allowed source should fail.
- Plan the cluster change as a maintenance window — enabling Calico recycles every node pool.

## Database backup restore drift

Backup taken at T0; restored at T1; some app code at T1 isn't compatible with the T0 schema (or vice versa).

**Mitigation:**

- Keep a record of `_prisma_migrations` rows; on restore, reconcile by applying any migrations that were rolled forward.
- DR drill quarterly: restore a Supabase PITR snapshot to a temp project, run integration tests against it.

## Worker process crash loop

A single bad job poisons the queue (e.g., parser worker hits a bug on a specific PDF).

**Mitigation:**

- pg-boss retry limit (3) and `failed_exhausted` status.
- Every worker catches errors per-job; the worker process never exits on a bad job.
- Sentry alert on `failed_exhausted` rate spike.

## Spot node preemption mid-job

Worker node preempted while a pg-boss job is in flight.

**Mitigation:**

- pg-boss leases jobs with a visibility timeout. If the worker dies, the job becomes re-fetchable after the timeout.
- All worker handlers are idempotent (Twilio idempotency key, Resend idempotency key, parser keyed on resume hash, cert keyed on enrollment id).
- Min=0 / max=N autoscale on the worker pool means a fresh node is provisioned within ~1 minute.

## Open questions

1. **Preview environments** — namespace-per-PR on the prod cluster vs. tiny dedicated cluster; reuse prod Supabase with per-PR `tenant_id` namespace vs. issue per-PR Supabase branches. *(Phase 6 gap 6.7.)*
2. **Multi-region failover** — when does AGCONN's growth justify a second region? Probably never for an MVP-scale Central Valley platform; revisit if expanding beyond CA.
3. **Self-hosted runners** for cost/perf control — Probably never for MVP.
4. **Service mesh** (Linkerd/Istio) — not needed at MVP scale; revisit at 20+ services.
5. **Database read replicas** — when do KPI dashboards and worker search justify? Probably 6+ months in.
