output "api_url" {
  description = "Public URL for the API service."
  value       = google_cloud_run_v2_service.api.uri
}

output "inference_url" {
  description = "Public URL for the inference service."
  value       = google_cloud_run_v2_service.inference.uri
}

output "web_url" {
  description = "Public URL for the static web frontend."
  value       = google_cloud_run_v2_service.web.uri
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository path for pushing images."
  value       = google_artifact_registry_repository.containers.repository
}
