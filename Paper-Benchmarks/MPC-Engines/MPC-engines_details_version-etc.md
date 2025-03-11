* JIFF ("JavaScript library for building web apps that employ MPC")
  - https://multiparty.org/jiff
  - Version: from June 6th 2024 (https://github.com/multiparty/jiff, Commit ID: f5a22d8). 
  - Dot-product implementation based on Hastings et al.'s example code (https://github.com/MPC-SoK/frameworks). 
    To improve performance, we reduced the server's log output.
  - Browser: we use node.js to run JIFF. Since both node.js and, e.g., the
    Web Browser Google Chrome use the same underlying engine, V8, using
    node.js should lead to comparable or even better performance than a
    pure browser environment37.
* MPyC-Web ("Web Variant of Multiparty Computation in Python")
  - https://github.com/e-nikolov/mpyc-web
  - Version: from February 16th 2024 (Commit ID: 5b72f19). 
  - Dot-product implementation based on Keller's benchmarking code (MPyC) (https://github.com/mkskeller/mpc-benchmarks).
  - Browser: Firefox 132.0.1. MPyC-Web compiles the (Python) source to Wasm.
* webSPDZ ("Web Variant of Multi-Protocol-SPDZ")
  - Version: based on MP-SPDZ's source from June 20th 2024 (https://github.com/data61/MP-SPDZ, Commit ID:
18e934f).
  - Dot-product implementation based on Keller's benchmarking code (MP-SPDZ) (https://github.com/mkskeller/mpc-benchmarks).
  - Browser: Firefox Nightly 134.0a1. webSPDZ compiles the (C++) source to Wasm.
* MP-SPDZ
  - Same version as for webSPDZ