var path = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);

// Serve static files
//Configure App
app.use('/', express.static(path.join(__dirname)));
// app.use('/jiff', express.static(path.join(__dirname, 'node_modules', 'jiff-mpc', 'dist')));
// app.use('/jiff/ext', express.static(path.join(__dirname, 'node_modules', 'jiff-mpc', 'lib', 'ext')));

const { JIFFServer, JIFFServerBigNumber } = require('jiff-mpc');
const jiffServer = new JIFFServer(http, { logs: true });
jiffServer.apply_extension(JIFFServerBigNumber);

// Serve static files.
http.listen(8080, function () {
  console.log('listening on *:8080');
});

console.log('Direct your browser to http://localhost:8080/.');
console.log('To run a node.js based party: node party.js <input>');
console.log();
