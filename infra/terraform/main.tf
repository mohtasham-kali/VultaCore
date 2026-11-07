terraform {
  required_version = ">= 1.5.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Authentication: the provider reads CLOUDFLARE_API_TOKEN from the environment.
# Use a token scoped to this one zone with only "Zone:DNS:Edit" and
# "Zone Settings:Edit". Never put the token in a .tf or .tfvars file.

# DNS record for VultaCore production pointing to Hostinger server IP
resource "cloudflare_record" "vultacore_prod" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "vultacore"
  value   = var.hostinger_server_ip
  type    = "A"
  proxied = true
  comment = "Managed by Terraform - VultaCore Production"

  lifecycle {
    precondition {
      condition     = var.hostinger_server_ip != ""
      error_message = "hostinger_server_ip must be set when cloudflare_zone_id is set."
    }
  }
}

# SSL/TLS encryption setting.
# NOTE: this resource manages settings for the WHOLE zone, not only the
# vultacore subdomain. Any other site on the same zone is affected too.
resource "cloudflare_zone_settings_override" "vultacore_tls" {
  count   = var.cloudflare_zone_id != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  settings {
    ssl              = var.cloudflare_ssl_mode
    always_use_https = "on"
    min_tls_version  = "1.2"
    tls_1_3          = "on"
    security_header {
      enabled = true
      # Keep preload off until every subdomain on the zone is HTTPS-only;
      # preloading is very hard to undo.
      preload            = false
      max_age            = 31536000
      include_subdomains = true
      nosniff            = true
    }
  }
}
