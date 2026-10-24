# Deploy

AGCONN runs on the shared sparx AKS cluster `aks-sparx-prod-cus` (resource group
`rg-sparx-prod-cus`), namespace `agconn`, co-tenant with sparx, jotacular,
kanNINJA and SilicaUI. Every push to `main` runs
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml): it builds
eleven images, pushes them to GHCR, migrates the schema, and rolls everything out.

The GKE + Artifact Registry stack this replaced is retired. The why and the
migration record are in
[`docs/00-foundation/10-infra-cicd/09-azure-migration.md`](../docs/00-foundation/10-infra-cicd/09-azure-migration.md).
`infra/terraform/` still holds the old GCP code; it is dead and is not applied.

## Topology

```
agconn.com / www  ─┐
api.agconn.com    ─┼─ Cloudflare ─ Caddy (sparx-prod ns, 20.12.217.0) ─ Services in ns agconn
admin.agconn.com  ─┘

Deployments: web, admin, api, email-worker, sms-worker, scheduler,
             flc-verifier, resume-parser, cert-generator (all replicas: 1, no KEDA)
CronJobs:    audit-retention (02:00 UTC), audit-verifier (03:00 UTC),
             flc-sweep (04:00 UTC), flc-mspa-sync (04:30 UTC)
```

- TLS and routing come from the shared Caddy proxy. Route blocks live in the
  sparx.works repo (`k8s/ingress/Caddyfile`). Each hostname must also be in
  api-rest's `PLATFORM_HOSTNAMES`, or on-demand TLS is denied and Cloudflare
  returns 525.
- No cert-manager, nginx-ingress or KEDA on this cluster.
- Postgres and object storage stay on Supabase, reached over the internet.
  Migrations and audit HMAC roles live under `packages/db/prisma/migrations`.

## Images

`ghcr.io/brandonkorous/agconn-<name>` (hyphenated, not `agconn/<name>`). The
cluster pulls anonymously, so every package must be **public**. A pod in
`ImagePullBackOff` with a 401 means a package went private; check that first.

## Auth and secrets

- GitHub Actions signs in to Azure with OIDC workload identity federation for
  `repo:brandonkorous/AgConnect:ref:refs/heads/main`. The `AZURE_*` values are
  repository **variables**, not secrets.
- Runtime secrets come from Key Vault `kv-agconn-prod-cus`. A secret named
  `FOO_BAR` is stored as `FOO-BAR`. The deploy identity can read, never write.
  Set or rotate one (human step):

  ```bash
  az keyvault secret set --vault-name kv-agconn-prod-cus --name FOO-BAR --value '...'
  ```

  The next deploy rebuilds the `agconn-env` Secret and restarts the pods whose
  Secret changed. The full list of names is in [`../actionsecrets.md`](../actionsecrets.md).

## What a deploy does

1. Reads build-time values from Key Vault and builds the eleven images in parallel.
2. Pushes each image to GHCR with the commit SHA tag.
3. Gets AKS credentials, applies the namespace, ServiceAccount and ConfigMap.
4. Rebuilds the `agconn-env` Secret from Key Vault.
5. Runs the `db-migrate-<sha>` Job and waits; the deploy stops if it fails.
6. Pins image tags and runs `kubectl apply -k deploy/k8s/overlays/prod`.
7. Restarts Deployments whose Secrets changed, then waits for every rollout.
8. Pings IndexNow with the sitemap URLs.

## Local testing of the docker images

```bash
docker build -f apps/web/Dockerfile -t agconn-web:dev .
docker build -f services/api/Dockerfile -t agconn-api:dev .
docker run --rm -p 3000:3000 --env-file .env agconn-web:dev
docker run --rm -p 3001:3001 --env-file .env --network host agconn-api:dev
```

## Rollback

Revert the commit on `main` and let the deploy run. That is the normal path.
Database migrations are forward-only: if one breaks production, write a
follow-up migration that reverses it. Never `prisma migrate reset` in prod.
Supabase keeps daily backups with 7-day point-in-time recovery.

## Not in this setup

- Preview environments per PR.
- A staging environment. Mitigations: additive-only migrations and fast revert.
- Multi-region failover.

## Retired: the GCP deployment

The old GKE workload (`agconn-prod`, project `agconn`) must be deleted by a
human, with its secrets. While it runs it still calls the prod API (WizeLens:
`service:agconn-api @client.address:34.83.207.221`, release `5dcdeb0`).
