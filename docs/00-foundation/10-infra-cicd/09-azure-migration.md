# 09 — Azure migration: AGCONN onto the sparx AKS cluster

Research pass, 2026-08-26. Every "verified" fact below was read from the live
subscription (`az` / `kubectl` against `13b32167-3051-4e00-8bbd-0f7d578a06eb`)
or from the sparx.works working tree, not from memory.

> **Update, 2026-10-29: the shared infrastructure has its own repository.**
> Everything this research places in the sparx.works repo now lives in
> **wize-infrastructure** (`wizeworksllc/wize-infrastructure`, local checkout
> `G:/code/@wizeworks/wize-infrastructure`) at the same paths:
> `terraform/envs/azure/agconn.tf`, `terraform/bootstrap-azure/agconn.tf`,
> `terraform/envs/azure/kanninja.tf` and `k8s/ingress/Caddyfile`. That repo's own
> release applies the Terraform (`envs/azure`, then `bootstrap-azure`) and the
> Caddy ingress, in minutes and without building any app images. sparx's release
> no longer applies Terraform, so an AGCONN infrastructure change no longer rides
> it, and the identity that provisions tenant vaults is wize-infrastructure's,
> not sparx's. The `PLATFORM_HOSTNAMES` allow-list (4.2) is still sparx code in
> `wizeworks/services/api-rest/src/routes/internal/domain-check.ts`. Read
> "sparx.works" and "sparx's release" below as wize-infrastructure wherever they
> refer to Terraform or Caddy. Open decision 2 in section 9 is answered: the
> Terraform lives in wize-infrastructure.

**Scope, as decided 2026-08-26.** AGCONN becomes the fourth co-tenant on
`aks-sparx-prod-cus`, alongside sparx, jotacular and kanNINJA. It gets its own
namespace, its own Key Vault, and its own Entra identity now. **The data layer
does not move**: Postgres and object storage stay on Supabase. The Azure
Postgres server and Storage Account are written into Terraform but held behind
an `agconn_enabled`-style flag, off, exactly as jotacular's own file argues —
"an empty vault and an idle server both look configured and are not."

This is therefore a **compute-only migration**, and that removes most of the
risk. Section 11 records what a later data move would involve, so the research
is not lost.

---

## 0. Verdict

The move is well-trodden. kanNINJA did it twice (AKS to GKE to AKS) and
jotacular did it once, and the pattern is written down in enough detail that
AGCONN's Terraform is close to a subset of
`terraform/envs/azure/kanninja.tf`. The delta between how AGCONN is built and
how this cluster works, with the data layer out of scope:

| AGCONN today | This cluster | Weight |
|---|---|---|
| ingress-nginx + cert-manager + Cloudflare DNS01 | Shared Caddy, on-demand TLS, cross-repo change | **Largest remaining** |
| KEDA scale-to-zero on three workers | **KEDA is not installed** | Medium — decision needed |
| Three node pools incl. spot, autoscaled | One 1-node pool, no autoscaler, no spot | Medium |
| ~45 GitHub Actions secrets | Key Vault | Medium — mechanical |
| GCP Workload Identity + Artifact Registry | Entra federated identity + GHCR | Small — mechanical |
| Supabase Postgres + Storage | **Unchanged** | None this pass |

Two things that would have been the hardest parts are now free. The
**50-connection ceiling** on this platform's Burstable Postgres does not apply,
because AGCONN keeps talking to Supabase's pooler. And there is **no data
migration**, so nothing has to be dumped, restored, or verified row-for-row.

There is also no live-traffic cutover to plan. `agconn.com`, `api.agconn.com`
and `admin.agconn.com` all resolve to Cloudflare and return a Cloudflare error
page (403) — there is no origin serving today. The Supabase project
(`hjgbvrgalwhoyjptwtuj`) is alive and holds the data. So this is a **first
deploy onto a new cluster**, not a cutover.

---

## 1. What the target actually is (verified)

```
Subscription  13b32167-3051-4e00-8bbd-0f7d578a06eb
Region        centralus
RG            rg-sparx-prod-cus
Cluster       aks-sparx-prod-cus   k8s 1.35   sku_tier Free (no SLA)
Node pool     system   1 x Standard_D4ads_v7   maxPods 110   220 GiB ephemeral OS disk
Allocatable   3860m CPU   13,966,060 Ki (~13.3 GiB)   110 pods
Requested     1802m (46%)   6978Mi (51%)          Pods: 54 / 110
Actual        296m (7%)     8626Mi (63%)
Namespaces    sparx-prod  jotacular  jotdojo  kanninja  silicaui  (+ kube-*)
VNet          vnet-sparx-prod-cus   10.20.0.0/16
  snet-aks              10.20.0.0/20
  snet-psql             10.20.16.0/28    psql-sparx-prod-cus
  snet-psql-jotacular   10.20.16.16/28   psql-jotacular-prod-cus
  snet-psql-kanninja    10.20.16.32/28   psql-kanninja-prod-cus
  (next free)           10.20.16.48/28   <- reserved for AGCONN, unused this pass
Vaults        kv-sparx-prod-cus  kv-jotdojo-prod-cus  kv-kanninja-prod-cus
Storage       stsparxprodcus  stjotdojoprodcus  stkanninjaprodcus  (+ tfstate)
```

What is **not** on this cluster, and this is the part that changes AGCONN's
manifests: **no ingress-nginx, no cert-manager, no KEDA, no Prometheus.**
Routing and TLS are one Caddy Deployment in `sparx-prod` behind a reserved
LoadBalancer IP (`20.12.217.0`), reaching every co-tenant's Services
cross-namespace. There is no cluster autoscaler and no spot pool.

---

## 2. The tenant contract

Reading `terraform/envs/azure/kanninja.tf` and `bootstrap-azure/kanninja.tf` end
to end, a co-tenant on this platform is exactly this and nothing more:

**Shared:** the cluster, the VNet, the Caddy ingress, the Terraform state
account.

**Owned per product:** a Key Vault, an Entra app registration with federated
GitHub credentials, a namespace — and, when the data layer is Azure-side, a
delegated `/28` subnet, a Postgres Flexible Server, a database, and a Storage
Account. AGCONN takes the first three now and reserves the rest.

**Split across two Terraform states, and the split is not stylistic.**
`terraform/envs/azure` is applied by sparx's release pipeline, which holds
subscription Contributor and nothing more. Contributor cannot grant roles, and a
directory app registration is tenant-wide rather than subscription-scoped. So
the app registration and every `azurerm_role_assignment` must live in
`terraform/bootstrap-azure`, which a human applies with Owner + directory
rights. jotDOJO's onboarding failed on exactly these two 403s after a green plan
and a green validate; the rule is now written in both files.

**The asymmetry worth preserving:** sparx's release identity holds
`Key Vault Secrets Officer` on the tenant vault (it *provisions*). The tenant's
own pipeline holds `Key Vault Secrets User` (it *deploys* — it can never rewrite
a credential it is about to ship).

---

## 3. Terraform to write

Two files in the **sparx.works** repo, modelled on kanNINJA's but considerably
shorter, because with Supabase staying there is almost nothing for Terraform to
generate.

### 3.1 `terraform/envs/azure/agconn.tf`

**Active this pass:**

| Resource | Value |
|---|---|
| `azurerm_key_vault.agconn` | `kv-agconn-prod-cus`, RBAC auth, 7-day soft delete, purge protection **false until launch**, `prevent_destroy` |

That is the whole active surface. `data.azurerm_client_config.current` already
exists at file scope in `jotacular.tf`, so it does not need re-declaring.

**Written but held at `agconn_data_enabled = false`,** so the later decision is
one variable rather than a design session:

| Resource | Value |
|---|---|
| `azurerm_subnet.agconn_postgres` | `snet-psql-agconn`, `10.20.16.48/28`, delegated to `Microsoft.DBforPostgreSQL/flexibleServers`, `service_endpoints = ["Microsoft.Storage"]` |
| `azurerm_postgresql_flexible_server.agconn` | `psql-agconn-prod-cus`, admin `agconn_owner`, private-only, `prevent_destroy` |
| `azurerm_postgresql_flexible_server_database.agconn` | `agconn`, `en_US.utf8` |
| `azurerm_storage_account.agconn` | `stagconnprodcus`, StandardV2/LRS/Hot, `allow_nested_items_to_be_public = false` |
| `azurerm_storage_container.*` | `job-photos`, `compliance-evidence`, `grant-reports`, `certs` |
| `random_password.agconn_owner` / `_app` | 32 chars, `override_special = "!#$%&*()-_=+[]{}<>:?"` |

Use **two** flags, not one: `agconn_enabled` (the vault and the identity, on) and
`agconn_data_enabled` (Postgres and storage, off). One flag would force the
choice between provisioning a $14/mo idle server and having no vault.

**Naming, checked against the constraints now so the deferred half does not
surprise anyone later:** `stagconnprodcus` is 15 chars (limit 24, lowercase
alphanumeric only, globally unique). `kv-agconn-prod-cus` is 18 (limit 24, must
start with a letter, globally unique DNS label). Both are free at time of
writing; confirm before applying.

**No `azure.extensions` entry is needed even when the data half turns on.**
Verified: grepping all 39 migrations for `CREATE EXTENSION` returns nothing, and
the only Postgres features used beyond core SQL are `gen_random_uuid()` and
`tsvector`, both built into PG 13+. `psql-kanninja-prod-cus` likewise carries an
empty value. Re-run before any future migration, because an unlisted extension
fails *inside the migration runner*, after roles exist and pods have rolled:

```bash
grep -rhoiE 'CREATE EXTENSION [^;]+' packages/db/prisma/migrations/
```

### 3.2 What goes in the vault

With the data layer staying, Terraform generates **nothing** — every secret is
human-set, including the four that would otherwise have been minted:

```
DATABASE_URL                  Supabase pooler, port 6543
DIRECT_URL                    Supabase direct, port 5432
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Plus Clerk (both instances), Twilio, Resend, Stripe (secret + webhook + 8 price
ids), Sentry, PostHog, Mapbox, Anthropic/OpenAI, and the AGCONN-generated
`AUDIT_HMAC_KEY`, `PARTICIPANT_PEPPER`, `ADMIN_BEARER_TOKEN`,
`WAITLIST_TOKEN_SECRET`, `INTERNAL_REVALIDATE_SECRET`, `CLERK_ENCRYPTION_KEY`.

Roughly 45 values, and every one exists today as a GitHub Actions secret — which
is **write-only and cannot be read back**, so they must be transcribed from
`.env` and the providers' own dashboards, not from GitHub. That property is the
whole reason this platform moved off Actions secrets: adding one key meant
reconstructing all of them from a copy kept somewhere else, and `gh secret set`
replaces.

### 3.3 `terraform/bootstrap-azure/agconn.tf`

App registration `gha-agconn-prod`, service principal, federated credentials,
and four role assignments (`Key Vault Secrets User` for the pipeline on
`kv-agconn-prod-cus`; `AKS Cluster User Role` at subscription scope; `Key Vault
Secrets Officer` for the applying human; `Key Vault Secrets Officer` for sparx's
release SP).

**The one thing that must be read, never assumed** — the OIDC subject prefix.
GitHub qualifies the `sub` claim with numeric owner/repo ids on newer
repositories and not on older ones, per repository, and no setting changes it:

```
kanninja   repo:brandonkorous/kanninja
jotacular  repo:brandonkorous@13042540/jotacular@1341839746
```

Read AGCONN's back before writing the credential:

```bash
gh api repos/brandonkorous/AgConnect/actions/oidc/customization/sub --jq .sub_claim_prefix
```

Entra matches byte for byte and, on a mismatch, reports only the subject it
*received* — never the one it expected. This cost jotDOJO a red release in one
direction and would have cost kanNINJA one in the other.

**Casing:** the local directory is `AgConnect` and `terraform.tfvars` records
`github_repository = "brandonkorous/AgConnect"`. Confirm what GitHub actually
serves; the OIDC claim carries canonical casing, and a browser resolves either
spelling, so the wrong one survives review and fails only at the token exchange.

---

## 4. Changes in the sparx.works repo (cluster side)

Two edits, both of which gate the first successful HTTPS request.

**4.1 `k8s/ingress/Caddyfile`** — an AGCONN section mirroring kanNINJA's:

```
{$SX_SCHEME:https}://agconn.com        -> web.agconn.svc.cluster.local:80
{$SX_SCHEME:https}://www.agconn.com    -> redir https://agconn.com{uri} permanent
{$SX_SCHEME:https}://api.agconn.com    -> api.agconn.svc.cluster.local:80
{$SX_SCHEME:https}://admin.agconn.com  -> admin.agconn.svc.cluster.local:80
```

Each block imports `tls_policy` (on-demand) and `security_headers`.

**4.2 `wizeworks/services/api-rest/src/routes/internal/domain-check.ts`** — add
all four hostnames to `PLATFORM_HOSTNAMES`.

These two are one change, not two. Caddy's on-demand TLS asks that endpoint
before issuing; a hostname routed but not allow-listed gets no certificate, and
Cloudflare returns 525. Do not use `tls_managed` here: Caddy is `replicas: 1` on
`Recreate`, so every boot has a window with no load-balancer backend and
certmagic spends its startup issuance attempts inside it — which is why
kanNINJA's four blocks were moved to on-demand.

**4.3 Cloudflare DNS** — the four records point at `20.12.217.0` (Caddy's
reserved LB IP), orange-clouded, and Cloudflare SSL mode must be **Full
(strict)**. AGCONN's own `infra/terraform/dns.tf` becomes dead once this
happens.

---

## 5. Changes in this repo

### 5.1 Nothing in the data layer

`packages/db`, `services/api/src/lib/supabase-storage.ts`,
`services/cert-generator/src/storage.ts` and every call site stay exactly as
they are. `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` change *source* (Key Vault instead of Actions
secrets) but not *value*.

Two consequences of that choice are worth stating rather than discovering.

**Cross-cloud latency, which improves rather than degrades.** Supabase is on
`aws-1-us-east-2` (Ohio). Today the documented topology runs from GKE
`us-west1-a` (Oregon) — a coast-to-coast hop on every query. AKS `centralus` is
substantially closer to Ohio, so this move *reduces* database round-trip time.
Worth measuring after Gate 6 rather than assuming a figure, but the direction is
clearly favourable. Note that `makeRlsClient` wraps every operation in a short
transaction, so each logical query costs more than one round trip and latency
compounds — which is exactly why the direction matters.

**Egress billing.** Database and storage traffic now leaves the Azure VNet
rather than staying inside a VPC. Azure bills outbound data transfer with a
monthly free allowance; at AGCONN's pre-launch volume this should sit inside or
near it, but it is a genuinely new line item and should be checked against the
first full month's bill rather than assumed to be zero.

### 5.2 The RLS finding, which this migration does not fix

Recording it here because it surfaced during the research and the Azure move
would have closed it as a side effect. Since the database is staying, it is now a
standalone item.

`DATABASE_URL` connects as Supabase's `postgres` role. That role carries
`BYPASSRLS`, and PostgreSQL exempts a `BYPASSRLS` role from every policy —
including `FORCE ROW LEVEL SECURITY`, which 18 of the 39 migrations set. **The
tenant isolation those policies describe is therefore not currently enforced by
the database**, only by the query layer, while every policy reads as though it
were.

The fix is the same on Supabase as it would have been on Azure: a restricted
role (`agconn_app`, `NOBYPASSRLS`, `NOSUPERUSER`) granted only what the
application needs, with `DATABASE_URL` pointed at it and the owner reserved for
migrations. `packages/db/src/rls.ts` needs no change — it uses
`set_config(..., true)` (transaction-local) and wraps every operation in a short
transaction, so it is already correct under a non-bypassing role and under
transaction-mode pooling.

Whatever the timing, the acceptance test is the same: open a session as the app
role, set `app.tenant_id` to tenant A, assert zero rows from tenant B. Without
that assertion the switch is only believed. **This is worth doing before real
worker data exists, not after** — it is a different task from this migration, and
it should be tracked as one.

### 5.3 KEDA — decide, do not assume

`deploy/k8s/base/keda-scaledobjects.yaml` scales `resume-parser`,
`cert-generator` and `flc-verifier` to zero off pg-boss queue depth. **KEDA is
not installed on this cluster**, and installing it is a cluster-wide act (CRDs,
an operator, roughly three pods, an upgrade obligation) affecting four products,
not one.

- **Run the three at `replicas: 1`.** Costs about 100m CPU / 704Mi of requests
  (section 6), which the node has. Delete the ScaledObjects, or keep them
  unapplied behind a Kustomize component. Simplest, and honest about the fact
  that scale-to-zero was buying money on a *spot node pool that no longer
  exists* — on a fixed single node, an idle pod costs nothing extra.
- **Install KEDA in `kube-system`.** Only worth it if another tenant wants it.

Recommend the first. Note that the `TriggerAuthentication` reads `DATABASE_URL`
out of the `agconn-env` Secret and queries the `pgboss.job` table — that would
work against Supabase unchanged, so the decision really is only about whether
KEDA belongs on this cluster.

### 5.4 Manifests

- **Images:** `us-west1-docker.pkg.dev/agconn/containers/*` becomes
  `ghcr.io/brandonkorous/agconn-*` (hyphenated, and **public**, so the kubelet
  pulls anonymously and nothing needs `imagePullSecrets` — the cluster
  convention). A pod in `ImagePullBackOff` with a 401 means the package
  visibility reverted to private; that is the first thing to check, not the tag.
- **Namespace:** `agconn`. Unchanged.
- **`ingress.yaml`:** delete. The `ClusterIssuer`, the three `Ingress` objects,
  and `agconn-*-tls` all belong to a controller that is not here.
- **`network-policy.yaml`:** `web-from-ingress` selects
  `namespaceSelector: kubernetes.io/metadata.name: ingress-nginx`. Retarget to
  `sparx-prod` (where Caddy runs) for all three web-facing rules, or the
  default-deny will make every route a timeout that looks like a routing bug.
  Also confirm nothing denies *egress* — with the data layer off-cluster, pods
  must reach Supabase over the internet. The current file declares only
  `policyTypes: [Ingress]`, so this is fine today; it is the kind of thing a
  later hardening pass breaks silently.
- **`service-account.yaml`:** plain SA, no GCP annotations. Nothing to change,
  but confirm nothing else assumes Workload Identity.
- **Node pool selectors and tolerations:** any `pool=app` / `pool=worker`
  `nodeSelector` or spot toleration must go — there is one untainted pool named
  `system`. A leftover selector leaves the pod `Pending` with a message about
  affinity.
- **`db-migrate-job.yaml`:** keep it, and keep it as a Job. Supabase is publicly
  reachable, so migrations *could* run straight from the Actions runner — but the
  Job runs the exact image being deployed, which is what keeps the schema and
  the code that expects it in lockstep. Point `DATABASE_URL` at `DIRECT_URL`
  (port 5432), not the pooler: Prisma migrations take advisory locks and want a
  direct session.
- **PodDisruptionBudgets:** do not add any. On a single-node cluster a PDB
  blocks node drain during upgrades.

### 5.5 Workflow

Replace `.github/workflows/deploy.yml` wholesale with kanNINJA's shape:

```
verify  -> build (matrix x 11 images -> GHCR)
        -> deploy: azure/login@v2 (federated, no stored credential)
                   az aks get-credentials
                   kubectl apply namespace / configmap
                   read Key Vault -> kubectl create secret --dry-run | apply
                   Job db-migrate  (wait, dump logs on failure)
                   kustomize edit set image (sha-<short>) -> apply -k -> rollout status
```

No `db-role` Job this pass — that belongs with the restricted-role work in 5.2,
whenever it happens.

Four repository **variables** (not secrets — they are public identifiers, and
treating them as secrets only makes a failed run harder to read):
`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`,
`AZURE_KEY_VAULT_NAME`. `terraform output agconn_github_setup` prints the four
`gh variable set` commands verbatim.

Note the Key Vault name mapping convention. kanNINJA and jotacular use
`${name//_/-}` — case-*preserving*, so vault names are `UPPERCASE-KEBAB`.
sparx's own pipeline uses `tr 'a-z-' 'A-Z_'` and therefore lowercase names. Pick
one (match kanNINJA) and stay on it; mixing them produces a secret that reads as
present in the portal and is never found at deploy time.

**Build args:** `NEXT_PUBLIC_*` values are baked at build time and currently come
from GitHub Actions secrets. They can stay there (they are public by definition)
or move to Key Vault and be read in the build job. Simplest is to leave them as
Actions secrets and note the split explicitly, so nobody looks for
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the vault and concludes it is missing.

### 5.6 Retire

`infra/terraform/` (GCP: GKE, Artifact Registry, Cloud DNS, workload identity,
`cropautonomy.tf`) becomes dead. **Do not delete it in the same pass as the
migration** — keep it until AGCONN is serving from Azure, then remove it as its
own commit.

One finding while reading it: `infra/terraform/terraform.tfvars` contains a live
Cloudflare API token in plaintext. It is git-ignored (verified — `git ls-files`
does not list it), so it was never committed, but it is on disk unencrypted and
that token has zone-edit rights on `agconn.com`. **Rotate it as part of this
work** regardless of whether the GCP stack is retired, and put the replacement in
Key Vault if anything still needs it.

---

## 6. Capacity

AGCONN's always-on requests, from `deploy/k8s/base/*-deployment.yaml`:

| Workload | CPU | Memory |
|---|---:|---:|
| web | 250m | 512Mi |
| api | 50m | 256Mi |
| admin | 100m | 256Mi |
| email-worker | 25m | 128Mi |
| sms-worker | 25m | 128Mi |
| scheduler | 25m | 128Mi |
| **Always-on** | **475m** | **1408Mi** |
| resume-parser / cert-generator / flc-verifier (if `replicas: 1` per 5.3) | +100m | +704Mi |
| **All eleven** | **575m** | **2112Mi** |

Against the node's free-by-request headroom (2058m CPU, ~6660Mi), that fits with
room to spare, and 54 to ~63 pods stays well under `maxPods: 110`. A rolling
deploy transiently doubles it (every Deployment is `replicas: 1`, so each surges
one extra pod): ~1150m / ~4224Mi. Still inside the envelope.

**The number to watch is real memory, not requested memory.** The node already
reports 63% actual (8626Mi) while only 51% is requested — requests here
understate reality. Two Next.js servers and a Node API will realistically draw
2.0-2.5 GiB resident, putting the node around 11 GiB of 13.3 (~83%) steady, and
higher during a deploy surge. That is close enough to matter, and it is the one
capacity risk in this plan.

If it turns out to be tight, the fix is `node_size`, **not** `node_count`, and
sparx's own Terraform argues the case at length: D-series pricing is linear so
the two cost the same, but a second node pays AKS's memory reservation twice,
pays a second DaemonSet tax, splits free memory into two pools that cannot host
one large pod, and doubles image pulls — while buying zero availability, because
every Deployment is `replicas: 1` and `sku_tier` is Free. The pool grew 8 to 16
GiB on 2026-08-21 for exactly this reason. `Standard_D8ads_v7` is the next step.

Note that changing `node_size` or `os_disk_size_gb` on the default pool is
ForceNew, and the existing `temporary_name_for_rotation = "systemtmp"` is what
keeps it a node-pool rotation rather than a cluster rebuild. If the size changes,
`os_disk_size_gb` must be re-read from the new SKU's exposed NVMe size — asking
for more than the SKU exposes fails the pool outright, and asking for less
silently strands the remainder.

**Ephemeral disk** is a lesser risk here than it was for sparx. AGCONN's images
copy the whole pnpm workspace (`COPY --from=build /repo /app` in
`services/api/Dockerfile`), so eleven of them land in the same 600-800 MB class
sparx's do — call it 7-9 GiB against a 220 GiB disk. Fine, but it is the disk
that caused sparx's first deploy to fail via `DiskPressure` taints that read like
an affinity bug, so it is worth a `df` on the node after the first rollout.

---

## 7. Cost

Marginal cost of adding AGCONN to this platform, with the data layer staying put:

- **Key Vault**: effectively free — Standard has no base fee, secret storage is
  free, operations are $0.03 per 10,000. A pipeline reading 45 secrets a run
  costs thousandths of a cent.
- **Cluster**: $0 marginal, unless the node has to grow (section 6), in which
  case a D4 to D8 roughly doubles the node line item.
- **Egress**: new, modest, and worth checking against the first full bill (5.1).
- **Postgres / Storage**: $0 — deferred. The `B_Standard_B1ms` line the other
  tenants each carry ($0.01921/hr, ~$14/mo) is not incurred.
- **Supabase**: unchanged, still billed.

Against what is retired: GKE Standard zonal with three node pools, Artifact
Registry, and Cloud DNS. This should be a clear net reduction, dominated by
dropping the GKE control plane and node pools.

---

## 8. Phased plan

Each gate is a thing you can observe, not a thing you believe.

**Gate 0 — Decisions.** KEDA (5.3). That is the only open one in this scope; the
data-layer questions are answered by deferral.

**Gate 1 — Infrastructure.** Write and apply `envs/azure/agconn.tf` with
`agconn_enabled = true`, `agconn_data_enabled = false` (release identity), then
`bootstrap-azure/agconn.tf` (human, Owner + directory rights) — in that order,
because the bootstrap looks the vault up as a data source.
*Observable:* `az keyvault list` shows `kv-agconn-prod-cus`;
`terraform output agconn_github_setup` prints four commands.

**Gate 2 — Identity.** Read the OIDC subject prefix back from GitHub, set the
four repo variables, and prove the token exchange with a trivial workflow that
does nothing but `azure/login` and `az account show`.
*Observable:* a green run. If it is red, it is the subject prefix or the casing.

**Gate 3 — Secrets.** Load the ~45 secrets into `kv-agconn-prod-cus`, including
the four Supabase values.
*Observable:* the deploy workflow's required-secrets loop passes with an empty
`missing` array.

**Gate 4 — Code.** Manifest changes (5.4) and workflow replacement (5.5). Merged
but not yet pointed at by DNS.
*Observable:* `pnpm typecheck && pnpm test` green; images in GHCR and public.

**Gate 5 — Deploy.** Full workflow run into the `agconn` namespace.
*Observable:* `kubectl -n agconn get pods` all Running; `kubectl -n agconn
port-forward svc/api 8080:80` serves `/health` and it reaches Supabase.

**Gate 6 — Ingress.** Caddyfile blocks and `PLATFORM_HOSTNAMES` in sparx.works,
then Cloudflare records to `20.12.217.0` with SSL Full (strict).
*Observable:* `curl -I https://agconn.com` returns 200 from the pod, not a
Cloudflare error page. A 525 means the hostname is routed but not allow-listed.

**Gate 7 — Retire.** Delete `infra/terraform/`, tear down the GCP project.
Rotate the Cloudflare token (5.6) — do this at Gate 0 rather than here if the
exposure matters more than the ordering.

---

## 9. Open decisions

1. **KEDA.** (5.3) Recommend running the three workers at `replicas: 1` and
   deleting the ScaledObjects — scale-to-zero was buying money on a spot pool
   that does not exist here.
2. **Where does the Terraform live?** kanNINJA's and jotacular's infrastructure
   is defined in the **sparx.works** repo, not their own. Following that puts
   `agconn.tf` there too, which means AGCONN's infrastructure changes go through
   sparx's release. That is the established pattern and the "one file, and it is
   the removal story" property is worth keeping — but it is worth stating out
   loud rather than discovering.
3. **The RLS bypass** (5.2) is not part of this migration but should not be lost.
   Track it separately.

---

## 10. Deferred: what a later data move would involve

Kept because the research is done and re-doing it later is waste.

**Postgres.** The Azure target would have `public_network_access_enabled =
false` and sit in a delegated subnet, so nothing outside the VNet can reach it —
the restore must run from inside the cluster:

1. `pg_dump` the Supabase database from a laptop (Supabase is publicly
   reachable) into a custom-format dump.
2. Get the dump into the cluster: bake it into a one-shot image, or upload to
   the Storage Account and `azcopy` it down inside a Job. Baking it in avoids a
   chicken-and-egg with storage credentials.
3. A `postgres:18-alpine` Job runs `pg_restore` against `DATABASE_ADMIN_URL`.
4. A `db-role` Job creates `agconn_app`, then the tenant-isolation smoke test.

Dump only AGCONN's own schema. A Supabase database carries `auth`, `storage`,
`realtime` and `extensions` schemas with no counterpart on a plain Flexible
Server; they produce restore errors that look alarming and are not. Restrict
with `--schema=public` (plus `pgboss` if the queue's history matters — it
probably does not; pg-boss recreates its own schema). Check `SELECT count(*)`
per table on both sides afterward; a restore that "succeeded" with a schema
partly skipped is the standard way this goes wrong.

**The connection ceiling would become live.** `packages/db/src/pools.ts` declares
13 named pools whose `max` values sum to **111**. `B_Standard_B1ms` caps
`max_connections` at **50** — verified on `psql-kanninja-prod-cus`, and it is a
tier-specific ceiling, not a tunable. Pools are created lazily, so the failure
would arrive under load as `too many connections` from whichever pool happened to
be 51st. Azure's built-in PgBouncer is **not available on Burstable** — verified:
`az postgres flexible-server parameter show -n pgbouncer.enabled` returns
`ServerConfigurationNotAllowed`. Options, in order of preference: cap
`POOL_SIZES` from config; collapse 13 pools to 3-4; self-host PgBouncer in the
namespace (transaction mode, compatible with the transaction-local
`set_config`); or move up a tier — B1ms is $0.01921/hr against B2s at
$0.07684/hr, four times, not double, because Azure prices the burstable series
per vCore-hour.

**Storage.** `services/api/src/lib/supabase-storage.ts` (~200 lines) is the only
module touching Supabase Storage, plus `services/cert-generator/src/storage.ts`
and `services/api/scripts/setup-storage.ts`; four call sites consume it
(`admin/reports/routes.ts`, `employer/compliance/routes.ts`,
`employer/jobs/photos.ts`, `wallet/routes.ts`). The surface to reimplement
against `@azure/storage-blob` is small and already well factored: `upload`,
`delete`, `publicUrl`, `signedUrl`. Keep the `<tenantId>/<scopeId>/<random>.<ext>`
key shape so nothing downstream moves; copy with `rclone`, which speaks both
Supabase's S3-compatible API and Azure Blob.

One behaviour does not map: `job-photos` is a *public* Supabase bucket, and the
account-level `allow_nested_items_to_be_public = false` that both jotacular and
kanNINJA set means Azure refuses anonymous access outright. Either serve photos
through the API behind a short-lived SAS URL (recommended — the same account
holds I-9s and signed audit binders, so one rule beats two), or relax the
account. If the browser is ever to PUT directly to Blob, the account needs a
`cors_rule` naming `https://agconn.com`; kanNINJA's Terraform carries one and
documents why — without a matching origin every upload and download fails at
preflight with no server-side trace, because no request reaches the backend.

**Backups.** Supabase PITR would give way to Flexible Server's 7-day PITR with
geo-redundant backup off — the tier floor, not a choice, and what all three
existing tenants run. If AGCONN's compliance surface (I-9s, signed audit
binders, funder-facing reporting) needs more than seven days, that is a cost
question to settle before the move, not after the first incident.
