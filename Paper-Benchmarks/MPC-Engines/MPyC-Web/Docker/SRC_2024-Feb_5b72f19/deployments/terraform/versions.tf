terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = ">= 2.28.1"
    }
    tailscale = {
      source = "tailscale/tailscale"
      version = ">= 0.13.6"
    }
    ssh = {
      source = "loafoe/ssh"
      version = ">= 2.4.0"
    }
  }
}
