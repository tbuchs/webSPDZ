pkgs:

pkgs.buildGoModule rec {
  pname = "gole";
  version = "1.2.0";

  src = pkgs.fetchFromGitHub {
    owner = "shawwwn";
    repo = "Gole";
    rev = "v${version}";
    sha256 = "sha256-AZAOzkXxvl6F9ZtfEg8d4AaoOH7NuvLx2sF7UqUgFqM=";
  };

  vendorHash = "sha256-ANc0uAmVbkMkIJtlMaLvZiNq6faJfRmo0u6/k5i1rBQ=";

  # subPackages = [ "client" "server" ];

  # postInstall = ''
  #   mv $out/bin/client $out/bin/natpunch-client
  #   mv $out/bin/server $out/bin/natpunch-server
  # '';

  ldflags = [ "-s" "-w" ];

  nativeBuildInputs = [ pkgs.installShellFiles ];

  meta = with pkgs.lib; {
    description = "A p2p hole punching/tunneling tool written in Go.";
    homepage = "https://github.com/shawwwn/Gole";
    downloadPage = "https://github.com/shawwwn/Gole";
    # mainProgram = "ent";
  };
}
