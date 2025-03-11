#!/usr/bin/env bash

HERE=$(cd `dirname $0`; pwd)
ROOT=$HERE/

# sig_srv_IP='172.16.34.9' #'localhost'
sig_srv_IP='172.16.37.9' #'localhost'
sig_srv_port=8089

# Check parameters
# if [ $# -eq 2 ]; then
#   sig_srv_IP=$1 
#   sig_srv_port=$2 
# else
#     echo "Usage: ./run...signaling-server.sh [IP] [port]";
#     exit -1;
# fi

# Run WebRTC's Signaling Server
echo "Starting WebRTC's Signaling-Server @ $sig_srv_IP:$sig_srv_port 🛜"
kill -9 $(lsof -t -i:$sig_srv_port) > /dev/null 2>&1 # kill potential service to allow port binding
nodejs $ROOT/signaling_ws_server.js $sig_srv_IP $sig_srv_port > Logs/signaling-server.log 2>&1 #&
# nodejs $ROOT/signaling_ws_server.js $sig_srv_IP $sig_srv_port 2>&1
