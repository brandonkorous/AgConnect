# Terraform additions for the AgConnect repo at:
#   G:/code/@wizeworks/AgConnect/infra/terraform/cropautonomy.tf
#
# Copy this file into that location and run `terraform apply` from the
# AgConnect terraform/ directory. The cluster, WIF pool, GKE node SA, and
# existing AgConnect resources are unchanged.
#
# What this adds, in one Terraform plan:
#  - Artifact Registry repo `cropautonomy` (separate from `containers/`)
#  - Service account `cropautonomy-deploy` with container.developer + AR writer
#  - WIF binding scoped to the cropautonomy GitHub repo
#
# What this does NOT add (handled manually — cropautonomy.com is in a
# different Cloudflare account than agconn.com, so the existing Cloudflare
# provider can't reach it):
#  - Cloudflare A records for app/field/api.cropautonomy.com
#  - Cloudflare API token Secret for cert-manager DNS01
# See deploy/README.md §1 and §2 for the manual steps (Cloudflare dashboard
# + one `kubectl create secret`).
#
# After apply, the `cropautonomy_github_actions_secrets` output prints the
# three values to paste into the cropautonomy GitHub repo's Actions secrets.

# ── Variables (extend variables.tf, or paste in cropautonomy.tf as locals) ──
variable "cropautonomy_github_repository" {
  description = "GitHub repository for the cropautonomy-platform monorepo in OWNER/REPO form."
  type        = string
  default     = "KieraKorous/cropautonomy-platform"
}

# ── Artifact Registry repo (separate from containers/) ───────────────────────
resource "google_artifact_registry_repository" "cropautonomy" {
  location      = var.region
  repository_id = "cropautonomy"
  description   = "Cropautonomy platform container images"
  format        = "DOCKER"

  depends_on = [google_project_service.enabled]
}

resource "google_artifact_registry_repository_iam_member" "cropautonomy_deploy_writer" {
  project    = var.project_id
  location   = google_artifact_registry_repository.cropautonomy.location
  repository = google_artifact_registry_repository.cropautonomy.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.cropautonomy_deploy.email}"
}

# GKE nodes pull cropautonomy images via the shared node SA.
resource "google_artifact_registry_repository_iam_member" "cropautonomy_node_reader" {
  project    = var.project_id
  location   = google_artifact_registry_repository.cropautonomy.location
  repository = google_artifact_registry_repository.cropautonomy.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.gke_node.email}"
}

# ── Deploy SA + WIF binding for the cropautonomy GitHub repo ─────────────────
resource "google_service_account" "cropautonomy_deploy" {
  account_id   = "cropautonomy-deploy"
  display_name = "cropautonomy deploy (GitHub Actions)"
  description  = "Used by GitHub Actions in cropautonomy-platform to push images and apply manifests to the shared agconn-prod GKE cluster."
}

# Reuse the existing `github` WIF pool — just add a binding scoped to the
# cropautonomy repo via the attribute.repository principalSet.
resource "google_service_account_iam_member" "cropautonomy_github_can_impersonate" {
  service_account_id = google_service_account.cropautonomy_deploy.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.cropautonomy_github_repository}"
}

resource "google_project_iam_member" "cropautonomy_deploy_container_developer" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.cropautonomy_deploy.email}"
}

resource "google_project_iam_member" "cropautonomy_deploy_cluster_viewer" {
  project = var.project_id
  role    = "roles/container.clusterViewer"
  member  = "serviceAccount:${google_service_account.cropautonomy_deploy.email}"
}

# ── Output the shared ingress IP for the manual Cloudflare DNS step ──────────
# Use this value when adding A records app/field/api.cropautonomy.com in the
# cropautonomy Cloudflare dashboard.
output "shared_ingress_ip" {
  description = "Static IP of the shared nginx-ingress LB. Point cropautonomy.com A records (app, field, api) at this address in the cropautonomy Cloudflare dashboard."
  value       = google_compute_address.ingress.address
}

# ── Outputs (paste into the cropautonomy repo's GH Actions secrets) ──────────
output "cropautonomy_deploy_service_account_email" {
  value = google_service_account.cropautonomy_deploy.email
}

output "cropautonomy_artifact_registry_repo" {
  description = "Full Artifact Registry repository path used by cropautonomy's deploy workflow."
  value       = "${google_artifact_registry_repository.cropautonomy.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.cropautonomy.repository_id}"
}

output "cropautonomy_github_actions_secrets" {
  description = "Copy these three into the cropautonomy-platform repo's GH Actions secrets."
  value = {
    GCP_PROJECT_ID                 = var.project_id
    GCP_WORKLOAD_IDENTITY_PROVIDER = google_iam_workload_identity_pool_provider.github_actions.name
    GCP_DEPLOY_SERVICE_ACCOUNT     = google_service_account.cropautonomy_deploy.email
  }
}
