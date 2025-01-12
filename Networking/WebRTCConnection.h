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
#include "deps/datachannel-wasm/wasm/include/rtc/datachannel.hpp"
#include "deps/datachannel-wasm/wasm/include/rtc/peerconnection.hpp"
#include "deps/datachannel-wasm/wasm/include/rtc/configuration.hpp"

std::string START_SEQUENCE = "BEGIN";
size_t RTC_MAX_MESSAGE_SIZE = 256000;

void send_websocket_message(int websocket, string type, string player_group, int player_id, string msg) {
  json message = {{"type", type}, {"group", player_group}, {"name", player_id}, {"content", msg}};
  unsigned short ready;
  emscripten_websocket_get_ready_state(websocket, &ready);
  int result = emscripten_websocket_send_utf8_text(websocket, message.dump().c_str());
  if (result < 0) {
    cerr << "WebSocket send failed with error code " << result << endl;
    error("WebSocket send failed");
    exit(1);
  }
}

void send_websocket_message(int websocket, string type, string player_group, int player_id, string mId, string msg) {
  json message = {{"type", type}, {"group", player_group}, {"name", player_id}, {"mId", mId}, {"content", msg}};
  unsigned short ready;
  emscripten_websocket_get_ready_state(websocket, &ready);
  int result = emscripten_websocket_send_utf8_text(websocket, message.dump().c_str());
  if (result < 0) {
    cerr << "WebSocket send failed with error code " << result << endl;
    error("WebSocket send failed");
    exit(1);
  }
}

void init_peer_connection(WebPlayer* player, int next_player_id, string offer) {
  std::shared_ptr<rtc::PeerConnection> pc;
  string next_player_key = player->get_map_key(next_player_id);
  if(player->peer_connections.find(next_player_key) == player->peer_connections.end()) {
    rtc::Configuration config;
    config.iceServers.emplace_back("stun:stun.1.google.com:19302");
    pc = std::make_shared<rtc::PeerConnection>(config);
    player->peer_connections.emplace(next_player_key, pc);
  } else
    pc = player->peer_connections.at(next_player_key);


  if(offer.empty()) {
    rtc::Reliability reliability;
    // reliability.type = rtc::Reliability::Type::Reliable;
    reliability.unordered = false;
    rtc::DataChannelInit dc_init;
    dc_init.reliability = reliability;

    std::shared_ptr<rtc::DataChannel> dc = pc->createDataChannel("Channel: " + player->get_id() + " " + to_string(player->my_num()) + "-" + to_string(next_player_id), dc_init);
    player->data_channels.emplace(next_player_key, dc);

    dc->onOpen([player, dc]() {
      std::cerr << "[DataChannel open: " << dc->label() << "]" << std::endl;
      player->connected_users++;
      if(player->connected_users == player->num_players())
        player->signal_start();
    });

    dc->onClosed([player, dc]() { 
      std::cerr << "[DataChannel closed: " << dc->label() << "]" << std::endl; 
      player->connected_users--;
    });

    dc->onError([](std::string error) {
      std::cerr << "[DataChannel error: " << error << "]" << std::endl;
    });

    dc->onMessage([player, next_player_id](std::variant<rtc::binary, rtc::string> message) {
      if (std::holds_alternative<rtc::string>(message)) {
        string msg = std::get<rtc::string>(message);
        // check if message is start sequence for chunked message
        if(msg.substr(0, START_SEQUENCE.size()) == START_SEQUENCE) {
          string num_chunks = msg.substr(START_SEQUENCE.size());
          int num_chunks_int = stoi(num_chunks);
          player->add_message(next_player_id, nullptr, num_chunks_int);
        } else {
          error("Received string message in binary message handler");
        }
      } else {
        std::vector<std::byte> binary_msg = std::get<rtc::binary>(message);
        unsigned char* msg_ptr = reinterpret_cast<unsigned char*>(&binary_msg[0]);
        player->add_message(next_player_id, msg_ptr, binary_msg.size());
      }
    });
  } else {
    pc->setRemoteDescription(rtc::Description(offer, rtc::Description::Type::Offer));
    if(player->webrtc_candidates.find(next_player_key) != player->webrtc_candidates.end()) {
      for(rtc::Candidate candidate : player->webrtc_candidates.at(next_player_key)) {
        pc->addRemoteCandidate(candidate); 
      }
    }

    pc->onDataChannel([player, next_player_key, next_player_id](std::shared_ptr<rtc::DataChannel> _dc) {
      std::cerr << "[Got a DataChannel with label: " << _dc->label() << "]" << std::endl;
      player->data_channels.emplace(next_player_key, _dc);
      std::shared_ptr<rtc::DataChannel> dc = _dc;
      player->connected_users++;

      if(player->connected_users == player->num_players())
        player->signal_start();

      dc->onError([](std::string error) {
        std::cerr << "[DataChannel error: " << error << "]" << std::endl;
      });

      dc->onClosed([dc, player]() { 
        std::cerr << "[DataChannel closed: " << dc->label() << "]" << std::endl;
        player->connected_users--;
      });

      dc->onMessage([player, next_player_id](std::variant<rtc::binary, rtc::string> message) {
        if (std::holds_alternative<rtc::string>(message)) {
          string msg = std::get<rtc::string>(message);
          // check if message is start sequence for chunked message
          if(msg.substr(0, START_SEQUENCE.size()) == START_SEQUENCE) {
            string num_chunks = msg.substr(START_SEQUENCE.size());
            int num_chunks_int = stoi(num_chunks);
            player->add_message(next_player_id, nullptr, num_chunks_int);
          } else
            error("Received string message in binary message handler");
        } else {
          std::vector<std::byte> binary_msg = std::get<rtc::binary>(message);
          unsigned char* msg_ptr = reinterpret_cast<unsigned char*>(&binary_msg[0]);
          player->add_message(next_player_id, msg_ptr, binary_msg.size());
        }
      });
    });
  }

  pc->onGatheringStateChange([player, pc, next_player_id](rtc::PeerConnection::GatheringState state) {
    if (state == rtc::PeerConnection::GatheringState::Complete)
    {
      std::optional<rtc::Description> desc = pc->localDescription();
      if(desc.has_value())
        send_websocket_message(player->websocket_conn, desc.value().typeString(), player->get_id(), next_player_id, rtc::string(desc.value()).c_str());
    }
  });
}

static EM_BOOL WebSocketOpen([[maybe_unused]]int eventType, const EmscriptenWebSocketOpenEvent *websocketEvent, void *userData) {
  // register on websocket server
  WebPlayer* player = (WebPlayer*)userData;
  int user_id = player->my_num();
  string user_group = player->get_id();
  string number_players = to_string(player->num_players());
  send_websocket_message(websocketEvent->socket, "login", user_group, user_id, number_players);
  return EM_TRUE;
}

static EM_BOOL WebSocketMessage([[maybe_unused]]int eventType, const EmscriptenWebSocketMessageEvent *e, void *userData) {
  WebPlayer* player = (WebPlayer*)userData;
  string message((char*)e->data);
  json json_msg = json::parse(message);

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
      init_peer_connection(player, i, "");
    }
  } else if (json_msg["type"] == "offer") {
    std::string name = json_msg.at("name");
    init_peer_connection(player, stoi(name), json_msg.at("offer"));
  } else if (json_msg["type"] == "answer") {
    std::string name = json_msg.at("name");
    player->peer_connections.at(name)->setRemoteDescription(rtc::Description(json_msg.at("answer"), rtc::Description::Type::Answer));
  } else if (json_msg["type"] == "candidate") {
    string name = json_msg.at("name");
    string mId = json_msg.at("mId");
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

    player->webrtc_candidates.at(name).push_back(rtc::Candidate(json_msg.at("candidate"), mId));
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

struct args_webrtc_send {
  void* dc_;
  unsigned char* data_;
  int msg_size_;
};

void callback_send_method(void* ptr_args) {
  struct args_webrtc_send* a = (args_webrtc_send*)ptr_args;
  rtc::DataChannel* dc_ptr = (rtc::DataChannel*)a->dc_;
  // max msg size 16kb
  int max_msg_size = RTC_MAX_MESSAGE_SIZE;
  if(a->msg_size_ > max_msg_size) {
    int num_chunks = (a->msg_size_ + max_msg_size - 1) / max_msg_size;
    string num_chunks_str = to_string(num_chunks);
    // sending start message and number of chunks # BEGIN<num_chunks>
    dc_ptr->send(START_SEQUENCE + num_chunks_str);

    int bytes_sent = 0;
    for(int i=0; i<num_chunks; i++) {
      int size = (i != num_chunks-1) ? max_msg_size : a->msg_size_ - bytes_sent;
      if(!dc_ptr->send(reinterpret_cast<byte*>(a->data_ + i*max_msg_size), size)) {
        cerr << "Failed to send message" << endl;
        exit(1);
      }
      bytes_sent += size;
    }
  }
  else 
  { 
    if(!dc_ptr->send(reinterpret_cast<byte*>(a->data_), a->msg_size_)) {
      cerr << "Failed to send message" << endl;
      exit(1);
    }
  }
}