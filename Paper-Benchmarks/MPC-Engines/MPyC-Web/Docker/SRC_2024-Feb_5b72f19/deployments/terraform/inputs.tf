variable "SSH_KEY_PATHS" {
  type    = set(string)
  default = ["./ssh/*.pub"]
}

variable "DESTROY_NODES" {
  type    = string
  default = ""
}

variable "DOMAIN" {
  type    = string
  default = "please-enter-a-domain"
}
