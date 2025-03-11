provider "digitalocean" {}

provider "tailscale" {}

locals {
  node_definitions = var.DESTROY_NODES != "" ? [
    ] : [
    { region = "ams3", num = 3, type = "node" },
    # { region = "sfo3", num = 1, type = "node" },
    # { region = "nyc3", num = 1, type = "node" },
    # { region = "sgp1", num = 1, type = "node" },
    # { region = "ams3", num = 1, type = "headscale" },
  ]

  nodes_expanded = flatten([
    for node in local.node_definitions : [
      for i in range(node.num) :
      merge(node, {
        name = "mpyc-demo--${node.type}-${node.region}-${i}"
      })
    ]
  ])

  nodes = {
    for node in local.nodes_expanded :
    node.name => merge(node, {
      hostname = "${node.name}-${random_id.mpyc-node-hostname[node.name].hex}"
    })
  }

  all_regions = ["ams3", "sfo3", "nyc3", "sgp1"]

  generation = 1
}

resource "random_id" "mpyc-node-hostname" {
  for_each = { for node in local.nodes_expanded : node.name => node }
  keepers = {
    hostname = each.key
  }
  byte_length = 4
}
resource "digitalocean_domain" "mpyc-node" {
  for_each = local.nodes

  name       = "${each.value.hostname}.${var.DOMAIN}"
  ip_address = digitalocean_droplet.mpyc-node[each.key].ipv4_address
}
resource "digitalocean_droplet" "mpyc-node" {
  for_each = local.nodes

  image    = digitalocean_custom_image.nixos-image.id
  name     = each.value.hostname
  region   = each.value.region
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
      "echo '${tailscale_tailnet_key.keys.key}' > /var/keys/tailscale",
      "echo '${ssh_resource.headscale-key.result}' > /var/keys/headscale",
      "echo '${digitalocean_droplet.mpyc-headscale.ipv4_address}' > /var/keys/headscale-server",
      "echo '${self.name}' > /var/keys/hostname",
      "tailscale up --auth-key file:/var/keys/tailscale"
    ]
  }

  provisioner "remote-exec" {
    when = destroy
    inline = [
      "tailscale logout"
    ]
  }

  lifecycle {
    replace_triggered_by = [
      tailscale_tailnet_key.keys,
      ssh_resource.headscale-key.result
    ]
  }
}

resource "tailscale_tailnet_key" "keys" {
  reusable      = true
  ephemeral     = true
  preauthorized = true
}

output "hosts-colmena" {
  value = { for node in local.nodes : node.hostname => {} }
}

output "hosts-colmena-dns" {
  value = { for node in local.nodes : "${node.hostname}.${var.DOMAIN}" => {} }
}

output "hosts-headscale" {
  value = { "${digitalocean_droplet.mpyc-headscale.name}" = {} }
}

output "hosts-headscale-dns" {
  value = { "${digitalocean_droplet.mpyc-headscale.name}.${var.DOMAIN}" = {} }
}

output "hosts-pssh" {
  value = join("", [for node in local.nodes : "${node.hostname}\n"])
}

output "hosts-pssh-dns" {
  value = join("", [for node in local.nodes : "${node.hostname}.${var.DOMAIN}\n"])
}
