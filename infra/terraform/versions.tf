terraform {
  required_version = ">= 1.7.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.10"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.42"
    }
  }

  backend "gcs" {
    bucket = "agconn-terraform-state"
    prefix = "prod"
  }
}
