# webSPDZ: Versatile MPC on the Web

🌄 This work, webSPDZ, aims to push the boundaries of practical MPC, <br>
making it more usable and enabling it for a broader community.

🙌 Multi-party computation (MPC) has become increasingly practical in the last two decades, solving privacy and security issues in
various domains, such as healthcare, finance, and machine learning. 
One big caveat is that MPC sometimes lacks usability since the knowledge barrier for regular users can be high. 
Users have to deal with, e.g., various CLI tools, private networks, and sometimes even must install many dependencies, which are often hardware-dependent.
A solution to improve the usability of MPC is to build browser-based MPC engines where each party runs within a browser window.

🌇 **webSPDZ** is a **general-purpose MPC web engine** that enables versatile MPC on the web, supporting different security models (e.g., honest/dishonest majority and active/passive corruption) by using various MPC protocols.
As such, webSPDZ brings the _general-purpose MPC native engine MP-SPDZ_ to the web browser.
MP-SPDZ is one of the most performant and versatile general-purpose MPC engines, supporting ≥40 MPC protocols with different security models.

🪵 As basis, webSPDZ builds on [MP-SPDZ](https://github.com/data61/MP-SPDZ). 
To port MP-SPDZ to the web, we use _Emscripten_ to compile MP-SPDZ’s C++ BackEnd to WebAssembly and _WebRTC_/_WebSockets_ to enable peer-to-peer party communication in the web browser. 
We believe that webSPDZ brings forth many interesting and practically relevant use cases. 

###  Contributors & Contact:
* **[Thomas Buchsteiner](https://github.com/tbuchs)** **(core developer)** ✉️  thomas.buchsteiner@gmail.com
* [Karl W. Koch](https://gihub.com/kaydoubleu) ✉️  karl.koch@tugraz.at
* [Dragoș Rotaru](https://github.com/rdragos) ✉️  dragos@mygateway.xyz

🎟️ Preferrably, [create a GitHub ticket](https://github.com/tbuchs/webSPDZ/issues). <br>
✉️ Otherwise, please send an email to all of us to ensure that we receive your message :)


### Table of Contents in this README:
* [⚙️🏃 Building and Running webSPDZ](#%EF%B8%8F-building-and-running-webspdz)
  - [🪵 Prerequisites](#-prerequisites-for-building--running)
  - [🛡️ Supported Security Models](#%EF%B8%8F-supported-security-models)
  - [⚙️ Building](#%EF%B8%8F-building) 
  - [🏃 Running](#-running)
* [📑 Paper and Citation](#-paper-and-citation)
* [🏋️ Further Information on Transforming MP-SPDZ to webSPDZ](#%EF%B8%8F-further-information-on-transforming-mp-spdz-to-webspdz)
___
## ⚙️🏃 Building and Running webSPDZ
The building process differs from the original MP-SPDZ since the project uses WebAssembly. For a more detailed description of the original building process, please refer to [MP-SPDZ's README](README_MPSPDZ.md).

___
### 🪵 Prerequisites for Building & Running
- [Emscripten](https://emscripten.org/docs/getting_started/downloads.html)
- [Node.js](https://nodejs.org/en/download/)
- [Firefox](https://www.mozilla.org/firefox/new/), [Chrome](https://www.google.com/intl/en_uk/chrome/) or any browser that supports:
  1.  [WebAssembly](https://webassembly.org) and [Memory64](https://webassembly.org/features/) (available since Firefox 134 and Chrome 133) and
  2.  [WebRTC](https://webrtc.org)
- [Python 3](https://www.python.org/downloads/)

These are webSPDZ's main prerequisites.
webSPDZ includes further prerequesites as submodules or pre-built archives in this repository. For an overview, have a look at the [deps](deps/) and [local](local/) folders.

___
### 🛡️ Supported Security Models
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

See [MP-SPDZ's repository](https:github.com/data61/MP-SPDZ) for further MPC protocols.
We can _fairly easily_ extend webSPDZ for further (MP-SPDZ-supported) protocols.
For further information on MPC's security models, check, e.g., [Nigel Smart's _Computing on Encrypted Data_](https://doi.org/10.1109/MSEC.2023.3279517) or [Yehuda Lindell's _Secure Multiparty Computation_](https://doi.org/10.1145/3387108).

___
### ⚙️ Building
To initialize the [WebRTC-datachannel](https://github.com/paullouisageneau/datachannel-wasm) library upon first compilation and install the needed websocket package for nodejs, run:
```make setup```

See [Programs/Source/](Programs/Source/) for some example MPC programs. To run the [tutorial.mpc](Programs/Source/tutorial.mpc) in default mode run:
```./compile.py Programs/Source/tutorial.mpc```

Then, to build webSPDZ using, e.g., Shamir's protocol and the previously compiled program, run: `make shamir -j`. 
This command is similar for other protocols.

**Other Building options**

Please note that webSPDZ provides different options when building. Available options can be found in the [Config](CONFIG) file.
webSPDZ uses the WebAssembly-based filesystem [WASMFS](https://emscripten.org/docs/api_reference/Filesystem-API.html#new-file-system-wasmfs), which aimes to be faster and more modular than the default filesystem. Due to the nature of Emscripten, files are packaged at compile time and therefore every modification of the MPC program needs a recompilation. This can be circumvented by compiling and linking the program with "-sASYNCIFY=1". Files from the filesystem are then fetched from the web server at runtime. However, be aware that this leads to an increased runtime and size of webSPDZ (this is why it is disabled per default). 

___
### 🏃 Running
To run webSPDZ, start a server for hosting the webpage. Some features of WebAssembly only work in [secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts), which requires some additional headers to be specified by the server:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
The needed services (WebServer and SignalingServer for establishing the secure WebRTC connection) are already included in the repository. Both servers can be started by running ```./run-servers.sh```.
Otherwise, the servers can be started manually:
```
python3 https-server.py "IP" "PORT"
node signaling_wss_server.js "IP" "PORT"
```

If WebSockets should be used for communication instead of WebRTC, you can use `node websocket_server.js "IP" "PORT"`. Please be aware that this communication is not P2P and therefore not as secure as WebRTC.

To execute the protocol, open a Firefox/Chrome browser and open the generated HTML file: `http://localhost:8000/"Protocolname"-party.html`.

Parameters for the computation must be set in the URL. An overview of available parameters for the different protocols can be found in the [MP-SPDZ Readme](README_MPSPDZ.md).

A URL for running webSPDZ must contain the following parameters: <br>
`$webServerIP:$webServerPORT/$Protocol_Name.html?arguments=$Protocol_Parameters, --web, $USE_Websockets, $PartyID, $PROGRAM`
Important flags related to webSPDZ are:
- `webServerIP:webServerPORT:` the IP and port the WebServer is running on
- `Protocol_Name:` the (previously) compiled MPC protocol
- **Arguments:**
  - `Protocol_Parameters:` MP-SPDZ related parameters like `-N, 3` to run the protocol with 3 parties
  - `--web` or `-w`: essential flag to indicate webSPDZ's running in a browser
  - `USE_Websockets:` `0` for using WebRTC as communication channel, `1` for WebSockets
  - optional: `--signaling-server` or `-ss`: to use a signaling server different than the default "localhost:8080"
  - `PartyID:` the id of the respective party, which must align with the corresponding MPC program to ensure correctness (e.g., when party `0` and `1` input different data)
  - `PROGRAM:` the name of the MPC program

For instance, running [tutorial.mpc](Programs/Source/tutorial.mpc) using Shamir's MPC protocol with 3 parties, WebRTC, and a custom signaling server, open 3 compatible browser tabs with the following URLs:
 ```
localhost:8000/shamir-party.html?arguments=-N,3,-w,0,-ss,192.168.1.1:2000,0,tutorial
localhost:8000/shamir-party.html?arguments=-N,3,-w,0,-ss,192.168.1.1:2000,1,tutorial
localhost:8000/shamir-party.html?arguments=-N,3,-w,0,-ss,192.168.1.1:2000,2,tutorial
 ```

Please note that the used certificates for the `https-server` and `websocket` servers in the repository are self-signed and may not be trusted by the browser. You may need to add an exception in the "trusted certificate store" in the browser. For instance, visit `https://localhost:XXXX` (where XXXX names the port of https- and wss-server) and add the exception.

___
## 📑 Paper and Citation

webSPDZ's design rationale is described [in this paper](https://eprint.iacr.org/2025/487).
If you use it in one of your projects, please cite it as:
```
@misc{cryptoeprint:2025/487,
      author = {Thomas Buchsteiner and Karl W. Koch and Dragos Rotaru and Christian Rechberger},
      title = {{webSPDZ}: Versatile {MPC} on the Web},
      howpublished = {Cryptology {ePrint} Archive, Paper 2025/487},
      year = {2025},
      url = {https://eprint.iacr.org/2025/487}
}
```

<html> </html>
    <!-- booktitle 	= {Proceedings of the 2020 ACM SIGSAC Conference on Computer and Communications Security},-->
    <!-- doi 	= {10.1145/3372297.3417872}, -->
    <!--url 	= {https://doi.org/10.1145/3372297.3417872},-->

---
## 🏋️ Further Information on Transforming MP-SPDZ to webSPDZ
Next to the paper, in this subsection, we describe additional transformation details for some aspects:

### On Porting Libraries

**Libsodium and OpenSSL** are cryptographic libraries that can _fairly easily_ be ported to Wasm. Emscripten provides the `emconfigure` command, which can be used to replace all default environment variables with Emscripten-specific ones. Libsodium provides a build script for Emscripten, which provides necessary commands: `./dist-build/emscripten.sh --sumo`. We only add `-sMEMORY64=1` as an option for compilation and linking. OpenSSL must be built manually using various flags: `emconfigure ./config no-hw no-shared no-asm no-ssl3 no-engine -static`. Then, we modify the resulting Makefile since the compiler path is not correctly set. We fix the compiler path by clearing the `CROSS_COMPILE` variable path to an empty string and adding again the flag `-sMEMORY64=1`. Finally, we can build the library with the Emscripten's `emmake` compiler command. Emscripten's compiler links the resulting _".a archive"_ in the framework.

### On Compiler Settings, Threats, and APIs

**Compiler flags.** We use several compiler flags to enable MP-SPDZ in the web browser. For instance,

* `-sMEMORY64=1` to generates 64-bit Wasm code.
* `-sASSERTIONS` or `-sEXCEPTION_CATCHING_ALLOWED` to emulate unsupported Wasm features without changing large parts of the C++ code.
* `-sASYNCIFY` to enable synchronous C++ code and asynchronous JavaScript code. We require this interplay of C++ and JavaScript, e.g., when waiting for a network response from other parties.

However, some Emscripten compiler flags can lead to a performance decrease and a larger code size. For instance, we experienced slower runtimes when using `-sASYNCIFY` or `-sEXCEPTION_CATCHING_ALLOWED`. Therefore, these options are only enabled in the Makefile if they are required. For example, we only use `-sASSERTIONS` and `-sEXCEPTION_CATCHING_ALLOWED` only in debugging mode.

**Dealing with the UI Thread.** The web browser uses the main thread to run code and perform tasks in the UI. When we have a synchronous operation, such as waiting for another party's input, the UI freezes until the operation has finished. We have implemented a solution that avoids this UI freezing by implementing a thread management solution. webSPDZ's web application runs in a separate thread, using the `-sPROXY_TO_PTHREAD` compiler flag. Now, the UI thread spawns a new thread within this application thead and only becomes active if needed.

Within the application thread, we can also use multithreading. Though, without a thread pool, the application needs to wait for the UI thread to create a new (p)thread within the application thread. To reduce waiting time when creating a new (p)thread, the compiler flag `-sPTHREAD` `-POOL_SIZE=20` allows to [create a thread pool when starting](https://emscripten.org/docs/porting/pthreads.html#compiling-with-pthreads-enabled) webSPDZ's web application (15 potential (p)threads in this example).

However, there are cases where the application thread needs the support of the UI thread. For instance, [some components of the WebRTC API](https://w3c.github.io/webrtc-pc/#interface-definition) are only exposed to the web browser's _Window_ component, which only the UI thread can access. Therefore, some WebRTC-related networking parts can only run in the UI thread. To proxy between the application threads and UI thread, Emscripten provides the `proxying.h API`. Though, the thread proxying can lead to a performance decrease.
