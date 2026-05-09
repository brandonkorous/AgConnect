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

# GKE nodes pull images via the node SA. `container.defaultNodeServiceAccount`
# (granted in cluster.tf) covers logging/monitoring/autoscaling but does NOT
# include AR read, so we bind it explicitly here.
resource "google_artifact_registry_repository_iam_member" "node_reader" {
  project    = var.project_id
  location   = google_artifact_registry_repository.containers.location
  repository = google_artifact_registry_repository.containers.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.gke_node.email}"
}
