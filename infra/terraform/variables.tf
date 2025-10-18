variable "project_id" {
  description = "Google Cloud project id."
  type        = string
}

variable "region" {
  description = "Primary region for Cloud Run and Artifact Registry."
  type        = string
  default     = "us-central1"
}

variable "artifact_repo" {
  description = "Artifact Registry repository name for container images."
  type        = string
  default     = "enterprise-chat"
}

variable "api_image" {
  description = "Container image reference for the API service."
  type        = string
}

variable "inference_image" {
  description = "Container image reference for the inference service."
  type        = string
}

variable "web_image" {
  description = "Container image reference for the static web frontend."
  type        = string
}

variable "cors_origin" {
  description = "Allowed CORS origin for the API."
  type        = string
  default     = "*"
}

variable "jwt_secret" {
  description = "Secret used to sign API JWT tokens."
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for the inference service."
  type        = string
  sensitive   = true
}
