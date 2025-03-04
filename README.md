# webSPDZ: Versatile MPC on the Web

This work, webSPDZ, aims to push the boundaries of practical MPC, <br>
making it more usable and enabling it for a broader community.

Multi-party computation (MPC) has become increasingly practical in the last two decades, solving privacy and security issues in
various domains, such as healthcare, finance, and machine learning. 
One big caveat is that MPC sometimes lacks usability since the knowledge barrier for regular users can be high. 
Users have to deal with, e.g., various CLI tools, private networks, and sometimes even must install many dependencies, which are often hardware-dependent.
A solution to improve the usability of MPC is to build browser-based MPC engines where each party runs within a browser window.

**webSPDZ** is a **general-purpose MPC web engine** that enables versatile MPC on the web, supporting different security models (e.g., honest/dishonest majority and active/passive corruption) by using various MPC protocols.
As such, webSPDZ brings the _general-purpose MPC native engine MP-SPDZ_ to the web browser.
MP-SPDZ is one of the most performant and versatile general-purpose MPC engines, supporting ≥40 MPC protocols with different security models.
As basis, webSPDZ builds on an [MP-SPDZ](https://github.com/data61/MP-SPDZ) fork. 

To port MP-SPDZ to the web, we use _Emscripten_ to compile MP-SPDZ’s C++ BackEnd to WebAssembly and _WebRTC_/_WebSockets_ to enable peer-to-peer party communication in the web browser. 
We believe that webSPDZ brings forth many interesting and practically relevant use cases. 

### Contributors & Contact:
* **[Thoms Buchsteiner](https://github.com/tbuchs)** **(main author)** ✉️  thomas.buchsteiner@gmail.com
* [Karl W. Koch](https://gihub.com/kaydoubleu) ✉️  karl.koch@tugraz.at
* [Dragoș Rotaru](https://github.com/rdragos) ✉️  dragos@mygateway.xyz

🎟️ Preferrably, contact us by [creating a GitHub ticket](https://github.com/tbuchs/webSPDZ/issues).
✉️  Otherwise, please send an email to all of us to ensure receiving.


### Table of Contents in this README:
* [Building and Running webSPDZ](#building-and-running-webspdz)
  - [Prerequisites](#prerequisites)
  - [Supported Security Models](#supported-security-models)
  - [Building](#building)
  - [Running](#running)
* [Paper and Citation](#paper-and-citation)

___
## Building and Running webSPDZ
The building process differs from the original MP-SPDZ since the project is built using WebAssembly. For a more detailed description of the original building process, please refer to the [README](README_MPSPDZ.md) of the MP-SPDZ project.

___
### Prerequisites
- [Emscripten](https://emscripten.org/docs/getting_started/downloads.html)
- [Node.js](https://nodejs.org/en/download/)
- [Firefox](https://www.mozilla.org/firefox/new/), [Chrome](https://www.google.com/intl/en_uk/chrome/) or any browser that supports WASM and Memory64 (available since Firefox 134 and Chrome 133)
- [Python 3](https://www.python.org/downloads/)

There are more prerequisites for running webSPDZ, but they are already included in the repository as submodules or pre-built archives. For an overview have a look at the [deps folder](deps/) and [local folder](local/).

___
### Supported Security Models
webSPDZ supports different security models by using the following MPC protocols:

* **Honest majority**
  - Replicated-Ring (Passive) `replicated-ring-party.x`
  - Rep4-Ring (Active) `rep4-ring-party.x`
  - Passive Shamir `shamir-party.x`
  - Active Shamir `malicious-shamir-party.x`

* **Dishonest majority**
  - Semi2k (Passive) `semi2k-party.x`

One first decides how many parties can an adversary corrupt and the type of corruption. 
Depending on the amount of parties that can be (statically) corrupt, protocols largely classify into two categories:
1. **Honest majority**, where at most half of the parties are corrupt.
2. **Dishonest majority**, which allows up to all but one corrupted parties.

For types of corruptions, the MPC literature states primarily two:
1. **Passive or semi-honest**, where corrupted parties try to learn as much as possible from the protocol transcript.
2. **Active or malicious**, where corrupted parties can arbitrarily deviate from the protocol by sending malformed data.

See [MP-SPDZ's repository](https:github.com/data61/MP-SPDZ] for further MPC protocols.
We can _fairly easily_ extend webSPDZ for further (MP-SPDZ-supported) protocols.
For further information on MPC's security models, check, e.g., [Nigel Smart's _Computing on Encrypted Data_](https://doi.org/10.1109/MSEC.2023.3279517) or [Yehuda Lindell's _Secure Multiparty Computation_](https://doi.org/10.1145/3387108).

___
### Building
To initialize the [WebRTC-datachannel](https://github.com/paullouisageneau/datachannel-wasm) library upon first compilation and install the needed websocket package for nodejs, run:
```make setup```

See [Programs/Source/](Programs/Source/) for some example MPC programs. To run the [tutorial.mpc](Programs/Source/tutorial.mpc) in default mode run:
```./compile.py Programs/Source/tutorial.mpc```

After that, to build webSPDZ with e.g. Shamir's protocol and the previously compiled program, simply run:
```make shamir -j```

This command is similar for other protocols. 

**Other Building options**

Please note that webSPDZ provides different options when building. Available options can be found in the [Config](CONFIG) file.
webSPDZ uses the WebAssembly-based Filesystem [WASMFS](https://emscripten.org/docs/api_reference/Filesystem-API.html#new-file-system-wasmfs), which aimes to be faster and more modular than the default Filesystem. Due to the nature of Emscripten, files are packaged at compile time and therefore every modification of the MPC program needs a recompilation. This can be circumvented by compiling and linking the program with "-sASYNCIFY=1". Files from the Filesystem are then fetched from the WebServer at runtime. However, be aware that this leads to an increased runtime and size of webSPZD (this is why it is disabled per default). 

___
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

___
## Paper and Citation

webSPDZ's design rationale is described [in this paper](https://eprint.iacr.org/).
If you use it in one of your projects, please cite it as:
```
@article{webSPDZ,
    author 	= {Thomas Buchsteiner, Karl W. Koch, Dragos Rotaru, Christian Rechberger},
    title 	= {{webSPDZ}: Versatile MPC on the Web},
    journal     = {{IACR} Cryptol. ePrint Arch.},
    year 	= {2025},
    pages	= {...},
}
```

<html> </html>
    <!-- booktitle 	= {Proceedings of the 2020 ACM SIGSAC Conference on Computer and Communications Security},-->
    <!-- doi 	= {10.1145/3372297.3417872}, -->
    <!--url 	= {https://doi.org/10.1145/3372297.3417872},-->
