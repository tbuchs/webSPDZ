pkgs:
pkgs.tailscale.overrideAttrs (final: old: {
  subPackages = [ "cmd/tailscale" "cmd/tailscaled" "cmd/derper" "cmd/stunc" "cmd/hello" ];
})
