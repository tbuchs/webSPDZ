export TS_EXTRA_ARGS="--login-server http://$(cat /var/keys/headscale-server):8080 --hostname $(cat /var/keys/hostname)-docker"
export TS_EXTRA_ARGS="$(echo $TS_EXTRA_ARGS)"
echo $TS_EXTRA_ARGS

exec ./tailscale/run.sh "$@"