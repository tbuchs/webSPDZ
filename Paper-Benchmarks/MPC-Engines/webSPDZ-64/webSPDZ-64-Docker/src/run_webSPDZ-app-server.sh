#!/usr/bin/env bash

HERE=$(cd `dirname $0`; pwd)
ROOT=$HERE/

# wSZ_app_host='172.16.34.8'
wSZ_app_host='172.16.37.8'
wSZ_app_port=8080;

# Check parameters 
# if [ $# -eq 1 ]; then
#     wSZ_app_port=$1;
# else
#     echo "Usage: ./run...app-server.sh [wSZ-app-port]";
#     exit -1;
# fi

#Web-Server
kill -9 $(lsof -t -i:$wSZ_app_port) > /dev/null 2>&1 # kill potential service to allow port binding
echo "Starting webSPDZ's Web-App Server @ $wSZ_app_host:$wSZ_app_port 🙃"
echo "Starting webSPDZ's Web-App Server @ $wSZ_app_host:$wSZ_app_port 🙃" > Logs/server-test.log
python3 $ROOT/https-server.py $wSZ_app_host $wSZ_app_port > Logs/web-server.log 2>&1 #&
# python3 $ROOT/http-server.py $wSZ_app_port 2>&1
