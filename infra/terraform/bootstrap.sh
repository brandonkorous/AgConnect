#!/usr/bin/env bash
# One-time bootstrap before the first `terraform apply`.
#
# Solves the chicken-and-egg: Terraform needs to authenticate to GCP, but the
# Workload Identity Federation that lets GitHub Actions authenticate doesn't
# exist until Terraform creates it. This script does the absolute minimum
# manually so that subsequent `terraform apply` runs (local OR from CI) can
# take over.
#
# Run once on your laptop with: gcloud auth application-default login
#
# What it creates:
#   - GCP project (or uses existing)
#   - Enables required APIs
#   - Creates a GCS bucket for Terraform state
#
# After this, run `terraform init && terraform apply` from this directory.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-agconn}"
BILLING_ACCOUNT="${BILLING_ACCOUNT:-}"
STATE_BUCKET="${STATE_BUCKET:-${PROJECT_ID}-terraform-state}"
REGION="${REGION:-us-west1}"

if [[ -z "${BILLING_ACCOUNT}" ]]; then
  echo "Set BILLING_ACCOUNT to your billing account ID (e.g. 0X0X0X-0X0X0X-0X0X0X)."
  echo "Find it with: gcloud billing accounts list"
  exit 1
fi

echo "==> Creating project ${PROJECT_ID} (skip if exists)"
gcloud projects create "${PROJECT_ID}" --name="AGCONN" 2>/dev/null || true

echo "==> Linking billing account"
gcloud billing projects link "${PROJECT_ID}" --billing-account="${BILLING_ACCOUNT}"

echo "==> Setting active project"
gcloud config set project "${PROJECT_ID}"

echo "==> Enabling APIs (this can take a minute)"
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  storage.googleapis.com

echo "==> Creating Terraform state bucket gs://${STATE_BUCKET}"
gcloud storage buckets create "gs://${STATE_BUCKET}" \
  --location="${REGION}" \
  --uniform-bucket-level-access \
  --public-access-prevention 2>/dev/null || true

gcloud storage buckets update "gs://${STATE_BUCKET}" --versioning

echo
echo "Bootstrap complete."
echo
echo "Next steps:"
echo "  cd infra/terraform"
echo "  cp terraform.tfvars.example terraform.tfvars     # edit cloudflare_zone_id + github_repository"
echo "  export TF_VAR_cloudflare_api_token=...           # or set in your shell"
echo "  terraform init"
echo "  terraform apply"
echo
echo "After apply, copy the github_actions_secrets output values into your"
echo "GitHub repo secrets (Settings → Secrets and variables → Actions)."
