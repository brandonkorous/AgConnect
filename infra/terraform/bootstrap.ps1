# One-time bootstrap before the first `terraform apply` (Windows / PowerShell).
#
# Solves the chicken-and-egg: Terraform needs to authenticate to GCP, but the
# Workload Identity Federation that lets GitHub Actions authenticate doesn't
# exist until Terraform creates it. This script does the absolute minimum
# manually so subsequent `terraform apply` runs (local OR from CI) take over.
#
# Run once on your laptop, after:
#   gcloud auth login
#   gcloud auth application-default login
#
# What it creates:
#   - GCP project (or uses existing)
#   - Enables required APIs
#   - Creates a GCS bucket for Terraform state
#
# After this, run `terraform init && terraform apply` from this directory.

$ProjectId      = if ($env:PROJECT_ID)      { $env:PROJECT_ID }      else { "agconn" }
$StateBucket    = if ($env:STATE_BUCKET)    { $env:STATE_BUCKET }    else { "$ProjectId-terraform-state" }
$Region         = if ($env:REGION)          { $env:REGION }          else { "us-west1" }
$BillingAccount = $env:BILLING_ACCOUNT

if (-not $BillingAccount) {
    Write-Host "Set BILLING_ACCOUNT environment variable to your billing account ID (e.g. 0X0X0X-0X0X0X-0X0X0X)."
    Write-Host "Find it with: gcloud billing accounts list"
    exit 1
}

function Stop-OnFailure {
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "==> Creating project $ProjectId (skip if exists)"
gcloud projects create $ProjectId --name "AgConn" 2>&1 | Out-Null

Write-Host "==> Linking billing account"
gcloud billing projects link $ProjectId --billing-account $BillingAccount
Stop-OnFailure

Write-Host "==> Setting active project"
gcloud config set project $ProjectId
Stop-OnFailure

Write-Host "==> Enabling APIs (this can take a minute)"
gcloud services enable cloudresourcemanager.googleapis.com compute.googleapis.com container.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com storage.googleapis.com
Stop-OnFailure

Write-Host "==> Creating Terraform state bucket gs://$StateBucket"
gcloud storage buckets create "gs://$StateBucket" --location $Region --uniform-bucket-level-access --public-access-prevention 2>&1 | Out-Null

gcloud storage buckets update "gs://$StateBucket" --versioning
Stop-OnFailure

Write-Host ""
Write-Host "Bootstrap complete."
Write-Host ""
Write-Host "Next steps:"
Write-Host "  cd infra\terraform"
Write-Host "  Copy-Item terraform.tfvars.example terraform.tfvars"
Write-Host "  # edit cloudflare_zone_id + github_repository"
Write-Host "  `$env:TF_VAR_cloudflare_api_token = '...'"
Write-Host "  terraform init"
Write-Host "  terraform apply"
Write-Host ""
Write-Host "After apply, copy the github_actions_secrets output values into your"
Write-Host "GitHub repo secrets (Settings -> Secrets and variables -> Actions)."
