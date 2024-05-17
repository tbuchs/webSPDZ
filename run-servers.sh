#!/usr/bin/env bash

#Web-Server
echo 'Starting Web-Server...'
python3 wasm-server.py &> /dev/null &

#Signaling-Server
echo 'Starting Signaling-Server...'
nodejs signaling_ws_server.js &> /dev/null &