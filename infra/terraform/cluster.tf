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

# ── system pool ───────────────────────────────────────────────────────────────
# One e2-small on-demand node reserved for cluster-level controllers:
# ingress-nginx, cert-manager, metrics-server. No taint so standard upstream
# manifests schedule here without modification.
resource "google_container_node_pool" "system" {
  name       = "system"
  cluster    = google_container_cluster.agconn.name
  location   = google_container_cluster.agconn.location
  node_count = 1

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
    machine_type    = "e2-small"
    disk_size_gb    = 30
    disk_type       = "pd-standard"
    image_type      = "COS_CONTAINERD"
    service_account = google_service_account.gke_node.email

    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]

    workload_metadata_config { mode = "GKE_METADATA" }
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = { pool = "system" }
  }

  depends_on = [google_project_iam_member.gke_node_default]
}

# ── app pool ──────────────────────────────────────────────────────────────────
# e2-medium on-demand nodes for web and api. Tainted pool=app:NoSchedule so
# only app workloads (web, api, db-migrate) land here; system pods stay on the
# system node and workers stay on the spot pool. App pods must carry the
# matching toleration (see deploy/k8s/base/).
resource "google_container_node_pool" "app" {
  name       = "app"
  cluster    = google_container_cluster.agconn.name
  location   = google_container_cluster.agconn.location
  node_count = var.app_node_min_count

  autoscaling {
    min_node_count = var.app_node_min_count
    max_node_count = var.app_node_max_count
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
    machine_type    = "e2-medium"
    disk_size_gb    = 50
    disk_type       = "pd-standard"
    image_type      = "COS_CONTAINERD"
    service_account = google_service_account.gke_node.email

    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]

    workload_metadata_config { mode = "GKE_METADATA" }
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = { pool = "app" }

    taint {
      key    = "pool"
      value  = "app"
      effect = "NO_SCHEDULE"
    }
  }

  depends_on = [google_project_iam_member.gke_node_default]
}

# ── worker pool (spot) ────────────────────────────────────────────────────────
# e2-small spot nodes for async workers (sms-worker, email-worker, audit
# cronjobs). Spot saves ~70% vs on-demand; worker restarts are safe because
# pg-boss queues survive node preemption. GKE automatically adds the taint
# cloud.google.com/gke-spot=true:NoSchedule — worker pods carry the matching
# toleration. Min=0 so idle periods cost nothing; the autoscaler brings a node
# up when a worker pod is pending.
resource "google_container_node_pool" "worker" {
  name    = "worker"
  cluster = google_container_cluster.agconn.name
  location = google_container_cluster.agconn.location

  autoscaling {
    min_node_count = 0
    max_node_count = var.worker_node_max_count
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
    machine_type    = "e2-small"
    disk_size_gb    = 30
    disk_type       = "pd-standard"
    image_type      = "COS_CONTAINERD"
    service_account = google_service_account.gke_node.email
    spot            = true

    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]

    workload_metadata_config { mode = "GKE_METADATA" }
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = { pool = "worker" }
  }

  depends_on = [google_project_iam_member.gke_node_default]
}

resource "google_compute_address" "ingress" {
  name   = "${var.cluster_name}-ingress"
  region = var.region
}
