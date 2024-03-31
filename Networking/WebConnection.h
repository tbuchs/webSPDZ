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

void init_peer_connection(WebPlayer* player, string next_player_key, string offer) {
  std::shared_ptr<rtc::PeerConnection> pc;
  if(player->peer_connections.find(next_player_key) == player->peer_connections.end()) {
    rtc::Configuration config;
    config.iceServers.emplace_back("stun:stun.1.google.com:19302");
    pc = std::make_shared<rtc::PeerConnection>(config);
    player->peer_connections.emplace(next_player_key, pc);
  } else
    pc = player->peer_connections.at(next_player_key);


  if(offer.empty()) {
    rtc::Reliability reliability;
    reliability.type = rtc::Reliability::Type::Reliable;
    reliability.unordered = false;
    rtc::DataChannelInit dc_init;
    dc_init.reliability = reliability;

    std::shared_ptr<rtc::DataChannel> dc = pc->createDataChannel("Channel: " + to_string(player->my_num()) + "-" + next_player_key, dc_init);
    player->data_channels.emplace(next_player_key, dc);

    dc->onOpen([player, dc]() {
      std::cout << "[DataChannel open: " << dc->label() << "]" << std::endl;
      player->connected_users++;
    });
    dc->onClosed([player, dc]() { 
      std::cout << "[DataChannel closed: " << dc->label() << "]" << std::endl; 
      player->connected_users--;
    });

    dc->onMessage([player, next_player_key](std::variant<rtc::binary, rtc::string> message) {
      if (std::holds_alternative<rtc::string>(message)) {
        const octetStream* msg = new octetStream(std::get<rtc::string>(message));
        // std::cout << "[Player " << player->my_num() << " received message: " << *msg << " from " << next_player << "]" << std::endl;
        player->add_message(next_player_key, msg);
      } else {
        std::vector<std::byte> binary_msg = std::get<rtc::binary>(message);
        //std::cout << "Binary message from " << next_player << " received, size=" << std::get<rtc::binary>(message).size();
        if(binary_msg.size() == 0) {
          // cerr << "Binary message is empty" << endl;
          const octetStream* msg = new octetStream();
          player->add_message(next_player_key, msg);
        } else {
          unsigned char* msg_ptr = reinterpret_cast<unsigned char*>(&binary_msg[0]);
          const octetStream* msg = new octetStream(binary_msg.size(), msg_ptr);
          player->add_message(next_player_key, msg);
        }
      }
    });
  } else {
    pc->setRemoteDescription(rtc::Description(offer, rtc::Description::Type::Offer));
    if(player->webrtc_candidates.find(next_player_key) != player->webrtc_candidates.end()) {
      for(rtc::Candidate candidate : player->webrtc_candidates.at(next_player_key)) {
        pc->addRemoteCandidate(candidate); 
      }
    }
    pc->onDataChannel([player, next_player_key](std::shared_ptr<rtc::DataChannel> _dc) { //only the answerer has to create a new dc object
      std::cout << "[Got a DataChannel with label: " << _dc->label() << "]" << std::endl;
      player->data_channels.emplace(next_player_key, _dc);
      std::shared_ptr<rtc::DataChannel> dc = _dc;
      player->connected_users++;

      dc->onClosed([dc, player]() { 
        std::cout << "[DataChannel closed: " << dc->label() << "]" << std::endl;
        player->connected_users--;
      });

      dc->onMessage([player, next_player_key](std::variant<rtc::binary, rtc::string> message) {
        if (std::holds_alternative<rtc::string>(message)) {
          const octetStream* msg = new octetStream(std::get<rtc::string>(message));
          // std::cout << "[Player " << player->my_num() << " received message: " << *msg << " from " << next_player << "]" << std::endl;
          player->add_message(next_player_key, msg);
        } else {
          std::vector<std::byte> binary_msg = std::get<rtc::binary>(message);
          // std::cout << "Binary message from " << next_player << " received, size=" << binary_msg.size();
          if(binary_msg.size() == 0) {
            // cerr << "Binary message is empty" << endl;
            const octetStream* msg = new octetStream();
            player->add_message(next_player_key, msg);
          } else {
            unsigned char* msg_ptr = reinterpret_cast<unsigned char*>(&binary_msg[0]);
            const octetStream* msg = new octetStream(binary_msg.size(), msg_ptr);
            player->add_message(next_player_key, msg);
          }
          //cout << " content: " << *msg << endl;
        }
      });
	  });
  }

  pc->onGatheringStateChange([player, pc, next_player_key](rtc::PeerConnection::GatheringState state) {
    if (state == rtc::PeerConnection::GatheringState::Complete) { // only send offer/answer if gathering of candidates is complete
      std::optional<rtc::Description> desc = pc->localDescription();
      if(desc.has_value()) {
        send_websocket_message(player->websocket_conn, desc.value().typeString(), next_player_key, rtc::string(desc.value()).c_str());
        }
      }
  });
}

static EM_BOOL WebSocketOpen([[maybe_unused]]int eventType, const EmscriptenWebSocketOpenEvent *websocketEvent, void *userData) {
  // register on websocket server
  WebPlayer* player = (WebPlayer*)userData;
  string user_name = player->get_map_key(player->my_num());
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
      error("Login failed");
    }
  } else if (json_msg["type"] == "start") {
    // start WebRTC connection establishment
    int player_no = player->my_num();
    int nplayers = player->num_players();
    for (int i=player_no+1; i<nplayers; i++) {
      string i_key = player->get_map_key(i);
      init_peer_connection(player, i_key, "");
    }
  } else if (json_msg["type"] == "offer") {
    std::string name = json_msg.at("name");
    init_peer_connection(player, name, json_msg.at("offer"));
  } else if (json_msg["type"] == "answer") {
    std::string name = json_msg.at("name");
    player->peer_connections.at(name)->setRemoteDescription(rtc::Description(json_msg.at("answer"), rtc::Description::Type::Answer));
  } else if (json_msg["type"] == "candidate") {
    string name = json_msg.at("name");
    std::shared_ptr<rtc::PeerConnection> pc;
    if(player->peer_connections.find(name) == player->peer_connections.end()) {
      rtc::Configuration config;
      config.iceServers.emplace_back("stun:stun.1.google.com:19302");
      pc = std::make_shared<rtc::PeerConnection>(config);
      player->peer_connections.emplace(name, pc);
    } else
      pc = player->peer_connections.at(name);

    if(player->webrtc_candidates.find(name) == player->webrtc_candidates.end())
      player->webrtc_candidates.emplace(name, vector<rtc::Candidate>());

    player->webrtc_candidates.at(name).push_back(rtc::Candidate(json_msg.at("candidate"), "0")); // TODO use real mid?
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

void callback_send_method(void* dc, unsigned char* data, int msg_size) {
  rtc::DataChannel* dc_ptr = (rtc::DataChannel*)dc;
  if(!dc_ptr->send(reinterpret_cast<byte*>(data), msg_size)) {
    cerr << "Failed to send message" << endl;
    exit(1);
  }
}