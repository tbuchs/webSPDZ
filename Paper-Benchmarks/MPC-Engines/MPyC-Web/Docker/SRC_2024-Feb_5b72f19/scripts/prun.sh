#!/bin/sh

. ./scripts/run_cmd.sh

CMD=${*:-"python ./secretsanta.py"}

# CMD=${*:-"python ./helloworld.py"}
# CMD=${*:-"python ./np_cnnmnist.py 1.5"}

run_cmd "$CMD %s"
