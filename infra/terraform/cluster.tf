resource "google_service_account" "gke_node" {
  account_id   = "agconn-gke-node"
  display_name = "AgConn GKE node"
  description  = "Identity used by GKE node VMs. Carries the bundled minimum-permissions role for node ops (logging, monitoring, autoscaling metrics, AR pull)."
  depends_on   = [google_project_service.enabled]
}

resource "google_project_iam_member" "gke_node_default" {
  project = var.project_id
  role    = "roles/container.defaultNodeServiceAccount"
  member  = "serviceAccount:${google_service_account.gke_node.email}"
}

resource "google_container_cluster" "agconn" {
  name     = var.cluster_name
  location = var.zone

  remove_default_node_pool = true
  initial_node_count       = 1
  deletion_protection      = false

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  network_policy {
    enabled = false
  }

  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
  }

  depends_on = [google_project_service.enabled]
}

resource "google_container_node_pool" "general" {
  name       = "general"
  cluster    = google_container_cluster.agconn.name
  location   = google_container_cluster.agconn.location
  node_count = var.node_min_count

  autoscaling {
    min_node_count = var.node_min_count
    max_node_count = var.node_max_count
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    strategy        = "SURGE"
    max_surge       = 1
    max_unavailable = 0
  }

  node_config {
    machine_type    = var.node_machine_type
    disk_size_gb    = 50
    disk_type       = "pd-standard"
    image_type      = "COS_CONTAINERD"
    service_account = google_service_account.gke_node.email

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = {
      pool = "general"
    }
  }

  depends_on = [google_project_iam_member.gke_node_default]
}

resource "google_compute_address" "ingress" {
  name   = "${var.cluster_name}-ingress"
  region = var.region
}
