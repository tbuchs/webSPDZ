pkgs:
{ ... }@attrs:
pkgs.lib.recursiveMerge [
  {
    system.stateVersion = "22.11";

    environment.systemPackages = [
      pkgs.jq
      pkgs.docker
      pkgs.docker-compose
      pkgs.wireguard-tools
      pkgs.coturn
      pkgs.pwnat
      pkgs.tailscale
      pkgs.lsof
      pkgs.fzf
      pkgs.htop
      # FIXME: pkgs.mpyc-demo is having issues with ./mpyc being a git submodule
      # pkgs.mpyc-demo
      pkgs.eza
      pkgs.zsh-fzf-tab
      pkgs.zsh-z
      pkgs.natpunch
      pkgs.gole
      pkgs.go-stun
      pkgs.pion-stun
    ];
    users.defaultUserShell = pkgs.zsh;

    programs.fzf.keybindings = true;
    programs.htop.enable = true;

    programs.zsh = {
      interactiveShellInit = ''
        fzf-process-widget() {
            local pid=( $(ps axww -o pid,user,%cpu,%mem,start,time,command | fzf | sed 's/^ *//' | cut -f1 -d' ') )
            LBUFFER="$LBUFFER$pid"
        }
        zle -N fzf-process-widget

        fzf-port-widget() {
            sudo true
            local port=( $(sudo lsof -i -P -n | fzf | sed 's/^ *//' | tr -s " " | cut -f2 -d' ') )
            LBUFFER="$LBUFFER$port"
        }
        zle -N fzf-port-widget

        force-backward-delete-word () {
            local WORDCHARS='~!#$%^&*(){}[]<>?+_-/;'
            zle backward-delete-word
        }
        zle -N force-backward-delete-word

        ### Key binds ###
        bindkey -e

        bindkey '^G' fzf-file-widget
        bindkey -M emacs '^[[3;5~' kill-word
        bindkey '^P' fzf-process-widget
        bindkey '^O' fzf-port-widget
        autoload -U select-word-style
        select-word-style bash

        bindkey '^H' force-backward-delete-word
        # bindkey "^[[1;7D" dirhistory_zle_dirhistory_back
        # bindkey "^[[1;7C" dirhistory_zle_dirhistory_future
        # bindkey "^[[1;7C" dirhistory_zle_dirhistory_up
        # bindkey "^[[1;7C" dirhistory_zle_dirhistory_down

        source ${pkgs.zsh-z}/share/zsh-z/zsh-z.plugin.zsh
        source ${pkgs.zsh-fzf-tab}/share/fzf-tab/fzf-tab.plugin.zsh
      '';
      enableBashCompletion = true;
      enable = true;
      enableCompletion = true;
      syntaxHighlighting.enable = true;
      autosuggestions.enable = true;
      shellAliases = {
        ls = "eza -alh --group-directories-first --color always --icons ";
        tree =
          "eza --tree -alh --group-directories-first --color always --icons ";
        grep = "grep --color --ignore-case --line-number --context=3 ";
        d = "docker";
        dc = "docker-compose";
        dcu = "docker-compose up";
        dcr = "docker-compose run";
        dclt = "docker-compose logs --follow --tail=100";

        port = "sudo lsof -i -P -n | fzf";
        pp =
          "ps axww -o pid,user,%cpu,%mem,start,time,command | fzf | sed 's/^ *//' | cut -f1 -d' '";
      };
    };

    services = { tailscale.enable = true; };

    networking.firewall = {
      enable = false;
      checkReversePath = "loose";
      trustedInterfaces = [ "tailscale0" ];
    };

    virtualisation.docker.enable = false;
    virtualisation.podman.enable = true;
    virtualisation.podman.dockerSocket.enable = true;
    programs.mosh.enable = true;
    # virtualisation.podman.dockerCompat = true;
  }
  attrs
]
