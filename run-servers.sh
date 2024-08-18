#!/usr/bin/env bash

#Web-Server
echo 'Starting Web-Server...'
python3 https-server.py localhost 8000 &> /dev/null &

#Signaling-Server
echo 'Starting Signaling-Server...'
nodejs signaling_wss_server.js localhost 8080 &> /dev/null &