{
  imports = [
    #  - flakes (where arion is a flake input)
    arion.nixosModules.arion
    # #  - other
    # arionPath + "/nixos-module.nix")
  ];

  virtualisation.arion = {
    backend = "podman-socket"; # or "docker"
    projects.example.settings = {
      # Specify you project here, or import it from a file.
      # NOTE: This does NOT use ./arion-pkgs.nix, but defaults to NixOS' pkgs.
      imports = [ ./arion-compose.nix ];
    };
  };
}
