# Cluster-internal controllers managed declaratively by Terraform.
#
# We don't use the Helm provider — the user prefers plain manifests. Each
# resource here is a `null_resource` that wraps `kubectl apply` of an upstream
# release YAML, gated on a `triggers` block so re-applies happen only when the
# pinned version (or, for the LB patch, the static IP) actually changes.
#
# Requires `kubectl` and `gcloud` on the machine running Terraform — same
# requirement as managing the cluster itself.
#
# To upgrade nginx-ingress or cert-manager: bump the variable in variables.tf
# (or override via tfvars) and run `terraform apply`. The trigger change forces
# a re-apply of the upstream manifest at the new version.

# ---- Refresh kubeconfig so kubectl can talk to the cluster ----
resource "null_resource" "kubectl_credentials" {
  triggers = {
    cluster_id = google_container_cluster.agconn.id
  }

  provisioner "local-exec" {
    command = "gcloud container clusters get-credentials ${google_container_cluster.agconn.name} --zone ${google_container_cluster.agconn.location} --project ${var.project_id}"
  }
}

# ---- nginx-ingress controller ----
# Upstream "cloud" provider manifest creates the ingress-nginx namespace,
# RBAC, controller Deployment, and a LoadBalancer Service. We then patch the
# Service to pin our static IP via a separate provisioner whose trigger is the
# IP value itself, so changing the IP re-runs only the patch.

resource "null_resource" "ingress_nginx" {
  triggers = {
    version = var.ingress_nginx_version
  }

  provisioner "local-exec" {
    command = "kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-${self.triggers.version}/deploy/static/provider/cloud/deploy.yaml"
  }

  depends_on = [null_resource.kubectl_credentials]
}

resource "local_file" "ingress_nginx_lb_patch" {
  filename = "${path.module}/.tmp/ingress-nginx-lb-patch.json"
  content = jsonencode({
    spec = {
      loadBalancerIP        = google_compute_address.ingress.address
      externalTrafficPolicy = "Local"
    }
  })
  file_permission = "0600"
}

resource "null_resource" "ingress_nginx_lb_patch" {
  triggers = {
    install_id   = null_resource.ingress_nginx.id
    static_ip    = google_compute_address.ingress.address
    patch_sha256 = local_file.ingress_nginx_lb_patch.content_sha256
  }

  provisioner "local-exec" {
    command = "kubectl -n ingress-nginx patch svc ingress-nginx-controller --type=merge --patch-file ${local_file.ingress_nginx_lb_patch.filename}"
  }

  depends_on = [null_resource.ingress_nginx, local_file.ingress_nginx_lb_patch]
}

# ---- cert-manager ----
# Upstream all-in-one manifest installs CRDs + controller + webhook +
# cainjector in one go. Idempotent; re-running with the same version is a
# no-op.

resource "null_resource" "cert_manager" {
  triggers = {
    version = var.cert_manager_version
  }

  provisioner "local-exec" {
    command = "kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/${self.triggers.version}/cert-manager.yaml"
  }

  depends_on = [null_resource.kubectl_credentials]
}

# ---- Cloudflare API token Secret for cert-manager DNS01 ----
# Same token value as the GH Actions CLOUDFLARE_API_TOKEN secret. Lives in the
# cert-manager namespace because the ClusterIssuer in deploy/k8s/base/ingress.yaml
# references it via `apiTokenSecretRef`.

resource "local_sensitive_file" "cloudflare_api_token_secret" {
  filename = "${path.module}/.tmp/cloudflare-api-token-secret.yaml"
  content = yamlencode({
    apiVersion = "v1"
    kind       = "Secret"
    metadata = {
      name      = "cloudflare-api-token"
      namespace = "cert-manager"
    }
    type = "Opaque"
    stringData = {
      "api-token" = var.cloudflare_api_token
    }
  })
  file_permission = "0600"
}

resource "null_resource" "cloudflare_api_token_secret" {
  triggers = {
    content_sha256 = local_sensitive_file.cloudflare_api_token_secret.content_sha256
    cert_manager_id = null_resource.cert_manager.id
  }

  provisioner "local-exec" {
    command = "kubectl apply -f ${local_sensitive_file.cloudflare_api_token_secret.filename}"
  }

  depends_on = [null_resource.cert_manager, local_sensitive_file.cloudflare_api_token_secret]
}
