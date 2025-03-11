

terraform {
  backend "s3" {
    endpoints = { s3 = "https://ams3.digitaloceanspaces.com" }
    region    = "ams3"
    # TODO the bucket name must be globally unique, so we should randomize it so that using this project does not fail when run by others
    bucket                      = "mpyc-tf-state"
    key                         = "mpyc-demo/terraform.tfstate"
    skip_requesting_account_id  = true
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_metadata_api_check     = true
  }
}
