#include <vector>
#include <set>
#include <iostream>
#include <fstream>
#include <json.hpp>
using json = nlohmann::json;
using namespace std;

#include "sockets.h"
#include "Player.h"

static EM_BOOL WebSocketOpen_WebSocketPlayer([[maybe_unused]]int eventType, const EmscriptenWebSocketOpenEvent *websocketEvent, void *userData) {
  // register on websocket server
  WebSocketPlayer* player = (WebSocketPlayer*)userData;
  string number_players = to_string(player->num_players());
  json message = {{"type", "login"}, {"group", player->get_id()}, {"name", player->my_num()}, {"content", player->num_players()}};
  int result = emscripten_websocket_send_utf8_text(websocketEvent->socket, message.dump().c_str());
  if (result < 0) {
    cerr << "WebSocket send failed with error code " << result << endl;
    error("WebSocket send failed");
    exit(1);
  }
  return EM_TRUE;
}

static EM_BOOL WebSocketMessage_WebSocketPlayer([[maybe_unused]]int eventType, const EmscriptenWebSocketMessageEvent *e, void *userData)
{
  WebSocketPlayer* player = (WebSocketPlayer*)userData;
  if(player->connected)
  {
    int sender_id = e->data[e->numBytes - 2];
    player->add_message(sender_id, (octet*)e->data, e->numBytes - 2);
  }
  else
  {
    string message((char*)e->data);
    json json_msg = json::parse(message);

    if (json_msg["type"] == "login") {
      if(json_msg["success"] != true) {
        cout << "Login failed (error: " << json_msg["message"] << ")" << endl;
        error("Login failed");
      }
      player->set_group_id(size_t(json_msg["groupid"]));
      player->connected = true;
    } else {
      cout << "Unknown message type" << endl;
      exit(1);
    }
  }
  return EM_TRUE;
}

EM_BOOL WebSocketClose_WebSocketPlayer(int eventType, const EmscriptenWebSocketCloseEvent *e, [[maybe_unused]]void *userData)
{
  cerr << "close(eventType=" << eventType << ", wasClean=" << e->wasClean << ", code=" << e->code << ", reason=" << e->reason << endl;
	return EM_TRUE;
}

EM_BOOL WebSocketError_WebSocketPlayer(int eventType, [[maybe_unused]]const EmscriptenWebSocketErrorEvent *e, [[maybe_unused]]void *userData)
{
  cerr << "error(eventType=" << eventType << ")" << endl;
  exit(1);
	return EM_TRUE;
}