pkgs: { self, name, tag, dir }:
let
  nonRootShadowSetup = { user, uid, gid ? uid }: with pkgs; [
    (
      writeTextDir "etc/shadow" ''
        root:!x:::::::
        ${user}:!:::::::
      ''
    )
    (
      writeTextDir "etc/passwd" ''
        root:x:0:0::/root:${runtimeShell}
        ${user}:x:${toString uid}:${toString gid}::/home/${user}:
      ''
    )
    (
      writeTextDir "etc/group" ''
        root:x:0:
        ${user}:x:${toString gid}:
      ''
    )
    (
      writeTextDir "etc/gshadow" ''
        root:x::
        ${user}:x::
      ''
    )
  ];
in
pkgs.dockerTools.buildLayeredImage
{
  name = name;
  tag = tag;
  created = builtins.substring 0 8 self.lastModifiedDate;
  maxLayers = 10;

  contents = pkgs.buildEnv
    {
      name = "zzz-python-env-123";
      paths = [
        pkgs.mpyc-demo
        pkgs.poetry
        # pkgs.python3Packages.numpy
        # pkgs.python3Packages.matplotlib
        pkgs.python3Packages.pip
        # pkgs.hello
        pkgs.gnugrep
        # pkgs.python3
        pkgs.coreutils
        pkgs.bashInteractive
        pkgs.nix
        pkgs.which
        pkgs.curl
        pkgs.gnumake
        pkgs.zsh
        pkgs.fzf
        pkgs.fzf-zsh
        pkgs.gawk
        pkgs.unixtools.nettools
        pkgs.unixtools.ping
        pkgs.unixtools.top
        pkgs.wget
        pkgs.tailscale
        pkgs.natpunch
        pkgs.gole
        pkgs.go-stun
        pkgs.pion-stun
        (pkgs.buildEnv {
          name = "mpyc-root";
          paths = [ dir ];
          # pathsToLink = [ "/demos" ];
          extraPrefix = "/mpyc";
        })

        (pkgs.buildEnv {
          name = "docker-home";
          paths = [ "./docker-home" ];
          pathsToLink = [ "/" ];
          extraPrefix = "/root";
        })
      ] ++ nonRootShadowSetup {
        uid = 999;
        user = "somebody";
      };
    };

  config = {
    Cmd = [ "python ./demos/secretsanta.py" ];
    WorkingDir = "/mpyc/";
    Entrypoint = [ "/bin/bash" "-c" ];
    # Entrypoint = [ "/bin/bash" "-c" "cd /mpyc && $@" ];

    Env = [
      "NIX_PAGER=cat"
      # A user is required by nix
      # https://github.com/NixOS/nix/blob/9348f9291e5d9e4ba3c4347ea1b235640f54fd79/src/libutil/util.cc#L478
      "USER=somebody"
    ];
  };
}
