const fs = require('fs');
const https = require('https');
const ws = require('ws');

// Read SSL certificate and private key
const privateKey = fs.readFileSync('./certificates/server.key', 'utf8');
const certificate = fs.readFileSync('./certificates/server.cert', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate
};

const args = process.argv;

// Create an HTTPS server with the SSL credentials
const httpsServer = https.createServer(credentials);
httpsServer.listen(args[3], args[2], () => {
  console.log("Starting WebSocket Server at " + args[2] + ":" + args[3]);
});

// Create the WebSocket server on top of the HTTPS server
const wss = new ws.Server({ server: httpsServer });

//all connected to the server users 
var users = new Map();
var currNumPlayers = new Map();
var userNames = new Set();
var userGroups = new Map();
var userGroupsId = 0;

//number of players to connect
var totalNumPlayers = 0;
  
wss.on('connection', function(connection) {
   connection.on('message', function(message) {	
      var data = message;
      if(isValidJSON(data) == false)
      {
         const length = data.length;
         const name = data.readInt8(length - 2); // 0
         const group = data.readUInt8(length - 1); // 1
         var conn = users[group][name];
         data.writeInt8(connection.name.split('/')[1], length - 2); // 0
         conn.send(data);
      }
      else
      {
         var data = JSON.parse(message); 	
         console.log("Player: " + data.name + " group: " + data.group);		
         //if anyone is logged in with this username then refuse
         if(userGroups.has(data.group) && (typeof users[userGroups.get(data.group)][data.name] !== 'undefined')) {
            sendTo(connection, { 
               type: "login", 
               success: false,
               message: "Username is unavailable!"
            });
            } else if((userNames.size != 0) && (totalNumPlayers != data.content)) {
               console.log("Number of players " + data.content + " does not match with other players.");
               console.log("Current number of players: " + userNames.size);
               sendTo(connection, {
                  type: "login",
                  success: false,
                  message: "Number of players does not match!"
               });
         } else {
            // first player sets the number of players
            if(userNames.size == 0)
               totalNumPlayers = data.content;

            if(!userGroups.has(data.group))
               userGroups.set(data.group, userGroupsId++);

            let groupid = userGroups.get(data.group);
            // save user connection on the server
            if(currNumPlayers[groupid] == null) {
               currNumPlayers[groupid] = 0;
               users[groupid] = Array.apply(null, Array(totalNumPlayers)).map(function () {});
            }

            users[groupid][data.name] = connection;
            userNames.add(data.name);
            connection.name = groupid + '/' + data.name; 
            currNumPlayers[groupid]++;
                        
            // notify all players when all players have logged in
            if(currNumPlayers[groupid] == totalNumPlayers) {
               console.log("All players have logged in");
               for(let i of users[groupid]) {
                  sendTo(i, {
                     type: "login",
                     success: true,
                     groupid: groupid
                  });
               }
            }
         } 
      }  
   });  
	
   // when user exits/closes the browser window or established webrtc connections
   connection.on("close", function() { 
      if(connection.name) {
         var group = connection.name.split('/')[0];
         var name = connection.name.split('/')[1];
         users[group][name] = undefined;
         currNumPlayers[group]--;

         if(currNumPlayers[group] == 0) {
            userGroups.delete(group);
            users.delete(group);
         }
         console.log("Disconnected from", connection.name);
      }
      if(!userGroups || userGroups.size == 0) {
         console.log("All players have disconnected");
         userNames.clear();
         // setTimeout(shutDown, 3000); // wait 3 seconds before shutting down server
      } 
   });  	
});  

function sendTo(connection, message) {
   connection.send(JSON.stringify(message)); 
}

function isValidJSON(str) {
   try {
     JSON.parse(str);
     return true;
   } catch (e) {
     return false;
   }
 }