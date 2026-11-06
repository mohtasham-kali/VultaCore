terraform {
  required_version = ">= 1.5.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# DNS record for VultaCore production pointing to Hostinger server IP
resource "cloudflare_record" "vultacore_prod" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "vultacore"
  value   = var.hostinger_server_ip
  type    = "A"
  proxied = true
  comment = "Managed by Terraform - VultaCore Production"
}

# SSL/TLS encryption setting
resource "cloudflare_zone_settings_override" "vultacore_tls" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  settings {
    ssl                      = "full"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    security_header {
      enabled            = true
      preload            = true
      max_age            = 31536000
      include_subdomains = true
      nosniff            = true
    }
  }
}

