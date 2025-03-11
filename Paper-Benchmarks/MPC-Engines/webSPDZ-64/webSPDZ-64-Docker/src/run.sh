#!/usr/bin/env bash

HERE=$(cd `dirname $0`; pwd)
ROOT=$HERE/

#change IP of WebServer Host here!
# WebHost="172.16.34.8"
# WebHost="172.16.37.8"
WebHost="localhost"
WebPort=8000

#change IP of Signaling Server here!
# SSHost="172.16.34.9"
# SSHost="172.16.37.9"
SSHost="localhost"
SSPort=8080

NPlayers=3;
Protocol=0; # 0 = shamir, 1 = rep-ring
ArraySize=100000;

#Start execution
if [ $# -eq 0 ]; then
    echo "Usage: ./run.sh [Number of Players] [Protocol (0=shamir, 1=rep-ring, 2=rep4-ring), [ArraySize (100, 1000, 10 000, 100 000)]]";
    echo "      Player Number for Replicated Ring Protocol is fixed with 3 Players."
    exit -1;
elif [ $# -eq 3 ]; then
    NPlayers=$1;
    Protocol=$2;
    ArraySize=$3;
    echo "Running Computation with Protocol $Protocol (0=shamir, 1=rep-ring, 2=rep4-ring), $NPlayers Player and ArraySize $ArraySize";
else
    echo "Usage: ./run.sh [Number of Players] [Protocol (0=shamir, 1=rep-ring, 2=rep4-ring), [ArraySize (100, 1000, 10 000, 100 000)]]";
    exit -1;
fi

#Web-Server
echo 'Starting Web-Server'
kill -9 $(lsof -t -i:$WebPort) > /dev/null 2>&1 # kill potential service to allow port binding
# python3 $ROOT/https-server.py $WebPort > Logs/web-server.log 2>&1 &
python3 $ROOT/https-server.py $WebHost $WebPort 2>&1 &

#Signaling-Server
echo 'Starting Signaling-Server'
kill -9 $(lsof -t -i:$SSPort) > /dev/null 2>&1 # kill potential service to allow port binding
# nodejs $ROOT/signaling_ws_server.js $SSHost $SSPort > Logs/signaling-server.log 2>&1 &
nodejs $ROOT/signaling_ws_server.js $SSHost $SSPort 2>&1 &

# Run benchmark 5 times
for (( j = 0; j < 5; j++ ))
do
  # Starting the browser
  pids=()
  echo "Running calculation round $j"
  for (( i = 0; i < $NPlayers; i++ )) 
  do
    file="Logs/player-$i-$j.log"
    if [ $Protocol -eq 0 ]; then
      python3 execute.py "https://$WebHost:$WebPort/Shamir/128-bit-$ArraySize/shamir-party.html?arguments=-N,$NPlayers,-w,-ss,$SSHost:$SSPort,$i,innerprod" > $file 2>&1 &
    elif [ $Protocol -eq 1 ]; then
      python3 execute.py "https://$WebHost:$WebPort/Rep-Ring/128-bit-$ArraySize/replicated-ring-party.html?arguments=-w,-ss,$SSHost:$SSPort,$i,innerprod" > $file 2>&1 &
    elif [ $Protocol -eq 2 ]; then
      ## for rep4-ring
      python3 execute.py "https://$WebHost:$WebPort/Rep4-Ring/128-bit-$ArraySize/rep4-ring-party.html?arguments=-w,-ss,$SSHost:$SSPort,$i,innerprod" > $file 2>&1 &
    else
      echo "Protocol ID $Protocol not supported yet" > $file 2>&1; exit;
    fi
    pids[${i}]=$!
  done

  # wait for all pids
  for pid in ${pids[*]}; do
      wait $pid
  done

  # open file and read results
  file=""
  last=$((NPlayers - 1))
  for (( i = $((NPlayers - 1)); i >= 0; i-- )) 
  do
    file="Logs/player-$i-$j.log"
    check_time=$(head -n 1 $file)
    echo -n "Player-$i($check_time) "
  done
  echo
  echo "Result: $(head -n 2 $file | tail -n 1)"
done
