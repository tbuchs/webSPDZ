// Import required modules
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { log } = require('console');

// Create an Express application
const app = express();

// Enable CORS (Cross-Origin Resource Sharing) to allow shared array buffers
app.use((req, res, next) => {
  // res.header('Access-Control-Allow-Origin', '*');
  // res.header('Access-Control-Allow-Headers', '*');
  res.header("Cross-Origin-Opener-Policy", "*")
  res.header("Cross-Origin-Embedder-Policy", "*")
  next();
});

// Serve static files (e.g., HTML) from the 'public' directory
app.use(express.static(__dirname));

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Create a WebSocket server by passing the HTTP server
const wss = new WebSocket.Server({ server });
var clients = [];
// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket connected');
  clients.push(ws);

  // WebSocket message handling
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    
    // You can send a response back to the client if needed
    ws.send(message);
  });

  // WebSocket connection closed
  ws.on('close', () => {
    console.log('WebSocket disconnected');
  });
});

// Catch-all route to serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'malicious-shamir-party.html'));
});

// Start the server on port 5000
const PORT = process.argv[2] || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
