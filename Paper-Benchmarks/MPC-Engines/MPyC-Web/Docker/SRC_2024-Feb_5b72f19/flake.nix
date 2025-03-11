{
  description = "MPyC flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    # nixpkgs.url = "github:nixos/nixpkgs/ac718d02867a84b42522a0ece52d841188208f2c";
    flake-utils.url = "github:numtide/flake-utils/main";

    poetry2nix = {
      url = "github:nix-community/poetry2nix/master";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };
    devenv.url = "github:cachix/devenv/python-rewrite";
    devenv.inputs.nixpkgs.follows = "nixpkgs";
    nixpkgs-python.url = "github:cachix/nixpkgs-python";

    # nixpkgs-python.inputs.nixpkgs.follows = "nixpkgs";
  };

  nixConfig = {
    extra-substituters = [
      "https://devenv.cachix.org"
      "https://nixpkgs-python.cachix.org"
      "https://cache.armv7l.xyz"
    ];
    extra-trusted-public-keys = [
      "devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw="
      "nixpkgs-python.cachix.org-1:hxjI7pFxTyuTHn2NkvWCrAUcNZLNS3ZAvfYNuYifcEU="
      "cache.armv7l.xyz-1:kBY/eGnBAYiqYfg0fy0inWhshUo+pGFM3Pj7kIkmlBk="
    ];
  };

  outputs = inputs @ {
    self,
    nixpkgs,
    flake-utils,
    devenv,
    ...
  }:
    {
      colmena = self.packages.x86_64-linux.colmena;
    }
    // flake-utils.lib.eachSystem
    (flake-utils.lib.defaultSystems ++ [flake-utils.lib.system.armv7l-linux])
    (system: let
      pkgs = import nixpkgs {
        inherit system;

        config = {
          #   allowUnsupportedSystem = true;
          allowUnfree = true;
        };
        overlays = [
          (self: super: {
            mpyc-demo = import ./nix/mpyc-demo.nix super ./.;
            pwnat = import ./nix/pwnat.nix super;
            tailscale = import ./nix/tailscale.nix super;
            # headscale = import ./nix/headscale.nix super;
            natpunch = import ./nix/natpunch.nix super;
            gole = import ./nix/gole.nix super;
            go-stun = import ./nix/go-stun.nix super;
            pion-stun = import ./nix/pion-stun.nix super;
            pssh = import ./nix/pssh.nix super;
            mkDockerImage = import ./nix/docker.nix self;
            mkImageConfig = import ./nix/image.nix self;
            lib =
              super.lib
              // {
                recursiveMerge =
                  import ./nix/recursive-merge.nix {lib = super.lib;};
              };
          })
        ];
      };

      digitalOceanNodeConfig = pkgs.mkImageConfig {
        imports = [
          "${pkgs.path}/nixos/modules/virtualisation/digital-ocean-image.nix"
        ];
      };

      digitalOceanHeadscaleConfig =
        pkgs.mkImageConfig (import ./nix/headscale-config.nix pkgs);

      raspberryPi2Config = {config, ...}:
        pkgs.mkImageConfig (import ./nix/rpi1.nix {inherit pkgs config;});

      raspberryPi4Config = {config, ...}:
        pkgs.mkImageConfig {
          nixpkgs.system = "aarch64-linux";
          imports = [
            "${pkgs.path}/nixos/modules/installer/sd-card/sd-image-aarch64-installer.nix"
          ];
        };
    in {
      # devShells.default = import ./nix/shell.nix pkgs;
      devShells.default = devenv.lib.mkShell {
        inherit inputs pkgs;
        modules = [(import ./nix/devenv.nix)];
      };
      packages.mpyc-demo = pkgs.mpyc-demo;

      packages.colmena =
        {
          meta = {nixpkgs = pkgs;};

          # rpi1 = raspberryPi2Config;
        }
        // builtins.mapAttrs (name: value: digitalOceanNodeConfig)
        (builtins.fromJSON (builtins.readFile ./deployments/hosts-dns.json))
        // builtins.mapAttrs (name: value: digitalOceanHeadscaleConfig)
        (builtins.fromJSON
          (builtins.readFile ./deployments/hosts-headscale-dns.json));

      packages.digitalOceanImage =
        (pkgs.nixos digitalOceanNodeConfig).digitalOceanImage;
      packages.digitalOceanHeadscaleImage =
        (pkgs.nixos digitalOceanHeadscaleConfig).digitalOceanImage;
      # packages.raspberryPi2Image = (pkgs.nixos (raspberryPi2Config)).sdImage;
      packages.raspberryPi2Image = pkgs.nixos raspberryPi2Config;
      packages.raspberryPi4Image = (pkgs.nixos raspberryPi4Config).sdImage;
      packages.dockerImage = pkgs.mkDockerImage {
        inherit self;
        name = "enikolov/mpyc-demo";
        tag = "v0.0.5";
        dir = ./.;
      };
    });
}
