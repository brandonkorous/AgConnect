resource "cloudflare_record" "apex" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "A"
  content = google_compute_address.ingress.address
  ttl     = 1
  proxied = true
  comment = "agconn.com → GKE nginx-ingress"
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  type    = "A"
  content = google_compute_address.ingress.address
  ttl     = 1
  proxied = true
  comment = "www.agconn.com → GKE nginx-ingress"
}

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  type    = "A"
  content = google_compute_address.ingress.address
  ttl     = 1
  proxied = true
  comment = "api.agconn.com → GKE nginx-ingress"
}
