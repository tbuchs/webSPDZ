/* Helper to handel the websocket connection and establishment of the webrtc connection
 *
 * Basically handles connection to the websocket server to establish a webrtc connection
 * between the parties
 * 
 * Based on the following example: https://github.com/paullouisageneau/libdatachannel/tree/master/examples/copy-paste
 *
 */

#include <vector>
#include <set>
#include <iostream>
#include <fstream>
#include <json.hpp>
using json = nlohmann::json;
using namespace std;

#include "sockets.h"
#include "Player.h"

#include <emscripten/websocket.h>
#include "datachannel-wasm/wasm/include/rtc/datachannel.hpp"
#include "datachannel-wasm/wasm/include/rtc/peerconnection.hpp"
#include "datachannel-wasm/wasm/include/rtc/configuration.hpp"

void send_websocket_message(int websocket, string type, string player, string msg) {
  json message = {{"type", type}, {"name", player}, {"content", msg}};
  int result = emscripten_websocket_send_utf8_text(websocket, message.dump().c_str());
  if (result < 0) {
    cerr << "WebSocket send failed with error code " << result << endl;
    error("WebSocket send failed");
    exit(1);
  }
}

inline const char* toString(rtc::PeerConnection::State s)
{
    switch (s)
    {
        case rtc::PeerConnection::State::New:   return "New";
        case rtc::PeerConnection::State::Connecting:   return "Connecting";
        case rtc::PeerConnection::State::Disconnected: return "Disconnected";
		case rtc::PeerConnection::State::Failed: return "Failed";
		case rtc::PeerConnection::State::Closed: return "Closed";
        default:      return "Disconnected";
    }
}

void init_peer_connection(WebPlayer* player, int next_player, string offer) {
  if(!player->peer_connections.count(next_player)) {
    rtc::Configuration config;
    config.iceServers.emplace_back("stun:stun.1.google.com:19302");
    player->peer_connections.emplace(next_player, std::make_shared<rtc::PeerConnection>(config));
  }

  std::shared_ptr<rtc::PeerConnection> pc = player->peer_connections.at(next_player);

  pc->onStateChange([next_player](rtc::PeerConnection::State state) {
    std::cout << "[PeerConnection State: " << toString(state) << "]" << std::endl;
    if (state == rtc::PeerConnection::State::Connected) {
      std::cout << "Connected to player " << next_player << std::endl;
    }
  });

  if(offer.empty()) {
    std::shared_ptr<rtc::DataChannel> dc = pc->createDataChannel("Channel:" + to_string(player->my_num()) + "-" + to_string(next_player));
    player->data_channels.emplace(next_player, dc);

    dc->onOpen([player, dc]() {
      std::cout << "[DataChannel open: " << dc->label() << "]" << std::endl;
      player->connected_users++;
    });
    dc->onClosed([player, dc]() { 
      std::cout << "[DataChannel closed: " << dc->label() << "]" << std::endl; 
      player->connected_users--;
    });

    dc->onMessage([player, next_player](std::variant<rtc::binary, rtc::string> message) {
      if (std::holds_alternative<rtc::string>(message)) {
        const octetStream* msg = new octetStream(std::get<rtc::string>(message));
        // std::cout << "[Player " << player->my_num() << " received message: " << *msg << " from " << next_player << "]" << std::endl;
        player->add_message(next_player, msg);
      } else {
        std::vector<std::byte> binary_msg = std::get<rtc::binary>(message);
        //std::cout << "Binary message from " << next_player << " received, size=" << std::get<rtc::binary>(message).size();
        if(binary_msg.size() == 0) {
          // cerr << "Binary message is empty" << endl;
          const octetStream* msg = new octetStream();
          player->add_message(next_player, msg);
        } else {
          unsigned char* msg_ptr = reinterpret_cast<unsigned char*>(&binary_msg[0]);
          const octetStream* msg = new octetStream(binary_msg.size(), msg_ptr);
          player->add_message(next_player, msg);
        }
      }
    });
  } else 
  {
    pc->setRemoteDescription(rtc::Description(offer, rtc::Description::Type::Offer));

    pc->onDataChannel([player, next_player](std::shared_ptr<rtc::DataChannel> _dc) { //only the answerer has to create a new dc object
      std::cout << "[Got a DataChannel with label: " << _dc->label() << "]" << std::endl;
      player->data_channels.emplace(next_player, _dc);
      player->connected_users++;

      _dc->onClosed([_dc, player]() { 
        std::cout << "[DataChannel closed: " << _dc->label() << "]" << std::endl;
        player->connected_users--;
      });

      _dc->onMessage([player, next_player](std::variant<rtc::binary, rtc::string> message) {
        if (std::holds_alternative<rtc::string>(message)) {
          const octetStream* msg = new octetStream(std::get<rtc::string>(message));
          // std::cout << "[Player " << player->my_num() << " received message: " << *msg << " from " << next_player << "]" << std::endl;
          player->add_message(next_player, msg);
        } else {
          std::vector<std::byte> binary_msg = std::get<rtc::binary>(message);
          // std::cout << "Binary message from " << next_player << " received, size=" << binary_msg.size();
          if(binary_msg.size() == 0) {
            // cerr << "Binary message is empty" << endl;
            const octetStream* msg = new octetStream();
            player->add_message(next_player, msg);
          } else {
            unsigned char* msg_ptr = reinterpret_cast<unsigned char*>(&binary_msg[0]);
            const octetStream* msg = new octetStream(binary_msg.size(), msg_ptr);
            player->add_message(next_player, msg);
          }
          //cout << " content: " << *msg << endl;
        }
      });
	  });
  }

  pc->onLocalDescription([player, next_player, offer, pc](rtc::Description desc) {
    if(offer.empty()) {
      cerr << "Sending offer to player " << next_player << endl;
      send_websocket_message(player->websocket_conn, "offer", "P" + to_string(next_player), rtc::string(desc).c_str());
    } else {
      cerr << "Sending answer to player " << next_player << endl;
      send_websocket_message(player->websocket_conn, "answer", "P" + to_string(next_player), rtc::string(desc).c_str());
    }
  });

  pc->onLocalCandidate([player, next_player](rtc::Candidate candidate) {
    send_websocket_message(player->websocket_conn, "candidate", "P" + to_string(next_player), rtc::string(candidate).c_str());
  });
}

static EM_BOOL WebSocketOpen([[maybe_unused]]int eventType, const EmscriptenWebSocketOpenEvent *websocketEvent, void *userData) {
  // register on websocket server
  WebPlayer* player = (WebPlayer*)userData;
  string user_name = "P" + to_string(player->my_num());
  string number_players = to_string(player->num_players());
  send_websocket_message(websocketEvent->socket, "login", user_name, number_players);
  return EM_TRUE;
}

static EM_BOOL WebSocketMessage([[maybe_unused]]int eventType, const EmscriptenWebSocketMessageEvent *e, void *userData) {
  WebPlayer* player = (WebPlayer*)userData;
  string message = (char*)e->data;
  stringstream ss(message);
  json json_msg{json::parse(message)};

  if (json_msg["type"] == "login") {
    if(json_msg["success"] != true) {
      cout << "Login failed (error: " << json_msg["message"] << ")" << endl;
      throw std::runtime_error("Login failed");
    }
  } else if (json_msg["type"] == "start") {
    // start WebRTC connection establishment
    int player_no = player->my_num();
    int nplayers = player->num_players();
    for (int i=player_no+1; i<nplayers; i++) {
        init_peer_connection(player, i, "");
    }
  } else if (json_msg["type"] == "offer") {
    cerr << "Offer received from player " << json_msg.at("name") << endl;
    string player_no = json_msg.at("name").dump().substr(2, 1); // P1 -> 1
    init_peer_connection(player, stoi(player_no), json_msg.at("offer"));
  } else if (json_msg["type"] == "answer") {
    cerr << "Answer received from player " << json_msg.at("name") << endl;
    string player_no = json_msg.at("name").dump().substr(2, 1); // P1 -> 1
    std::shared_ptr<rtc::PeerConnection> pc = player->peer_connections.at(stoi(player_no));
    pc->setRemoteDescription(rtc::Description(json_msg.at("answer"), rtc::Description::Type::Answer));
  } else if (json_msg["type"] == "candidate") {
    cerr << "Candidate received from player " << json_msg.at("name") << endl;
    string player_str = json_msg.at("name").dump().substr(2, 1); // P1 -> 1
    int player_no = stoi(player_str);
    std::shared_ptr<rtc::PeerConnection> pc = player->peer_connections.at(player_no);
    if(pc->localDescription().has_value())
      pc->addRemoteCandidate(rtc::Candidate(json_msg.at("candidate"), player_str));
    else {
      cerr << "Local description not set yet" << endl;
    }
  } else {
    cout << "Unknown message type" << endl;
    exit(1);
  }
  return EM_TRUE;
}

EM_BOOL WebSocketClose(int eventType, const EmscriptenWebSocketCloseEvent *e, [[maybe_unused]]void *userData)
{
  cerr << "close(eventType=" << eventType << ", wasClean=" << e->wasClean << ", code=" << e->code << ", reason=" << e->reason << endl;
	return EM_TRUE;
}

EM_BOOL WebSocketError(int eventType, [[maybe_unused]]const EmscriptenWebSocketErrorEvent *e, [[maybe_unused]]void *userData)
{
  cerr << "error(eventType=" << eventType << ")" << endl;
  exit(1);
	return EM_TRUE;
}

bool callback_send_method(void* dc, unsigned char* data, int msg_size) {
  rtc::DataChannel* dc_ptr = (rtc::DataChannel*)dc;
  return dc_ptr->send(reinterpret_cast<byte*>(data), msg_size);
}