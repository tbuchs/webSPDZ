
const ws = require('ws');
var wss = new ws.Server({port: 8080}); 

//all connected to the server users 
var users = new Map();
var currNumPlayers = new Map();
var userNames = new Set();
var userGroups = new Set();

//number of players to connect
var totalNumPlayers = 0;
  
wss.on('connection', function(connection) {
   connection.on('message', function(message) {	
      var data; 
      try {
         data = JSON.parse(message); 
      } catch (e) { 
         console.log("Invalid JSON");
         data = {}; 
      } 
      switch (data.type) { 		
         case "login": 				
            //if anyone is logged in with this username then refuse
            if(userGroups.has(data.group) && (typeof users[data.group][data.name] !== 'undefined')) {
               console.log("Usergroup: " + data.group + " name: " + data.name + " has " + users[data.group][data.name]); 
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
 
               // save user connection on the server
               if(currNumPlayers[data.group] == null) {
                  currNumPlayers[data.group] = 0;
                  users[data.group] = Array.apply(null, Array(totalNumPlayers)).map(function () {});
               }

               users[data.group][data.name] = connection;
               userNames.add(data.name);
               userGroups.add(data.group);
               connection.name = data.group + '/' + data.name; 
               currNumPlayers[data.group]++;
					
               sendTo(connection, { 
                  type: "login", 
                  success: true 
               });
               console.log(connection.name, "logged in");
               
               // notify all players when all players have logged in
               if(currNumPlayers[data.group] == totalNumPlayers) {
                  console.log("All players have logged in");
                  for(let i of users[data.group]) {
                     sendTo(i, {
                        type: "start",
                        players: totalNumPlayers
                     });
                  }
               }
            } 
            break; 
				
         case "offer": 
            console.log("Sending offer from " + connection.name + " to: " + data.group + '/' + data.name); 
            var conn = users[data.group][data.name];
            if(conn != null) { 
               connection.otherName = data.group + '/' + data.name; 
               sendTo(conn, { 
                  type: "offer", 
                  group: connection.name.split('/')[0],
                  name: connection.name.split('/')[1],
                  offer: data.content
               }); 
            } else {
               console.log("Offer not sent");
            }
            break;  
				
         case "answer": 
            console.log("Sending answer from " + connection.name + " to: " + data.group + '/' + data.name);
            var conn = users[data.group][data.name];
				
            if(conn != null) { 
               connection.otherName = data.group + '/' + data.name; 
               sendTo(conn, { 
                  type: "answer", 
                  name: connection.name, 
                  answer: data.content
               }); 
            } else {
               console.log("Answer not sent");
            }
				
            break;  

         case "candidate":
            console.log("Sending candidate from " + connection.name + " to: " + data.group + '/' + data.name);
            var conn = users[data.group][data.name];
            if(conn != null) {
               sendTo(conn, {
                  type: "candidate",
                  name: connection.name,
                  candidate: data.content
               });
            } else
               console.log("Candidate not sent");
            break;
	
         default: 
            sendTo(connection, { 
               type: "error", 
               message: "Unknown message type: " + data.type 
            }); 
            break; 
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

function shutDown() {
   console.log("All Players disconnected. Shut down server now...");
   wss.close();
}