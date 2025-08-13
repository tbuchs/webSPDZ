FROM ubuntu:24.04

ENV HOME='/home'
WORKDIR $HOME

# apt update
RUN apt update
RUN apt upgrade -y

# PeerJS stuff
RUN apt install -y nodejs
RUN apt install -y npm
RUN npm install -g peer

COPY ./certificates/server.key server.key
COPY ./certificates/server.crt server.crt

# apt cleanup
RUN apt autoclean -y
RUN apt autoremove -y

# go for it (:
ENTRYPOINT ["/bin/bash", "-c"]
# ENTRYPOINT "/usr/bin/env bash -l -c 'peerjs --port 9443 --host 172.16.37.8 --path \'/\' --key peerjs --sslkey server.key --sslcert server.crt -v' "
# CMD "/bin/bash -c 'peerjs --port 9443 --host 172.16.37.8 --path \'/\' --key peerjs --sslkey server.key --sslcert server.crt -v' "

