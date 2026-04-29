# 10 — Infra & CI/CD: Acceptance Criteria

## Functional

- [ ] AKS cluster provisioned with: Nginx Ingress, cert-manager, Azure Monitor for containers, Key Vault CSI driver.
- [ ] All four apps (web, api, admin, workers) deploy as Kubernetes Deployments with HPA configured.
- [ ] All secrets sourced from Azure Key Vault via CSI; no plaintext secrets in manifests or GitHub repo.
- [ ] TLS certificates auto-provisioned via cert-manager + Let's Encrypt for: agconn.com, www.agconn.com, api.agconn.com, admin.agconn.com, \*.preview.agconn.com.
- [ ] Push to `main` triggers: build → push images → deploy to staging → manual approval gate → deploy to prod.
- [ ] Per-PR preview environments deploy to `pr-<id>.preview.agconn.com` within 10 minutes of PR open and tear down on PR close.
- [ ] Database migrations run as Init Container before api Deployment becomes Ready; failed migrations block rollout.
- [ ] Rolling deploy: zero downtime under normal load (verified with continuous probe during deploy).
- [ ] `kubectl rollout undo` restores the previous image within 2 minutes.

## Non-functional

- [ ] Build time (single app, fresh cache) < 5 minutes.
- [ ] Build time (incremental, warm cache) < 90 seconds.
- [ ] Total `main` → prod time < 15 minutes (excluding manual approval wait).
- [ ] HPA scales web from 2 to 10 pods under sustained 70% CPU.
- [ ] Cluster handles 1000 RPS to api with P99 latency < 500ms (load test before launch).

## Security

- [ ] Pod Security Standards: `restricted` profile enforced via labels on all namespaces.
- [ ] No privileged containers, no host-network, no host-path mounts.
- [ ] Container images scanned by Trivy in CI; high/critical vulnerabilities fail the build.
- [ ] Secrets never logged: pre-commit hook + grep CI step blocks committing files matching `.env*`, `*.pem`, etc.
- [ ] Network policies restrict pod-to-pod traffic to declared paths (web → api, api → DB, workers → DB+external).
- [ ] Admin ingress fronted by Cloudflare Access OR Azure AD authentication before pod.

## Observability

- [ ] Sentry receives errors from web, api, admin, workers — each tagged with the deployed `GITHUB_SHA`.
- [ ] Azure Monitor dashboards: API request rate, error rate, latency P50/P99; pg-boss queue depth; pod CPU/memory.
- [ ] Lighthouse CI runs on every PR; thresholds (SEO ≥ 95, Perf ≥ 80, A11y ≥ 95) gate merge.
- [ ] Alerts: PagerDuty for: P0 production error spike, queue depth > 5000, DB CPU > 80% sustained 5 min.

## Test scenarios

### Manual smoke

1. Open a PR → preview URL works within 10 minutes → close PR → namespace deleted within 5 minutes.
2. Push a commit to `main` → CI green → staging deploy succeeds → manual approval → prod deploy succeeds.
3. Force a failed migration in a test branch → deploy to preview → init container fails → web Service unaffected (still running prior version).
4. `kubectl rollout undo deployment/web -n agconn-prod` → previous image deployed within 2 minutes.

### Load

1. k6 run hitting `api.agconn.com/v1/jobs` at 1000 RPS for 5 minutes → P99 < 500ms, error rate < 0.1%.
2. Drop in 10000 pg-boss SMS jobs → queue drains within 5 minutes; HPA scales workers up.

### DR

1. Simulate Postgres failover (Azure-managed) → API healthy within 30 seconds.
2. PITR restore drill: restore a backup to a temp DB, run integration tests against it.

## Definition of done

- AKS cluster provisioned and documented in `infra/README.md`.
- Helm umbrella chart with values per environment (`values-{dev,staging,prod,preview}.yaml`).
- All workflows green on initial commit.
- Runbook documents: how to deploy, how to roll back, how to scale, how to update a secret, how to handle a P0 incident.
- On-call rotation set in PagerDuty.
