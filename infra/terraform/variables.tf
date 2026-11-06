variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID for techprogression.com"
  default     = ""
}

variable "hostinger_server_ip" {
  type        = string
  description = "Hostinger server public IPv4 address"
  default     = "127.0.0.1"
}

variable "environment" {
  type        = string
  description = "Target deployment environment (staging, production)"
  default     = "production"
}

