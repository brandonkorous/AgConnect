# Terraform — GCP infrastructure for AgConn

Provisions a GKE zonal cluster (`us-west1-a`), Workload Identity Federation for
GitHub Actions, a static external IP for nginx-ingress, and Cloudflare DNS
records for `agconn.com`, `www.agconn.com`, `api.agconn.com`.

State lives in a GCS bucket; secrets stay in GitHub Actions, not in state.

## First-time setup

### macOS / Linux / Git Bash

```bash
# 1. Auth your laptop to GCP.
gcloud auth login
gcloud auth application-default login

# 2. Run the bootstrap script. It creates the project, enables APIs, and
#    provisions the GCS state bucket. Set BILLING_ACCOUNT to your billing id.
export BILLING_ACCOUNT=0X0X0X-0X0X0X-0X0X0X
bash bootstrap.sh

# 3. Configure variables.
cp terraform.tfvars.example terraform.tfvars
#    Edit cloudflare_zone_id (Cloudflare dashboard → agconn.com → sidebar)
#    Edit github_repository (e.g. wizeworks/AgConnect)
export TF_VAR_cloudflare_api_token=$(read -s; echo $REPLY)

# 4. Apply.
terraform init
terraform apply
```

### Windows / PowerShell

```powershell
# 1. Auth your laptop to GCP.
gcloud auth login
gcloud auth application-default login

# 2. Run the bootstrap script.
$env:BILLING_ACCOUNT = "0X0X0X-0X0X0X-0X0X0X"
.\bootstrap.ps1

# 3. Configure variables.
Copy-Item terraform.tfvars.example terraform.tfvars
#    Edit cloudflare_zone_id (Cloudflare dashboard -> agconn.com -> sidebar)
#    Edit github_repository (e.g. wizeworks/AgConnect)
$env:TF_VAR_cloudflare_api_token = "..."

# 4. Apply.
terraform init
terraform apply
```

The apply prints a `github_actions_secrets` block. Copy those three values into
GitHub repo Settings → Secrets and variables → Actions:

- `GCP_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_DEPLOY_SERVICE_ACCOUNT`

## Day-2 changes

Run `terraform apply` from your laptop. State is locked through the GCS
backend so concurrent runs are safe.

## What this does NOT install

Cluster controllers (nginx-ingress, cert-manager) are installed once via
`kubectl apply` — see `deploy/README.md`. Application manifests deploy via
GitHub Actions. Terraform owns cloud-side resources only.
