variable "nixos-image-path" {
  type    = string
  default = "../../bin/image/nixos.qcow2.gz"
}

resource "digitalocean_spaces_bucket_object" "nixos-image" {
  region = digitalocean_spaces_bucket.tf-state.region
  bucket = digitalocean_spaces_bucket.tf-state.name
  key    = "node/${basename(var.nixos-image-path)}"
  source = var.nixos-image-path
  acl    = "public-read"
  etag   = filemd5(var.nixos-image-path)
}

resource "digitalocean_custom_image" "nixos-image" {
  name         = "nixos-22.11"
  url          = "https://${digitalocean_spaces_bucket.tf-state.bucket_domain_name}/${digitalocean_spaces_bucket_object.nixos-image.key}"
  regions      = local.all_regions
  tags         = ["nixos"]
  distribution = "Arch Linux"

  lifecycle {
    replace_triggered_by = [
      digitalocean_spaces_bucket_object.nixos-image
    ]
  }
}

variable "nixos-headscale-image-path" {
  type    = string
  default = "../../bin/headscale/nixos.qcow2.gz"
}

resource "digitalocean_spaces_bucket_object" "nixos-image-headscale" {
  region = digitalocean_spaces_bucket.tf-state.region
  bucket = digitalocean_spaces_bucket.tf-state.name
  key    = "headscale/${basename(var.nixos-headscale-image-path)}"
  source = var.nixos-headscale-image-path
  acl    = "public-read"
  etag   = filemd5(var.nixos-headscale-image-path)
}

resource "digitalocean_custom_image" "nixos-image-headscale" {
  name         = "nixos-headscale-22.11"
  url          = "https://${digitalocean_spaces_bucket.tf-state.bucket_domain_name}/${digitalocean_spaces_bucket_object.nixos-image-headscale.key}"
  regions      = local.all_regions
  tags         = ["nixos"]
  distribution = "Arch Linux"

  lifecycle {
    replace_triggered_by = [
      digitalocean_spaces_bucket_object.nixos-image-headscale
    ]
  }
}
