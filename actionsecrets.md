# GitHub Actions Secrets — AgConn

Set under **Settings → Secrets and variables → Actions** at the repo level (or
under a `prod` GitHub Environment if you want to scope them later). Total: 33.

The deploy workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
fails loudly if any are missing — nothing is silently empty.

---

## A. GCP infrastructure auth (3)

Populated from `terraform apply`'s `github_actions_secrets` output.

| Name | Value | Source |
|---|---|---|
| `GCP_PROJECT_ID` | `agconn` | bootstrap output |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/github-actions` | bootstrap output |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | `agconn-deploy@agconn.iam.gserviceaccount.com` | bootstrap output |

## B. Cloudflare (2)

Same `CLOUDFLARE_API_TOKEN` value is also used at cluster bootstrap time to
seed the `cloudflare-api-token` Secret in the `cert-manager` namespace.

| Name | Value | Source |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | scoped token with `Zone:DNS:Edit` on `agconn.com` | dash.cloudflare.com → My Profile → API Tokens → Create Token (template: "Edit zone DNS") |
| `CLOUDFLARE_ZONE_ID` | Zone ID for `agconn.com` | Cloudflare dashboard → agconn.com → right sidebar |

---

## C. App runtime secrets (28)

Injected into the `agconn-env` K8s Secret at deploy time. Rotation = redeploy.

### Database (Supabase) — 2

| Name | Notes |
|---|---|
| `DATABASE_URL` | Supabase **pooler** URL — `postgresql://postgres.xxx:pwd@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase **direct** URL for Prisma migrations — `postgresql://postgres.xxx:pwd@db.xxx.supabase.co:5432/postgres` |

### Audit log integrity — 2

| Name | Notes |
|---|---|
| `AUDIT_HMAC_KEY` | `openssl rand -base64 48` |
| `AUDIT_HMAC_KEY_VERSION` | start at `1` |

### Admin gate — 1

| Name | Notes |
|---|---|
| `ADMIN_BEARER_TOKEN` | `openssl rand -hex 32` |

### Clerk — 3

| Name |
|---|
| `CLERK_SECRET_KEY` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `CLERK_WEBHOOK_SECRET` |

### Resend (email) — 2

| Name |
|---|
| `RESEND_API_KEY` |
| `RESEND_WEBHOOK_SECRET` |

### Waitlist — 1

| Name | Notes |
|---|---|
| `WAITLIST_TOKEN_SECRET` | `openssl rand -base64 48` |

### Sentry — 5

| Name | Notes |
|---|---|
| `SENTRY_DSN` | server-side |
| `NEXT_PUBLIC_SENTRY_DSN` | client-side |
| `SENTRY_AUTH_TOKEN` | build-time only; safe to drop if you skip source-map upload |
| `SENTRY_ORG` | |
| `SENTRY_PROJECT` | |

### PostHog — 2

| Name |
|---|
| `NEXT_PUBLIC_POSTHOG_KEY` |
| `POSTHOG_API_KEY` |

### Stripe — 6

| Name |
|---|
| `STRIPE_SECRET_KEY` |
| `STRIPE_WEBHOOK_SECRET` |
| `STRIPE_PRICE_PRO_MONTHLY` |
| `STRIPE_PRICE_PRO_YEARLY` |
| `STRIPE_PRICE_ENT_MONTHLY` |
| `STRIPE_PRICE_ENT_YEARLY` |

### Twilio (SMS) — 4

| Name |
|---|
| `TWILIO_ACCOUNT_SID` |
| `TWILIO_AUTH_TOKEN` |
| `TWILIO_MESSAGING_SERVICE_SID` |
| `TWILIO_INBOUND_PHONE` |

### Supabase Storage — 2

| Name |
|---|
| `SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` |

### Mapbox — 1

| Name |
|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` |

---

## Counts

| Group | Count |
|---|---:|
| A — GCP infra auth | 3 |
| B — Cloudflare | 2 |
| C — App runtime | 28 |
| **Total** | **33** |
