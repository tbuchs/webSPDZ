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

#include "Player.h"
#include "PeerConnectionManager.h"

void callback_send_method(void* dc, unsigned char* data, int msg_size) {
  rtc::DataChannel* dc_ptr = (rtc::DataChannel*)dc;
  if(!dc_ptr->send(reinterpret_cast<byte*>(data), msg_size)) {
    cerr << "Failed to send message" << endl;
    exit(1);
  }
}

PeerConnectionManager PeerConnectionManager::singleton;

PeerConnectionManager::~PeerConnectionManager() {}

PeerConnectionManager::PeerConnectionManager(const Names& Nms) :
    connected_users(0)
{
  num_players = Nms.num_players();
  // Establish WebSocket Connection to other Players
  if (!emscripten_websocket_is_supported())
	{
		cerr << "WebSockets are not supported, cannot continue!" << endl;
		exit(1);
	}

  EmscriptenWebSocketCreateAttributes attr;
	emscripten_websocket_init_create_attributes(&attr);
	attr.url = "ws://localhost:8080";
  attr.createOnMainThread = false;
	websocket_conn = emscripten_websocket_new(&attr);
	if (websocket_conn <= 0)
	{
    cerr << "WebSocket creation failed, error code " << (EMSCRIPTEN_RESULT)websocket_conn << "!" << endl;
		exit(1);
	}

	emscripten_websocket_set_onopen_callback(websocket_conn, this, WebSocketOpen);
	emscripten_websocket_set_onmessage_callback(websocket_conn, this, WebSocketMessage);
  emscripten_websocket_set_onclose_callback(websocket_conn, nullptr, WebSocketClose);
	emscripten_websocket_set_onerror_callback(websocket_conn, nullptr, WebSocketError);

  // self connection
  // message_queue.insert({get_map_key(my_num()), std::deque<const octetStream*>{}});
  connected_users++;

  // wait for all other players to connect
  int sleep_interval = 10;
  int time_slept = 0;
  while (connected_users < num_players and time_slept < 60*1000)
  {
    // cout << "connected users(" << connected_users << "/" << nplayers << ")" << endl;
    emscripten_sleep(sleep_interval);
    time_slept += sleep_interval;
  }
  if(connected_users < num_players) {
    cerr << "Timeout - only " << connected_users << " clients!" << endl;
    throw runtime_error("Not all clients connected after a minute");
  }
  // cout << "All clients connected!" << endl;
  emscripten_websocket_close(websocket_conn, 0, "Finshed WebRTC-Connection establishment.");
  emscripten_websocket_delete(websocket_conn);
}

void PeerConnectionManager::send_websocket_message(int websocket, string type, int player, string msg) {
  json message = {{"type", type}, {"name", player}, {"content", msg}};
  int result = emscripten_websocket_send_utf8_text(websocket, message.dump().c_str());
  if (result < 0) {
    cerr << "WebSocket send failed with error code " << result << endl;
    error("WebSocket send failed");
    exit(1);
  }
}

void PeerConnectionManager::init_peer_connection(PeerConnectionManager* player, int next_player, string offer) {
  std::shared_ptr<rtc::PeerConnection> pc;
  if(player->peer_connections.find(next_player) == player->peer_connections.end()) {
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

    std::shared_ptr<rtc::DataChannel> dc = pc->createDataChannel("Channel: " + to_string(player->my_num()) + "-" + to_string(next_player), dc_init);
    player->data_channels.emplace(next_player_key, dc);

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
    if(player->webrtc_candidates.find(next_player) != player->webrtc_candidates.end()) {
      for(rtc::Candidate candidate : player->webrtc_candidates.at(next_player)) {
        pc->addRemoteCandidate(candidate); 
      }
    }
    pc->onDataChannel([player, next_player](std::shared_ptr<rtc::DataChannel> _dc) { //only the answerer has to create a new dc object
      std::cout << "[Got a DataChannel with label: " << _dc->label() << "]" << std::endl;
      player->data_channels.emplace(next_player_key, _dc);
      std::shared_ptr<rtc::DataChannel> dc = _dc;
      player->connected_users++;

      dc->onClosed([dc, player]() { 
        std::cout << "[DataChannel closed: " << dc->label() << "]" << std::endl;
        player->connected_users--;
      });

      dc->onMessage([player, next_player](std::variant<rtc::binary, rtc::string> message) {
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

  pc->onGatheringStateChange([player, pc, next_player](rtc::PeerConnection::GatheringState state) {
    if (state == rtc::PeerConnection::GatheringState::Complete) { // only send offer/answer if gathering of candidates is complete
      std::optional<rtc::Description> desc = pc->localDescription();
      if(desc.has_value()) {
        send_websocket_message(player->websocket_conn, desc.value().typeString(), next_player, rtc::string(desc.value()).c_str());
        }
      }
  });
}

EM_BOOL PeerConnectionManager::WebSocketOpen([[maybe_unused]]int eventType, const EmscriptenWebSocketOpenEvent *websocketEvent, void *userData) {
  // register on websocket server
  PeerConnectionManager* player = (PeerConnectionManager*)userData;
  string user_name = player->get_map_key(player->my_num());
  string number_players = to_string(player->num_players());
  send_websocket_message(websocketEvent->socket, "login", user_name, number_players);
  return EM_TRUE;
}

EM_BOOL PeerConnectionManager::WebSocketMessage([[maybe_unused]]int eventType, const EmscriptenWebSocketMessageEvent *e, void *userData) {
  PeerConnectionManager* player = (PeerConnectionManager*)userData;
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
    for (int i=player_no+1; i<player->num_players; i++) {
      init_peer_connection(player, i, "");
    }
  } else if (json_msg["type"] == "offer") {
    std::string name = json_msg.at("name");
    init_peer_connection(player, stoi(name), json_msg.at("offer"));
  } else if (json_msg["type"] == "answer") {
    std::string name = json_msg.at("name");
    player->peer_connections.at(stoi(name))->setRemoteDescription(rtc::Description(json_msg.at("answer"), rtc::Description::Type::Answer));
  } else if (json_msg["type"] == "candidate") {
    string name = json_msg.at("name");
    int player_no = stoi(name);
    std::shared_ptr<rtc::PeerConnection> pc;
    if(player->peer_connections.find(player_no) == player->peer_connections.end()) {
      rtc::Configuration config;
      config.iceServers.emplace_back("stun:stun.1.google.com:19302");
      pc = std::make_shared<rtc::PeerConnection>(config);
      player->peer_connections.emplace(name, pc);
    } else
      pc = player->peer_connections.at(player_no);

    if(player->webrtc_candidates.find(player_no) == player->webrtc_candidates.end())
      player->webrtc_candidates.emplace(player_no, vector<rtc::Candidate>());

    player->webrtc_candidates.at(player_no).push_back(rtc::Candidate(json_msg.at("candidate"), "0")); // TODO use real mid?
  } else {
    cout << "Unknown message type" << endl;
    exit(1);
  }
  return EM_TRUE;
}

EM_BOOL PeerConnectionManager::WebSocketClose(int eventType, const EmscriptenWebSocketCloseEvent *e, [[maybe_unused]]void *userData)
{
  cerr << "close(eventType=" << eventType << ", wasClean=" << e->wasClean << ", code=" << e->code << ", reason=" << e->reason << endl;
	return EM_TRUE;
}

EM_BOOL PeerConnectionManager::WebSocketError(int eventType, [[maybe_unused]]const EmscriptenWebSocketErrorEvent *e, [[maybe_unused]]void *userData)
{
  cerr << "error(eventType=" << eventType << ")" << endl;
  exit(1);
	return EM_TRUE;
}