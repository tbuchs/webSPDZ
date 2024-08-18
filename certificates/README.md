Generated with openssl:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.cert
```

As this is a self-signed certificate, you will need to add it to your trusted certificates in your browser. Note that this needs to be done for the signaling server as well since the WebSocket connection is secured with wss:// protocol and the browser will not allow the connection if the certificate is not trusted.