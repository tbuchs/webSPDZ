
const ws = require('ws');
var wss = new ws.Server({port: 8080}); 

//all connected to the server users 
var users = {};
var userNames = new Set();

//number of players to connect
var totalNumPlayers = 0;
var currNumPlayers = 0;
  
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
            if(userNames.has(data.name)) { 
               sendTo(connection, { 
                  type: "login", 
                  success: false,
                  message: "Username is unavailable!"
               });
              } else if((currNumPlayers != 0) && (totalNumPlayers != data.content)) {
                sendTo(connection, {
                    type: "login",
                    success: false,
                    message: "Number of players does not match!"
                });
            } else {
               // first player sets the number of players
               if(currNumPlayers == 0)
                  totalNumPlayers = data.content;
 
               // save user connection on the server 
               users[data.name] = connection; 
               userNames.add(data.name);
               connection.name = data.name; 
               currNumPlayers++;
					
               sendTo(connection, { 
                  type: "login", 
                  success: true 
               });
               console.log(connection.name, "logged in");
               
               // notify all players when all players have logged in
               if(currNumPlayers == totalNumPlayers) {
                  console.log("All players have logged in");
                  for(var i in users) {
                     sendTo(users[i], {
                        type: "start",
                        players: totalNumPlayers
                     });
                  }
               }
            } 
            break; 
				
         case "offer": 
            console.log("Sending offer from " + connection.name + " to: " + data.name); 
            var conn = users[data.name];
            if(conn != null) { 
               connection.otherName = data.name; 
               sendTo(conn, { 
                  type: "offer", 
                  name: connection.name, 
                  offer: data.content
               }); 
            } else {
               console.log("Offer not sent");
            }
            break;  
				
         case "answer": 
            console.log("Sending answer from " + connection.name + " to: " + data.name); 
            var conn = users[data.name];
				
            if(conn != null) { 
               connection.otherName = data.name; 
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
            console.log("Sending candidate from " + connection.name + " to: " + data.name);
            var conn = users[data.name];
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
      delete users[connection.name];
      currNumPlayers--;
      console.log("Disconnecting from", connection.name);
      }
      if(currNumPlayers == 0) {
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