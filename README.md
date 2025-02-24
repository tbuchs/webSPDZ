# webSPDZ
This project is a fork of the MPC framework [MP-SPDZ](https://github.com/data61/MP-SPDZ). 

webSPDZ aims to bring the MP-SPDZ framework to the browser and facilitate the use of secure multi-party computation.

## Building and Running webSPDZ
The building process differs from the original MP-SPDZ since the project is built using WebAssembly. For a more detailed description of the original building process, please refer to the [README](README_MPSPDZ.md) of the MP-SPDZ project.

### Prerequisites
- [Emscripten](https://emscripten.org/docs/getting_started/downloads.html)
- [Node.js](https://nodejs.org/en/download/)
- [Firefox](https://www.mozilla.org/firefox/new/), [Chrome](https://www.google.com/intl/en_uk/chrome/) or any browser that supports WASM and Memory64 (available since Firefox 134 and Chrome 133)
- [Python 3](https://www.python.org/downloads/)

There are more prerequisites for running webSPDZ, but they are already included in the repository as submodules or pre-built archives. For an overview have a look at the [deps folder](deps/) and [local folder](local/).

### Building
To initialize the [WebRTC-datachannel](https://github.com/paullouisageneau/datachannel-wasm) library upon first compilation and install the needed websocket package for nodejs, run:
```make setup```

See [Programs/Source/](Programs/Source/) for some example MPC programs. To run the [tutorial.mpc](Programs/Source/tutorial.mpc) in default mode run:
```./compile.py Programs/Source/tutorial.mpc```

After that, to build webSPDZ with e.g. Shamir's protocol and the previously compiled program, simply run:
```make shamir -j```

This command is similar for other protocols. Currently, webSPDZ is only tested with limited protocols, but is easy to extend.

**Supported protocols for Honest majority**
- Replicated-Ring Party
- Rep4-Ring Party
- Shamir Party
- Malicious Shamir Party

**Supported protocols for Dishonest majority**
- Semi2k Party

**Other Building options**

Please note that webSPDZ provides different options when building. Available options can be found in the [Config](CONFIG) file.
webSPDZ uses the WebAssembly-based Filesystem [WASMFS](https://emscripten.org/docs/api_reference/Filesystem-API.html#new-file-system-wasmfs), which aimes to be faster and more modular than the default Filesystem. Due to the nature of Emscripten, files are packaged at compile time and therefore every modification of the MPC program needs a recompilation. This can be circumvented by compiling and linking the program with "-sASYNCIFY=1". Files from the Filesystem are then fetched from the WebServer at runtime. However, be aware that this leads to an increased runtime and size of webSPZD (this is why it is disabled per default). 

### Running
To run webSPDZ, start a server for hosting the webpage. Some features of WebAssembly only work in [secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts), which requires some additional headers to be specified by the server:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
The needed services (WebServer and SignalingServer for establishing the secure WEBRTC connection) are already included in the repository. Both servers can be started by executing ```./run-servers.sh```.
Otherwise, the servers can be started manually:
```
python3 https-server.py "IP" "PORT"
node signaling_wss_server.js "IP" "PORT"
```

If webSockets should be used for communication instead of webRTC, you can use `node websocket_server.js "IP" "PORT"`. Please be aware that this communication is not P2P and therefore not as secure as webRTC.

To execute the protocol, open a Firefox/Chrome browser and open the generated HTML file: `http://localhost:8000/"Protocolname"-party.html`.

Parameters for the computation must be set in the URL. An overview of available parameters for the different protocols can be found in the [MP-SPDZ Readme](README_MPSPDZ.md).

An URL for executing webSPDZ must contain the following parameters: `$webServerIP:$webServerPORT/$Protocol_Name.html?arguments=$Protocol_Paramters, --web, $USE_Websockets, $PlayerID, $PROGRAM
Important flags related to webSPDZ are:
- webServerIP/Port: the IP and Port the webServer is running on
- Protocol_Name: the previously compiled protocol
- Porotcol_Parameters: MP-SPDZ related parameters like `-N, 3` for executing the protocol with 3 Parties
- `--web` or `-w`: essential flag to indicate the execution of webSPDZ in a browser
- USE_Websockets: `0` for using webRTC as communication channel, `1` for webSockets
- optional: `--signaling-server` or `-ss`: to use a signaling server different than the default "localhost:8080"
- PROGRAM: the name of the MPC program

As an example: running the (tutorial.mpc)[[Programs/Source/](Programs/Source/tutorial.mpc) ] file with Shamir's protocol and 3 Parties, webRTC and a custom signaling server, would require 3 browser tabs with the following URLs:
 ```
localhost:8000/shamir-party.html?arguments=-N,3,-w,0,-ss,192.168.1.1:2000,0,tutorial
localhost:8000/shamir-party.html?arguments=-N,3,-w,0,-ss,192.168.1.1:2000,1,tutorial
localhost:8000/shamir-party.html?arguments=-N,3,-w,0,-ss,192.168.1.1:2000,2,tutorial
 ```

Please note that the certificates used for https-server and websocket server in the repository are self-signed and may not be trusted by the browser. You may need to add an exception to the certificate in the browser. Easily done by visiting `https://localhost:XXXX` (where XXXX names the port of https- and wss-server) and adding an exception.
