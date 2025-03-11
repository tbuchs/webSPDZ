pkgs:

pkgs.buildGoModule rec {
  pname = "go-stun";
  version = "0.1.4";

  src = pkgs.fetchgit {
    url = "https://github.com/ccding/go-stun.git";
    rev = "v${version}";
    sha256 = "sha256-/A6kUP+ynmwcniPYE+rRYHpGULTvSCgtAXcK8vxkUHI=";
  };

  vendorHash = null;

  ldflags = [ "-s" "-w" ];

  nativeBuildInputs = [ pkgs.installShellFiles ];

  meta = with pkgs.lib; {
    description =
      "A go implementation of the STUN client (RFC 3489 and RFC 5389) ";
    homepage = "https://github.com/ccding/go-stun";
    downloadPage = "https://github.com/ccding/go-stun";
  };
}
