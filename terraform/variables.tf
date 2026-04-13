variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "smart-cloud-fm"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "environment" {
  description = "Environment name (dev, prod, etc.)"
  type        = string
  default     = "prod"
}

variable "gemini_api_key" {
  description = "Google Gemini API Key for AI features"
  type        = string
  sensitive   = true
}

