
if [ $# -eq 1 ]; then
    player_id=$1;
else
    echo "Usage: ./craft...test-logs.sh [Party ID]";
    exit -1;
fi

file="Logs/player-${player_id}.log"

timer_full='<b3m4>{"timer": {"full": 2100} }</b3m4>'
timer_input='<b3m4>{"timer": {"input": 2000} }</b3m4>'
timer_inner_prod='<b3m4>{"timer": {"inner_prod": 100} }</b3m4>'
timings="${timer_full}\n${timer_input}\n${timer_inner_prod}\n"

result='<b3m4>{"result": 1234}</b3m4>\n'

echo -e "${result}\n${timings}" > $file
echo -e "${result}\n${timings}"