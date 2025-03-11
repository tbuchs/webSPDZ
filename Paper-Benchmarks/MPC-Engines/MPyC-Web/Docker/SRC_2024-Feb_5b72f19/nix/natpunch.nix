pkgs:

pkgs.buildGoModule rec {
  pname = "natpunch-go";
  version = "0.0.0";

  src = pkgs.fetchFromGitHub {
    owner = "malcolmseyd";
    repo = "natpunch-go";
    rev = "35d9b39c786c0217931eefbd4028dc4191fbc4e9";
    sha256 = "sha256-JC8L6cYpYRArtGNa0kLgFsExib8zD14lvScni/6YZGk=";
  };

  vendorHash = "sha256-bkSZhXz3JlGP6/DhpmvcLClQz8n9xlDHtjGLcieRX7s=";

  subPackages = [ "client" "server" ];

  postInstall = ''
    mv $out/bin/client $out/bin/natpunch-client
    mv $out/bin/server $out/bin/natpunch-server
  '';

  ldflags = [ "-s" "-w" ];

  nativeBuildInputs = [ pkgs.installShellFiles ];

  meta = with pkgs.lib; {
    description = "NAT puncher for Wireguard mesh networking. ";
    homepage = "https://github.com/malcolmseyd/natpunch-go";
    downloadPage = "https://github.com/malcolmseyd/natpunch-go";
  };
}
