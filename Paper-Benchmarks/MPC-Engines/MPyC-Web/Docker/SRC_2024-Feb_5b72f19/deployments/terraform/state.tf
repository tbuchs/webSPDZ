

resource "digitalocean_spaces_bucket" "tf-state" {
  name   = "mpyc-tf-state"
  region = "ams3"

  lifecycle {
    prevent_destroy = true
  }
}
