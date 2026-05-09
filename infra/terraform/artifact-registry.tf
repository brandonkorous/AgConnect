resource "google_artifact_registry_repository" "containers" {
  location      = var.region
  repository_id = "containers"
  description   = "AgConn container images"
  format        = "DOCKER"

  depends_on = [google_project_service.enabled]
}

# Deploy SA can push images.
resource "google_artifact_registry_repository_iam_member" "deploy_writer" {
  project    = var.project_id
  location   = google_artifact_registry_repository.containers.location
  repository = google_artifact_registry_repository.containers.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.deploy.email}"
}

# Node SA already gets `artifactregistry.reader` via the bundled
# `roles/container.defaultNodeServiceAccount` role — no extra binding needed
# for pulls.
