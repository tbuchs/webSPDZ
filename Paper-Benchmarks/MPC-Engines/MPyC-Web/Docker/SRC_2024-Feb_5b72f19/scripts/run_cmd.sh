HOSTS_FILE=${HOSTS_FILE:-"./deployments/hosts-dns.pssh"}
MAX_PARTIES=${MAX_PARTIES:-600}
PORT=${PORT:-11595}

run_cmd() {
    CMD="$1"
    SUFFIX=$2
    HOSTS=$(cat ${HOSTS_FILE} | cut --delimiter="." --fields=1)

    i=0
    my_pid=-1

    args=""
    while IFS= read -r host; do
        if [ $i -ge $MAX_PARTIES ] || [ -z "$host" ]; then
            break
        fi

        if [ "$host" = "$HOSTNAME" ]; then
            my_pid=$i
        fi

        ((i = i + 1))

        args+=" -P ${host}${SUFFIX}:${PORT}"
    done < <(echo "$HOSTS")

    if [ $my_pid = -1 ]; then
        echo >&2 Only ${i} parties are allowed. ${HOSTNAME} will not participate in this MPC session
    else
        cd mpyc/demos
        CMD=$(printf "$CMD" "$args -I ${my_pid} --log-level debug")
        echo "$CMD"
        sh -c "$CMD"
    fi
}
