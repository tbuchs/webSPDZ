pkgs:

pkgs.buildGoModule rec {
  pname = "pion-stun";
  version = "0.4.0-a80d7";

  src = pkgs.fetchgit {
    url = "https://github.com/pion/stun.git";
    rev = "a80d7d3ca2d2d8ff0244ed1d99d65bfd631dd99b";
    sha256 = "sha256-9BWquqYXoAQ+RBLKEacjlneg9fF/BbZMeRAG3/EhZ1w=";
  };

  vendorHash = "sha256-QDDoiDBBoKGI8t1nmxK6+7tuvqZHmdLC8dGfDERy4og=";

  ldflags = [ "-s" "-w" ];

  nativeBuildInputs = [ pkgs.installShellFiles ];

  meta = with pkgs.lib; {
    description = "A Go implementation of STUN ";
    homepage = "https://github.com/pion/stun";
    downloadPage = "https://github.com/pion/stun";
  };
}
