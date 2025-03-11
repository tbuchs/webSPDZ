import sys
import http.server
import ssl

class CORSRequestHandler (http.server.SimpleHTTPRequestHandler):
    def end_headers (self):
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        return super(CORSRequestHandler, self).end_headers()


httpd = http.server.HTTPServer((sys.argv[1], int(sys.argv[2])), CORSRequestHandler)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile="./certificates/server.cert", keyfile="./certificates/server.key")
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
httpd.serve_forever()
