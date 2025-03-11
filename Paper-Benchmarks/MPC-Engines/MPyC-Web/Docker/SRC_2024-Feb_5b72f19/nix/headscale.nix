pkgs:
pkgs.headscale.overrideAttrs (
  final: old: {
    version = "v0.20.0";
    src = pkgs.fetchFromGitHub {
      owner = "juanfont";
      repo = "headscale";
      rev = "v0.20.0";
      hash = "sha256-RqJrqY1Eh5/TY+vMAO5fABmeV5aSzcLD4fX7j1QDN6w=";
    };
  }
)
