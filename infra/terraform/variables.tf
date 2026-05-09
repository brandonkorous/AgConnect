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

variable "node_machine_type" {
  description = "Machine type for the single node pool. e2-medium = 2 vCPU / 4 GiB, ~$24/mo idle."
  type        = string
  default     = "e2-medium"
}

variable "node_min_count" {
  description = "Cluster autoscaler minimum nodes."
  type        = number
  default     = 1
}

variable "node_max_count" {
  description = "Cluster autoscaler maximum nodes."
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
