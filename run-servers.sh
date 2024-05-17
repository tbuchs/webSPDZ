#!/usr/bin/env bash

#Web-Server
echo 'Starting Web-Server...'
python3 $ROOT/wasm-server.py &> /dev/null &

#Signaling-Server
echo 'Starting Signaling-Server...'
nodejs $ROOT/signaling_ws_server.js &> /dev/null &