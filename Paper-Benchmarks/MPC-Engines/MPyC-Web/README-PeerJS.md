
* Run Docker via, e.g.:
  - (First building it:) `docker build -t peerjs-server_ubuntu_go`
  - `docker run -it --rm --name=PeerJS-Server --network=webSPDZ-Net --ip=172.16.37.8 -p 9443:9443 --cpus=4 --memory=4g --memory-swap=4g peerjs-server_ubuntu_go "peerjs --port 9443 --host 172.16.37.8 --path '/' --key peerjs --sslkey server.key --sslcert server.crt -v"`

