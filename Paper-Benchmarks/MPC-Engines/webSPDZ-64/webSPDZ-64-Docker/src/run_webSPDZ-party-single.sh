#!/usr/bin/env bash

HERE=$(cd `dirname $0`; pwd)
ROOT=$HERE/

wSZ_app_IP="172.16.37.8"
wSZ_app_port=8080

sig_srv_IP="172.16.37.9"
sig_srv_port=8089

nr_players=3;
player_id=-1;
protocol=0; # 0 = shamir, 1 = rep-ring
array_size=100000;

#Start execution
if [ $# -eq 4 ]; then
    nr_players=$1;
    player_id=$2;
    protocol=$3;
    array_size=$4;
else
    echo "Usage: ./run...single.sh [Number of Players] [Player ID] [Protocol (0=shamir, 1=rep-ring), [ArraySize (100, 1000, 10 000, 100 000)]]";
    echo "       // Note: Player Number for Replicated Ring Protocol is fixed to 3 Players"
    exit -1;
fi

# Starting the browser
file="Logs/party_${player_id}.log"
echo ".. Player $player_id: Running computation with protocol $protocol (0=shamir, 1=rep-ring), $nr_players parties and array size $array_size" > $file;
# if [ $protocol -eq 0 ]; then
#   python3 execute.py "https://$wSZ_app_IP:$wSZ_app_port/Shamir/128-bit-$array_size/shamir-party.html?arguments=-N,$nr_players,-w,-ss,$sig_srv_IP:$sig_srv_port,$player_id,innerprod" > $file 2>&1 &
#   # python3 execute.py "https://$wSZ_app_IP:$wSZ_app_port/Shamir/128-bit-$array_size/shamir-party.html?arguments=-N,$nr_players,-w,-ss,$sig_srv_IP:$sig_srv_port,$player_id,innerprod" 2>&1 &
# else
#   python3 execute.py "https://$wSZ_app_IP:$wSZ_app_port/Rep-Ring/128-bit-$array_size/replicated-ring-party.html?arguments=-w,-ss,$sig_srv_IP:$sig_srv_port,$player_id,innerprod" > $file 2>&1 &
#   # python3 execute.py "https://$wSZ_app_IP:$wSZ_app_port/Rep-Ring/128-bit-$array_size/replicated-ring-party.html?arguments=-w,-ss,$sig_srv_IP:$sig_srv_port,$player_id,innerprod" 2>&1 &
# fi
case $protocol in
0) echo "Shamir Passive" >> $file 2>&1; 
  python3 execute.py "https://$wSZ_app_IP:$wSZ_app_port/Shamir/128-bit-$array_size/shamir-party.html?arguments=-N,$nr_players,-w,-ss,$sig_srv_IP:$sig_srv_port,$player_id,innerprod" >> $file 2>&1 & ;;
1) echo "Rep R." >> $file 2>&1;
  python3 execute.py "https://$wSZ_app_IP:$wSZ_app_port/Rep-Ring/128-bit-$array_size/replicated-ring-party.html?arguments=-w,-ss,$sig_srv_IP:$sig_srv_port,$player_id,innerprod" >> $file 2>&1 & ;;
2) echo "Rep4 R." >> $file 2>&1; 
  python3 execute.py "https://$wSZ_app_IP:$wSZ_app_port/Rep4-Ring/128-bit-$array_size/rep4-ring-party.html?arguments=-w,-ss,$sig_srv_IP:$sig_srv_port,$player_id,innerprod" >> $file 2>&1 & ;;
*) echo "Protocol ID $Protocol not supported yet" >> $file 2>&1; exit;;
esac
pid=$!

wait $pid

# open file and read results
# check_time=$(head -n 1 $file)
# echo -n "Player-$player_id($check_time) "
# echo
# echo "Result: $(head -n 2 $file | tail -n 1)"
