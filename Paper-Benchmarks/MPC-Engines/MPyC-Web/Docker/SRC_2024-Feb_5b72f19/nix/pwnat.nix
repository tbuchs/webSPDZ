pkgs:
pkgs.stdenv.mkDerivation rec {
  name = "${pname}-${version}";
  pname = "pwnat";
  version = "v0.3.0";

  src = pkgs.fetchFromGitHub {
    owner = "samyk";
    repo = pname;
    rev = "v0.3.0";
    sha256 = "sha256-Uj4uQkmsHw7DoMy2eO7GkqtNOlcctC4zoIshAidV8iQ=";
  };

  installPhase = ''
    mkdir -p $out/bin $out/share/pwnat
    cp pwnat $out/bin
    cp README* COPYING* $out/share/pwnat
  '';

  meta = with pkgs.lib; {
    homepage = "http://samy.pl/pwnat/";
    description = "ICMP NAT to NAT client-server communication";
    platforms = with platforms; linux;
  };
}
