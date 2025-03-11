resource "digitalocean_ssh_key" "ssh-keys" {
  for_each = local.ssh_key_paths

  name       = basename(each.key)
  public_key = file(each.key)
}

locals {
  ssh_key_paths = toset(flatten([
    for pattern in var.SSH_KEY_PATHS :
    formatlist("/%s", fileset("/", abspath(pathexpand(pattern))))
  ]))
}
