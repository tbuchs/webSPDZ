pkgs: {
  imports =
    [ "${pkgs.path}/nixos/modules/virtualisation/digital-ocean-image.nix" ];
  environment.systemPackages = [ pkgs.headscale ];

  virtualisation.oci-containers.containers = {
    peerjs-server = {
      image = "peerjs/peerjs-server";
      cmd = [ "--alive_timeout" "120000" "--proxied" ];
      ports = [ "9000:9000" ];
      # ... other Docker options like environment variables, etc.
    };
  };

  security.acme = {
    acceptTerms = true;
    email = "e.e.nikolov@student.tue.nl";
    # certs."mpyc-demo--headscale-ams3-c99f82e5.demo.mpyc.tech" = {
    #   domain = "mpyc-demo--headscale-ams3-c99f82e5.demo.mpyc.tech";
    #   dnsProvider = "digitalocean";
    # };
  };

  services = {
    nginx = {
      enable = true;

      recommendedTlsSettings = true;
      recommendedOptimisation = true;
      recommendedGzipSettings = true;
      recommendedProxySettings = true;
      # upstreams.grafana.servers."unix:/${config.services.grafana.socket}" = { };
      virtualHosts."mpyc-demo--headscale-ams3-c99f82e5.demo.mpyc.tech" = {
        # root = "./";
        enableACME = true;
        http2 = true;
        forceSSL = true;
        locations."/" = {
          proxyPass = "http://127.0.0.1:9000";

          extraConfig = ''
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout  36000s;
          '';
        };
        # locations."/".tryFiles = "$uri @grafana";
        # locations."@grafana".proxyPass = "http://grafana";
      };
    };
    headscale.package = pkgs.headscale;
    headscale.enable = true;
    headscale.settings = {
      metrics_listen_addr = "127.0.0.1:9090";
      listen_addr = "0.0.0.0:8080";
      log = { level = "debug"; };
      ip_prefixes = [ "100.64.0.0/10" ];
      dns_config = {
        override_local_dns = true;
        # domains = [ "headnet.ts" ];
        base_domain = "headnet.ts";
      };
    };
  };
}
