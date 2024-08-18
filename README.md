# webSPDZ
This project is a fork of the MPC framework [MP-SPDZ](https://github.com/data61/MP-SPDZ). 

webSPDZ aims to bring the MP-SPDZ framework to the browser and facilitate the use of secure multi-party computation. The implementation is neither complete nor well-tested, but it provides a starting point for further development which is done at the moment.

## Building and Running webSPDZ
The building process differs from the original MP-SPDZ since the project is built using WebAssembly. For a more detailed description of the original building process, please refer to the [README](README_MPSPDZ.md) of the MP-SPDZ project.

### Prerequisites
- [Emscripten](https://emscripten.org/docs/getting_started/downloads.html)
- [Node.js](https://nodejs.org/en/download/)
- [Firefox](https://www.mozilla.org/firefox/new/)
- [Python 3](https://www.python.org/downloads/)

There are more prerequisites for running webSPDZ, but they are already included in the repository as submodules or pre-built archives. For an overview have a look at the [deps folder](deps/) and [local folder](local/).

### Building
To initialize the [WebRTC-datachannel](https://github.com/paullouisageneau/datachannel-wasm) library upon first compilation and install the needed websocket package for nodejs, run:
```make setup```

See [Programs/Source/](Programs/Source/) for some example MPC programs. To run the [tutorial.mpc](Programs/Source/tutorial.mpc) in default mode run:
```./compile.py Programs/Source/tutorial.mpc```

After that, to build webSPDZ with Shamir protocol and the previously compiled program, simply run:
```make shamir -j```

Other protocols are not supported at the moment but are under development.

### Running
To run webSPDZ, start a local server for hosting the webpage. Some features of WebAssembly only work in [secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts), which requires some additional headers to be specified by the server:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The needed services (WebServer and SignalingServer for establishing the secure WEBRTC connection) are already included in the repository. Both servers can be started by executing ```./run-servers.sh```.
Otherwise, the servers can be started manually:
```
python3 https-server.py
node signaling_wss_server.js
```

To execute the protocol, open a Firefox browser (other browsers are not tested at the moment) and open the generated HTML file: `http://localhost:8000/"Protocolname"-party.html`.

Please note that the certificates used for https-server and websocket server are self-signed and may not be trusted by the browser. You may need to add an exception to the certificate in the browser. Easily done by visiting `https://localhost:XXXX` (where XXXX names the port of https- and wss-server) and adding an exception.

Parameters for the computation must be set in the URL. An overview of available parameters can be found in the [MP-SPDZ Readme](README_MPSPDZ.md). 
To allow communication via WEBRTC add the flag `--web` or `-w`.


As an example: running the tutorial with 3 parties would require 3 browser tabs open with the following URLs:
 ```
localhost:8000/shamir-party.html?arguments=-N,3,-w,0,tutorial
localhost:8000/shamir-party.html?arguments=-N,3,-w,1,tutorial
localhost:8000/shamir-party.html?arguments=-N,3,-w,2,tutorial
 ```