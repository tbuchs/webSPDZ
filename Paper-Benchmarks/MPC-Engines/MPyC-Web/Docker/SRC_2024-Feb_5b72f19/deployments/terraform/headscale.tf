
resource "random_id" "mpyc-headscale-hostname" {
  keepers = {
    hostname = "headscale"
  }
  byte_length = 4
}

resource "digitalocean_droplet" "mpyc-headscale" {
  image    = digitalocean_custom_image.nixos-image-headscale.id
  name     = "mpyc-demo--headscale-ams3-${random_id.mpyc-headscale-hostname.hex}"
  region   = "ams3"
  size     = "s-1vcpu-1gb"
  ssh_keys = [for key in digitalocean_ssh_key.ssh-keys : key.fingerprint]

  connection {
    type = "ssh"
    user = "root"
    host = self.ipv4_address
  }

  provisioner "remote-exec" {
    inline = [
      "mkdir -p /var/keys/",
      "echo ${tailscale_tailnet_key.keys.key} > /var/keys/tailscale",
      "tailscale up --auth-key file:/var/keys/tailscale"
    ]
  }

  # provisioner "remote-exec" {
  #   inline = [
  #     "headscale users create mpyc-demo",
  #     "headscale --user mpyc-demo preauthkeys create --reusable --expiration 24y | tail",
  #   ]
  # }

  provisioner "remote-exec" {
    when = destroy
    inline = [
      "tailscale logout"
    ]
  }

  lifecycle {
    replace_triggered_by = [
      tailscale_tailnet_key.keys
    ]
  }
}

resource "digitalocean_domain" "mpyc-headscale" {
  name       = "headscale.${var.DOMAIN}"
  ip_address = digitalocean_droplet.mpyc-headscale.ipv4_address
}

resource "digitalocean_domain" "mpyc-headscale-2" {
  name       = "${digitalocean_droplet.mpyc-headscale.name}.${var.DOMAIN}"
  ip_address = digitalocean_droplet.mpyc-headscale.ipv4_address
}

resource "ssh_resource" "headscale-key" {
  host  = digitalocean_droplet.mpyc-headscale.ipv4_address
  user  = "root"
  agent = true

  when = "create" # Default

  commands = [
    "headscale users create mpyc-demo",
    "headscale --user mpyc-demo preauthkeys create --reusable --expiration 24y | tail -1 | tr -d '\n'"
  ]
}

output "result" {
  value = ssh_resource.headscale-key.result
}
