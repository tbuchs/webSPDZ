#!/bin/sh

. ./scripts/run_cmd.sh

# docker compose down --remove-orphans

CMD=${*:-"python ./secretsanta.py"}

# CMD=${*:-"python ./helloworld.py"}
# CMD=${*:-"python ./np_cnnmnist.py 1.5"}

docker compose up -d tailscale
sleep 5

run_cmd "docker compose run --rm demo \"$CMD %s\"" "-docker"
