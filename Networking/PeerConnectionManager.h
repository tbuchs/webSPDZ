/**
 * Singleton class for establishing peer connections
 * with all other players, to allow WebRTC datachannels to be added
 * per WebPlayer instance.
 */

#include <iostream>
#include <map>

#include <emscripten/websocket.h>
#include "Player.h"

#include "datachannel-wasm/wasm/include/rtc/datachannel.hpp"
#include "datachannel-wasm/wasm/include/rtc/peerconnection.hpp"
#include "datachannel-wasm/wasm/include/rtc/configuration.hpp"

using namespace std;

class PeerConnectionManager {
public:
  PeerConnectionManager() = default;
  PeerConnectionManager(const Names& Nms); 
  virtual ~PeerConnectionManager();
  
  // delete copy constructor
  PeerConnectionManager(const PeerConnectionManager&) = delete;

  static PeerConnectionManager singleton;

  map<int, std::shared_ptr<rtc::PeerConnection>> peer_connections;

private:
  // helper methods for establishing WebRTC connection
  static void send_websocket_message(int websocket, string type, int player, string msg);
  static void init_peer_connection(PeerConnectionManager* player, int next_player, string offer);
  static EM_BOOL WebSocketOpen([[maybe_unused]]int eventType, const EmscriptenWebSocketOpenEvent *websocketEvent, void *userData);
  static EM_BOOL WebSocketMessage([[maybe_unused]]int eventType, const EmscriptenWebSocketMessageEvent *e, void *userData);
  static EM_BOOL WebSocketClose(int eventType, const EmscriptenWebSocketCloseEvent *e, [[maybe_unused]]void *userData);
  static EM_BOOL WebSocketError(int eventType, [[maybe_unused]]const EmscriptenWebSocketErrorEvent *e, [[maybe_unused]]void *userData);

  map<int, std::vector<rtc::Candidate>> webrtc_candidates;
  EMSCRIPTEN_WEBSOCKET_T websocket_conn;
  int connected_users;
  int num_players;
};