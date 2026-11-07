variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare Zone ID for techprogression.com (32 hex characters). Leave empty to create nothing."
  default     = ""

  validation {
    condition     = var.cloudflare_zone_id == "" || can(regex("^[0-9a-f]{32}$", var.cloudflare_zone_id))
    error_message = "cloudflare_zone_id must be empty or a 32-character lowercase hex Zone ID."
  }
}

variable "hostinger_server_ip" {
  type        = string
  description = "Hostinger server public IPv4 address. Required when cloudflare_zone_id is set."
  default     = ""

  validation {
    condition     = var.hostinger_server_ip == "" || can(cidrhost("${var.hostinger_server_ip}/32", 0))
    error_message = "hostinger_server_ip must be a valid IPv4 address."
  }

  validation {
    condition     = var.hostinger_server_ip == "" || !can(regex("^(127\\.|10\\.|192\\.168\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.)", var.hostinger_server_ip))
    error_message = "hostinger_server_ip must be a public address, not loopback or private."
  }
}

variable "environment" {
  type        = string
  description = "Target deployment environment (staging, production)"
  default     = "production"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be \"staging\" or \"production\"."
  }
}

variable "cloudflare_ssl_mode" {
  type        = string
  description = "Cloudflare SSL/TLS mode. \"strict\" (Full strict) verifies the origin certificate; use \"full\" only temporarily."
  default     = "strict"

  validation {
    condition     = contains(["full", "strict"], var.cloudflare_ssl_mode)
    error_message = "cloudflare_ssl_mode must be \"full\" or \"strict\"; weaker modes are not allowed."
  }
}
