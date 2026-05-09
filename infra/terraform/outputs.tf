output "project_id" {
  value = var.project_id
}

output "project_number" {
  value = data.google_project.current.number
}

output "cluster_name" {
  value = google_container_cluster.agconn.name
}

output "cluster_location" {
  value = google_container_cluster.agconn.location
}

output "cluster_endpoint" {
  value     = google_container_cluster.agconn.endpoint
  sensitive = true
}

output "ingress_ip" {
  value       = google_compute_address.ingress.address
  description = "Static external IP. Assign to nginx-ingress controller via service.loadBalancerIP."
}

output "deploy_service_account_email" {
  value = google_service_account.deploy.email
}

output "workload_identity_provider" {
  value       = google_iam_workload_identity_pool_provider.github_actions.name
  description = "Set as GH Actions secret GCP_WORKLOAD_IDENTITY_PROVIDER."
}

output "artifact_registry_repo" {
  description = "Full Artifact Registry repository path used by the deploy workflow."
  value       = "${google_artifact_registry_repository.containers.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.containers.repository_id}"
}

output "github_actions_secrets" {
  description = "Copy these three values into GitHub repo secrets."
  value = {
    GCP_PROJECT_ID                  = var.project_id
    GCP_WORKLOAD_IDENTITY_PROVIDER  = google_iam_workload_identity_pool_provider.github_actions.name
    GCP_DEPLOY_SERVICE_ACCOUNT      = google_service_account.deploy.email
  }
}
