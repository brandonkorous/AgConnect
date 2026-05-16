variable "project_id" {
  description = "GCP project ID hosting the cluster."
  type        = string
  default     = "agconn"
}

variable "region" {
  description = "GCP region. Cluster zone is derived from this."
  type        = string
  default     = "us-west1"
}

variable "zone" {
  description = "GCP zone for the zonal GKE cluster (first zonal cluster per billing account is free of cluster-management fee)."
  type        = string
  default     = "us-west1-a"
}

variable "cluster_name" {
  description = "GKE cluster name."
  type        = string
  default     = "agconn-prod"
}

variable "app_node_min_count" {
  description = "Autoscaler minimum nodes in the app pool (web + api). 1 covers pre-launch; raise to 2 for zero-downtime rolling deploys."
  type        = number
  default     = 1
}

variable "app_node_max_count" {
  description = "Autoscaler maximum nodes in the app pool."
  type        = number
  default     = 4
}

variable "worker_node_max_count" {
  description = "Autoscaler maximum spot nodes in the worker pool. Min is always 0 (scale-to-zero when no workers are pending). 3 gives burst headroom for a résumé/cert/sweep pileup on top of the always-on sms/email/scheduler residents — one e2-small (~1.42Gi allocatable) can't hold all of that plus KEDA-scaled bursts at once."
  type        = number
  default     = 3
}

variable "domain" {
  description = "Apex domain managed in Cloudflare."
  type        = string
  default     = "agconn.com"
}

variable "cloudflare_zone_id" {
  description = "Zone ID for var.domain in Cloudflare."
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Zone:DNS:Edit on var.domain. Read from TF_VAR_cloudflare_api_token."
  type        = string
  sensitive   = true
}

variable "github_repository" {
  description = "GitHub repository in OWNER/REPO form, used to bind Workload Identity Federation."
  type        = string
}

variable "ingress_nginx_version" {
  description = "ingress-nginx controller version. https://github.com/kubernetes/ingress-nginx/releases"
  type        = string
  default     = "v1.11.3"
}

variable "cert_manager_version" {
  description = "cert-manager version. https://github.com/cert-manager/cert-manager/releases"
  type        = string
  default     = "v1.16.2"
}

variable "keda_version" {
  description = "KEDA version. Drives scale-to-zero for the bursty workers (resume-parser, cert-generator, flc-verify) via the pg-boss postgresql scaler. https://github.com/kedacore/keda/releases"
  type        = string
  default     = "v2.16.1"
}
