# 10 — Infra & CI/CD: Edge Cases & Risks

## Image registry rate limits

GHCR has rate limits on unauthenticated pulls. AKS pulls authenticated, but bursts during a multi-pod rollout can stress.

**Mitigation:**

- Configure imagePullSecret per namespace.
- HPA scaling adds pods one at a time on a deploy; large bursts handled by Kubernetes' default pull-throttle.

## Failed migration mid-deploy

Migration succeeds in staging but fails in prod (different data shape).

**Mitigation:**

- Init container failure prevents the new pods from going Ready; old pods continue serving.
- Sentry alert fires; on-call manually reverses the migration via `psql` and the rollback SQL committed in the migration folder.

> **Inferred:** Failed migrations are rare with `prisma migrate dev` discipline + staging → prod gate. Most failures will surface in staging first. Build the rollback SQL muscle anyway.

## Secrets rotation

Twilio auth token, Resend API key, etc. need periodic rotation.

**Process (manual, MVP):**

1. Generate new token in provider.
2. Add new value as a new version in Key Vault.
3. CSI driver picks up the new value within 1 minute (CSI auto-rotation enabled).
4. Pods restart on a rolling restart trigger to pull the new secret (`kubectl rollout restart deployment/api -n agconn-prod`).
5. Revoke old token in provider.

Document rotation cadence (quarterly) in runbook.

## TLS cert renewal failure

Let's Encrypt rate-limit hit, or DNS challenge fails.

**Mitigation:**

- cert-manager retries automatically with backoff.
- Alert on cert expiry < 14 days.
- Fallback: self-signed cert held in Key Vault for emergency use (allows web traffic to continue in degraded mode while LE issue investigated).

## Cluster upgrade

AKS minor version upgrade.

**Process:**

- Plan upgrade in staging first; run full test suite against staging before upgrading prod.
- Use surge upgrade strategy (1 extra node) so workload capacity preserved.
- Off-peak windows.

## DNS misconfiguration

Wrong DNS record points production traffic to staging or to nothing.

**Mitigation:**

- DNS managed via Terraform (or Azure DNS) in the same repo as infra.
- Changes go through PR review.
- Health check + smoke test in `deploy.yml` catches a bad rollout.

## GitHub Actions outage

GHA can be slow or unavailable.

**Mitigation:**

- Self-hosted runners are an option (extra ops burden); not for MVP.
- Manual deploy script (`pnpm deploy:prod`) as a fallback — runs the same Helm command from a developer's machine using their `kubectl` context. Documented in runbook.

## PgBouncer config drift

Connection limits on PgBouncer must match the sum of pod connection limits.

**Mitigation:**

- PgBouncer config also in Helm chart; values-prod.yaml has the right limits.
- Alert if Prisma reports `connection_limit` errors.

## Costs runaway

A misconfigured HPA scales aggressively and Azure bill spikes.

**Mitigation:**

- Set `maxReplicas` conservatively (10 for web, 5 for api, 5 for workers).
- Azure cost alert: $1000/month for the resource group → email on-call.
- Monthly cost review.

## Preview environment quota

Many open PRs create many namespaces; cluster resources finite.

**Mitigation:**

- Preview deployments use minimal resources (`replicas: 1`, lower CPU/memory requests).
- Auto-cleanup on PR close.
- Hard cap: > 10 preview namespaces → block new previews; alert on-call to prune stale ones.

## Sentry quota

Sentry has event quotas; an error storm can exhaust the monthly quota in hours.

**Mitigation:**

- Sentry rate limits configured.
- Sample non-error transactions at 10%.
- Alert at 80% quota consumed.

## Image vulnerability discovery post-deploy

A CVE is published for a base image after deploy.

**Mitigation:**

- Trivy scans run in CI (build-time).
- Weekly scheduled scan of `latest` images via `trivy image` workflow.
- Critical CVE → emergency rebuild with patched base image.

## Database backup restore drift

Backup taken at T0; restored at T1; some app code at T1 isn't compatible with the T0 schema (or vice versa).

**Mitigation:**

- Keep a record of `migration_log` entries; on restore, reconcile by applying any migrations that were rolled forward.
- DR drill quarterly: restore a backup, run app pods against it, fix any issues.

## Worker process crash loop

A single bad job poisons the queue (e.g., parser worker hits a bug on a specific PDF).

**Mitigation:**

- pg-boss retry limit (3) and `failed_exhausted` status.
- Worker process catches errors per-job, never crashes the whole worker.
- Sentry alert on `failed_exhausted` rate spike.

## Open questions

1. Multi-region failover — when does AGCONN's growth justify a second region? Probably never for an MVP-scale Central Valley platform; revisit if expanding nationally.
2. Self-hosted runners for cost control — when do GHA bills justify the ops overhead? Probably never for MVP.
3. Service mesh (Linkerd/Istio) — not needed at MVP scale; revisit at 20+ services.
4. Database read replicas — when do KPI dashboards and worker search justify? Probably 6 months in.
