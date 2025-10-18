terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  enable_services = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "firestore.googleapis.com",
  ])
}

resource "google_project_service" "services" {
  for_each                   = local.enable_services
  service                    = each.key
  disable_dependent_services = false
}

resource "google_artifact_registry_repository" "containers" {
  location      = var.region
  repository_id = var.artifact_repo
  format        = "DOCKER"

  depends_on = [google_project_service.services]
}

resource "google_service_account" "api" {
  account_id   = "enterprise-chat-api"
  display_name = "Enterprise Chat API"
}

resource "google_service_account" "inference" {
  account_id   = "enterprise-chat-inference"
  display_name = "Enterprise Chat Inference"
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id  = "enterprise-chat-jwt-secret"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}

resource "google_secret_manager_secret" "openai_key" {
  secret_id  = "enterprise-chat-openai-key"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "openai_key" {
  secret      = google_secret_manager_secret.openai_key.id
  secret_data = var.openai_api_key
}

resource "google_cloud_run_v2_service" "inference" {
  name     = "enterprise-chat-inference"
  location = var.region

  template {
    service_account = google_service_account.inference.email
    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }
    containers {
      image = var.inference_image
      env {
        name  = "OPENAI_API_KEY"
        value = google_secret_manager_secret_version.openai_key.secret_data
      }
      env {
        name  = "INDEX_DIR"
        value = "/data/index"
      }
      env {
        name  = "DOCS_DIR"
        value = "/data/docs"
      }
      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }
    }
    volumes {
      name = "index"
      tmpfs {}
    }
    volumes {
      name = "docs"
      tmpfs {}
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.services]
}

resource "google_cloud_run_service_iam_member" "inference_public" {
  location = var.region
  project  = var.project_id
  service  = google_cloud_run_v2_service.inference.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service" "api" {
  name     = "enterprise-chat-api"
  location = var.region

  template {
    service_account = google_service_account.api.email
    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
    containers {
      image = var.api_image
      env {
        name  = "JWT_SECRET"
        value = google_secret_manager_secret_version.jwt_secret.secret_data
      }
      env {
        name  = "INFERENCE_BASE_URL"
        value = google_cloud_run_v2_service.inference.uri
      }
      env {
        name  = "CORS_ORIGIN"
        value = var.cors_origin
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_cloud_run_v2_service.inference]
}

resource "google_cloud_run_service_iam_member" "api_public" {
  location = var.region
  project  = var.project_id
  service  = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service" "web" {
  name     = "enterprise-chat-web"
  location = var.region

  template {
    containers {
      image = var.web_image
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.services]
}

resource "google_cloud_run_service_iam_member" "web_public" {
  location = var.region
  project  = var.project_id
  service  = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
