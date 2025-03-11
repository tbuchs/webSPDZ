pkgs:
pkgs.pssh.overrideAttrs (final: old: {
  version = "2.3.5";
  src = pkgs.fetchFromGitHub {
    owner = "lilydjwg";
    repo = "pssh";
    rev = "v2.3.5";
    hash = "";
  };
})
