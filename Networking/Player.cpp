#include "Player.h"
#include "ssl_sockets.h"
#include "Tools/Exceptions.h"
#include "Tools/int.h"
#include "Tools/NetworkOptions.h"
#include "Networking/Server.h"
#include "Networking/ServerSocket.h"
#include "Networking/Exchanger.h"

#include <sys/select.h>
#include <utility>
#include <assert.h>

#ifdef __EMSCRIPTEN__
#include <emscripten/websocket.h>
#include <emscripten/threading.h>
#include <emscripten/proxying.h>
#include "WebRTCConnection.h"
#include "WebSocketConnection.h"
#endif

using namespace std;

#ifdef __EMSCRIPTEN__
// WebPlayer, no socket communication
void Names::init(int player, int num_players, vector<string> *signaling_server_config)
{
  player_no = player;
  nplayers = num_players;
  signaling_server_url = signaling_server_config->at(0) + ":" + signaling_server_config->at(1); // ip:port
}
#endif

void Names::init(int player, int pnb, int my_port, const char *servername,
                 bool setup_socket)
{
  player_no = player;
  portnum_base = pnb;
  setup_names(servername, my_port);
  if (setup_socket)
    setup_server();
}

Names::Names(int player, int nplayers, const string &servername, int pnb,
             int my_port) : Names()
{
  Server::start_networking(*this, player, nplayers, servername, pnb, my_port);
}

void Names::init(int player, int pnb, vector<string> Nms)
{
  player_no = player;
  portnum_base = pnb;
  nplayers = Nms.size();
  names = Nms;
  setup_ports();
  setup_server();
}

// initialize names from file, no Server.x coordination.
void Names::init(int player, int pnb, const string &filename, int nplayers_wanted)
{
  ifstream hostsfile(filename.c_str());
  if (hostsfile.fail())
  {
    stringstream ss;
    ss << "Error opening " << filename << ". See HOSTS.example for an example.";
    throw file_error(ss.str().c_str());
  }
  player_no = player;
  nplayers = 0;
  portnum_base = pnb;
  string line;
  ports.clear();
  while (getline(hostsfile, line))
  {
    if (line.length() > 0 && line.at(0) != '#')
    {
      auto pos = line.find(':');
      if (pos == string::npos)
      {
        names.push_back(line);
        ports.push_back(default_port(nplayers));
      }
      else
      {
        names.push_back(line.substr(0, pos));
        int port;
        stringstream(line.substr(pos + 1)) >> port;
        ports.push_back(port);
      }
      nplayers++;
      if (nplayers_wanted > 0 and nplayers_wanted == nplayers)
        break;
    }
  }
  if (nplayers_wanted > 0 and nplayers_wanted != nplayers)
    throw runtime_error("not enough hosts in " + filename);
#ifdef DEBUG_NETWORKING
  cerr << "Got list of " << nplayers << " players from file: " << endl;
  for (unsigned int i = 0; i < names.size(); i++)
    cerr << "    " << names[i] << ":" << ports[i] << endl;
#endif
  setup_server();
}

Names::Names(ez::ezOptionParser &opt, int argc, const char **argv,
             int default_nplayers) : Names()
{
  NetworkOptionsWithNumber network_opts(opt, argc, argv, default_nplayers, true);
  opt.add(
      "",                                // Default.
      1,                                 // Required?
      1,                                 // Number of args expected.
      0,                                 // Delimiter if expecting multiple args.
      "This player's number (required)", // Help description.
      "-p",                              // Flag token.
      "--player"                         // Flag token.
  );
  opt.parse(argc, argv);
  opt.get("-p")->getInt(player_no);
  vector<string> missing;
  if (not opt.gotRequired(missing))
  {
    string usage;
    opt.getUsage(usage);
    cerr << usage;
    exit(1);
  }
  network_opts.start_networking(*this, player_no);
}

void Names::setup_ports()
{
  ports.resize(nplayers);
  for (int i = 0; i < nplayers; i++)
    ports[i] = default_port(i);
}

void Names::setup_names(const char *servername, int my_port)
{
  if (my_port == DEFAULT_PORT)
    my_port = default_port(player_no);

  int socket_num;
  int pn = portnum_base;
  set_up_client_socket(socket_num, servername, pn);
  octetStream("P" + to_string(player_no)).Send(socket_num);
#ifdef DEBUG_NETWORKING
  cerr << "Sent " << player_no << " to " << servername << ":" << pn << endl;
#endif

  // Send my name
  sockaddr_in address;
  socklen_t size = sizeof address;
  getsockname(socket_num, (sockaddr *)&address, &size);
  char *my_name = inet_ntoa(address.sin_addr);
  octetStream(my_name).Send(socket_num);
  send(socket_num, (octet *)&my_port, 4);
#ifdef DEBUG_NETWORKING
  fprintf(stderr, "My Name = %s\n", my_name);
  cerr << "My number = " << player_no << endl;
#endif

  // Now get the set of names
  try
  {
    octetStream os;
    os.Receive(socket_num);
    os.get(names);
    os.get(ports);
  }
  catch (exception &e)
  {
    throw runtime_error(string("error in network setup: ") + e.what());
  }

  if (names.size() != ports.size())
    throw runtime_error("invalid network setup");
  nplayers = names.size();
#ifdef VERBOSE
  for (int i = 0; i < nplayers; i++)
    cerr << "Player " << i << " is running on machine " << names[i] << endl;
#endif
  close_client_socket(socket_num);
}

void Names::setup_server()
{
  server = new ServerSocket(ports.at(player_no));
  server->init();
}

void Names::set_server(ServerSocket *socket)
{
  assert(not server);
  server = socket;
}

Names::Names(const Names &other)
{
  if (other.server != 0)
    throw runtime_error("Can copy Names only when uninitialized");
  player_no = other.player_no;
  nplayers = other.nplayers;
  portnum_base = other.portnum_base;
  names = other.names;
  ports = other.ports;
  server = 0;
}

Names::Names(int my_num, int num_players) : nplayers(num_players), portnum_base(-1), player_no(my_num), server(0)
{
}

Names::~Names()
{
  if (server != 0)
    delete server;
}

Player::Player(const Names &Nms) : PlayerBase(Nms.my_num()), N(Nms)
{
  nplayers = Nms.nplayers;
  player_no = Nms.player_no;
  thread_stats.resize(nplayers);
}
#ifdef __EMSCRIPTEN__
WebSocketPlayer::~WebSocketPlayer()
{
  emscripten_websocket_close(websocket_conn, 1000, "Finished.");
  emscripten_websocket_delete(websocket_conn);
  pthread_mutex_destroy(&mutex);
  pthread_cond_destroy(&ready);
  for (int i = 0; i < nplayers; i++)
  {
    pthread_mutex_destroy(&message_locks.at(i));
    pthread_cond_destroy(&message_conds.at(i));
  }
}

void *WebSocketPlayer::create_communication_channel(void *arg)
{
  WebSocketPlayer *player = (WebSocketPlayer *)arg;
  player->websocket_thread_id = pthread_self();

  player->message_queue.resize(player->nplayers);

  // Establish WebSocket Connection to other Players
  if (!emscripten_websocket_is_supported())
  {
    cerr << "WebSockets are not supported, cannot continue!" << endl;
    exit(1);
  }

  EmscriptenWebSocketCreateAttributes attr;
  emscripten_websocket_init_create_attributes(&attr);
  string url = "wss://" + player->signaling_server;
  attr.url = url.c_str();
  // attr.createOnMainThread = true; // has no affect, since it is not implemented in emscripten
  player->websocket_conn = emscripten_websocket_new(&attr);
  if (player->websocket_conn <= 0)
  {
    cerr << "WebSocket creation failed, error code " << (EMSCRIPTEN_RESULT)player->websocket_conn << "!" << endl;
    exit(1);
  }
  emscripten_websocket_set_onopen_callback(player->websocket_conn, player, WebSocketOpen_WebSocketPlayer);
  emscripten_websocket_set_onmessage_callback(player->websocket_conn, player, WebSocketMessage_WebSocketPlayer);
  emscripten_websocket_set_onclose_callback(player->websocket_conn, nullptr, WebSocketClose_WebSocketPlayer);
  emscripten_websocket_set_onerror_callback(player->websocket_conn, nullptr, WebSocketError_WebSocketPlayer);

  emscripten_exit_with_live_runtime(); // don't let the thread exit, needed for websocket callbacks
  return 0;
}

WebSocketPlayer::WebSocketPlayer(const Names &Nms, const string &id) : Player(Nms), connected(false), id(id), signaling_server(Nms.signaling_server_url)
{
  pthread_mutex_init(&mutex, 0);
  pthread_cond_init(&ready, 0);

  for (int i = 0; i < nplayers; i++)
  {
    message_locks.push_back(pthread_mutex_t());
    pthread_mutex_init(&message_locks.at(i), 0);
    message_conds.push_back(pthread_cond_t());
    pthread_cond_init(&message_conds.at(i), 0);
  }

#ifdef SINGLE_THREADED_WEBSOCKET
  if(!emscripten_has_asyncify())
    error("Asyncify is required for single-threaded WebSockets! Link with -sASYNCIFY=1");
  create_communication_channel(this);
  while (!connected)
    emscripten_sleep(1);
#else
  pthread_t thread;
  pthread_create(&thread, 0, create_communication_channel, this);
  pthread_cond_wait(&ready, &mutex);
#endif
}

void WebSocketPlayer::send_message(int receiver, const octetStream *msg)
{
  octetStream *msg_copy = const_cast<octetStream *>(msg);
  msg_copy->store_int(receiver, 1);
  msg_copy->store_int(get_group_id(), 1);

  if (pthread_self() != websocket_thread_id)
  {
    void (*func_ptr)(void *) = callback_send_websocketplayer;
    em_proxying_queue *q = em_proxying_queue_create();
    args_websocket_send *data_args = new args_websocket_send();
    data_args->websocket_id = websocket_conn;
    data_args->data_ = (unsigned char *)msg->get_data();
    data_args->msg_size_ = msg->get_length();
    int ret_val = emscripten_proxy_sync(q, websocket_thread_id, func_ptr, data_args);
    if (ret_val == 0)
    {
      cerr << "Proxying send_binary failed" << endl;
      error("WebSocket proxying send_binary failed");
    }
    delete data_args;
    em_proxying_queue_destroy(q);
  }
  else
  {
    int result = emscripten_websocket_send_binary(websocket_conn, msg_copy->get_data(), msg_copy->get_length());
    if (result < 0)
    {
      cerr << "Sending message from " << id << " with socket " << websocket_conn << " failed" << endl;
      error("WebSocket send_binary failed");
      exit(1);
    }
  }

  // delete 2 byte modifications
  msg_copy->rewind_write_head(2);
}

void WebSocketPlayer::send_to_no_stats(int player, const octetStream &o)
{
  TimeScope ts(comm_stats["Sending WebSocketPlayer"].add(o));
  send_message(player, &o);
  comm_stats.sent += o.get_length();
}

void WebSocketPlayer::receive_player_no_stats(int player, octetStream &o)
{
  pthread_mutex_lock(&message_locks.at(player));

#ifdef SINGLE_THREADED_WEBSOCKET
  // wait for message
  while (message_queue.at(player).size() == 0)
    emscripten_thread_sleep(1);
#else
  if (message_queue.at(player).size() == 0)
    pthread_cond_wait(&message_conds.at(player), &message_locks.at(player));
#endif
  o = message_queue.at(player).front();
  message_queue.at(player).pop_front();
  pthread_mutex_unlock(&message_locks.at(player));
}

void WebSocketPlayer::send_receive_all_no_stats(const vector<vector<bool>> &channels,
  const vector<octetStream> &to_send, vector<octetStream> &to_receive)
{
  to_receive.resize(nplayers);
  for (int offset = 1; offset < nplayers; offset++)
  {
    int receive_from = get_player(-offset);
    int send_to = get_player(offset);
    bool receive = channels[receive_from][my_num()];
    if (channels[my_num()][send_to])
    {
      if (receive)
        pass_around_no_stats(to_send[send_to], to_receive[receive_from], offset);
      else
        send_to_no_stats(send_to, to_send[send_to]);
    }
    else if (receive)
      receive_player_no_stats(receive_from, to_receive[receive_from]);
  }
}

void WebSocketPlayer::pass_around_no_stats(const octetStream &to_send, octetStream &to_receive, int offset)
{
  int send_to = get_player(offset);
  int recv_from = get_player(-offset);
  send_to_no_stats(send_to, to_send);
  receive_player_no_stats(recv_from, to_receive);
}

void WebSocketPlayer::Broadcast_Receive_no_stats(vector<octetStream> &o)
{
  for (int i = 1; i < nplayers; i++)
  {
    int send_to = (player_no + i) % nplayers;
    send_to_no_stats(send_to, o[player_no]);
  }

  for (int i = 1; i < nplayers; i++)
  {
    int receive_from = (player_no + nplayers - i) % nplayers;
    receive_player_no_stats(receive_from, o[receive_from]);
  }
}

void WebSocketPlayer::exchange_no_stats(int other, const octetStream &o, octetStream &to_receive)
{
  send_message(other, &o);
  receive_player_no_stats(other, to_receive);
}

size_t WebSocketPlayer::send_no_stats(int player, const PlayerBuffer &buffer, bool block)
{
  (void)block;
  const octetStream msg = octetStream(buffer.size, buffer.data);
  send_message(player, &msg);
  return buffer.size;
}

size_t WebSocketPlayer::recv_no_stats(int player, const PlayerBuffer &buffer, bool block)
{
  (void)block;
  octetStream msg = octetStream(buffer.size);
  receive_player_no_stats(player, msg);
  return buffer.size;
}

// ------------------ WebPlayer ------------------
// WebRTC Communication
// -----------------------------------------------

WebPlayer::~WebPlayer()
{
  for (int i = 0; i < nplayers; i++)
  {
    pthread_mutex_destroy(&message_locks.at(i));
    pthread_cond_destroy(&message_conds.at(i));
  }
  pthread_mutex_destroy(&start_mutex);
  pthread_cond_destroy(&start_cond);
}

WebPlayer::WebPlayer(const Names &Nms, const string &id) : Player(Nms), connected_users(0), id(id)
{
  for (int i = 0; i < nplayers; i++)
  {
    message_locks.push_back(pthread_mutex_t());
    pthread_mutex_init(&message_locks.at(i), 0);
    message_conds.push_back(pthread_cond_t());
    pthread_cond_init(&message_conds.at(i), 0);
  }
  pthread_mutex_init(&start_mutex, 0);
  pthread_cond_init(&start_cond, 0);

  // Establish WebSocket Connection to other Players
  if (!emscripten_websocket_is_supported())
  {
    cerr << "WebSockets are not supported, cannot continue!" << endl;
    exit(1);
  }

  EmscriptenWebSocketCreateAttributes attr;
  emscripten_websocket_init_create_attributes(&attr);
  string url = "wss://" + Nms.signaling_server_url;
  attr.url = url.c_str();
  attr.createOnMainThread = true;
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

  message_queue.resize(nplayers);
  connected_users++;

  // wait for all other players to connect
  if ((connected_users < nplayers))
  {
    pthread_mutex_lock(&start_mutex);
    pthread_cond_wait(&start_cond, &start_mutex);
    pthread_mutex_unlock(&start_mutex);
  }
  cerr << "All clients connected!" << endl;
  emscripten_websocket_close(websocket_conn, 1000, "Finished.");
  emscripten_websocket_delete(websocket_conn);
}

void WebPlayer::send_message(int receiver, const octetStream *msg)
{
  string receiver_key = get_map_key(receiver);
  if (data_channels.find(receiver_key) != data_channels.end())
  {
    std::shared_ptr<rtc::DataChannel> data_channel = data_channels.at(receiver_key);
    void (*func_ptr)(void *) = callback_send_method;
    em_proxying_queue *q = emscripten_proxy_get_system_queue();
    args_webrtc_send *data_args = new args_webrtc_send();
    data_args->dc_ = data_channel.get();
    data_args->data_ = (unsigned char *)msg->get_data();
    data_args->msg_size_ = msg->get_length();
    emscripten_proxy_sync(q, emscripten_main_runtime_thread_id(), func_ptr, data_args);
    delete data_args;
  }
  else
  {
    cerr << "DataChannel not found for sender: " << player_no << " - receiver " << receiver_key << endl;
    error("DataChannel not found");
  }
}

void WebPlayer::send_to_no_stats(int player, const octetStream &o)
{
  TimeScope ts(comm_stats["Sending WebPlayer"].add(o));
  send_message(player, &o);
  comm_stats.sent += o.get_length();
}

void WebPlayer::receive_player_no_stats(int sender, octetStream &o)
{
  pthread_mutex_lock(&message_locks.at(sender));
  if (message_queue.at(sender).size() == 0)
    pthread_cond_wait(&message_conds.at(sender), &message_locks.at(sender));
  
  o = message_queue.at(sender).front();
  message_queue.at(sender).pop_front();

  if (o.get_chunked())
  {
    size_t chunks = o.get_chunked();
    octetStream msg_chunks = octetStream(chunks * RTC_MAX_MESSAGE_SIZE);

    for (size_t i = 0; i < chunks; i++)
    {
      if (message_queue.at(sender).size() == 0)
        pthread_cond_wait(&message_conds.at(sender), &message_locks.at(sender));

      octetStream chunk = message_queue.at(sender).front();
      if (i != (chunks - 1))
      {
        if (chunk.get_length() != RTC_MAX_MESSAGE_SIZE)
        {
          cout << "Length of chunk number " << i << "/" << chunks << " is " << chunk.get_length() << endl;
          error("Invalid chunk size received");
        }
      }
      msg_chunks.concat(chunk);
      message_queue.at(sender).pop_front();
    }
    o = msg_chunks;
  }
  pthread_mutex_unlock(&message_locks.at(sender));
}

void WebPlayer::send_receive_all_no_stats(const vector<vector<bool>> &channels,
                                          const vector<octetStream> &to_send, vector<octetStream> &to_receive)
{
  to_receive.resize(nplayers);
  for (int offset = 1; offset < nplayers; offset++)
  {
    int receive_from = get_player(-offset);
    int send_to = get_player(offset);
    bool receive = channels[receive_from][my_num()];
    if (channels[my_num()][send_to])
    {
      if (receive)
        pass_around_no_stats(to_send[send_to], to_receive[receive_from], offset);
      else
        send_to_no_stats(send_to, to_send[send_to]);
    }
    else if (receive)
      receive_player_no_stats(receive_from, to_receive[receive_from]);
  }
}

void WebPlayer::pass_around_no_stats(const octetStream &to_send,
                                     octetStream &to_receive, int offset)
{
  int send_to = get_player(offset);
  int recv_from = get_player(-offset);
  send_to_no_stats(send_to, to_send);
  receive_player_no_stats(recv_from, to_receive);
}

void WebPlayer::Broadcast_Receive_no_stats(vector<octetStream> &o)
{
  if (o.size() != (unsigned long)nplayers)
    throw runtime_error("player numbers don't match");
  for (int i = 1; i < nplayers; i++)
  {
    int send_to = (player_no + i) % nplayers;
    send_to_no_stats(send_to, o[player_no]);
  }

  for (int i = 1; i < nplayers; i++)
  {
    int receive_from = (player_no + nplayers - i) % nplayers;
    receive_player_no_stats(receive_from, o[receive_from]);
  }
}

void WebPlayer::exchange_no_stats(int other, const octetStream &o, octetStream &to_receive)
{
  send_message(other, &o);
  receive_player_no_stats(other, to_receive);
}

size_t WebPlayer::send_no_stats(int player, const PlayerBuffer &buffer, bool block)
{
  (void)block;
  const octetStream msg = octetStream(buffer.size, buffer.data);
  send_message(player, &msg);
  return buffer.size;
}

size_t WebPlayer::recv_no_stats(int player, const PlayerBuffer &buffer, bool block)
{
  (void)block;
  octetStream msg = octetStream(buffer.size);
  receive_player_no_stats(player, msg);
  return buffer.size;
}

#endif

template <class T>
MultiPlayer<T>::MultiPlayer(const Names &Nms, const string &id) : Player(Nms), id(id), send_to_self_socket(0)
{
  sockets.resize(Nms.num_players());
}

PlainPlayer::PlainPlayer(const Names &Nms, const string &id) : MultiPlayer<int>(Nms, id)
{
  if (Nms.num_players() > 1)
    setup_sockets(Nms.names, Nms.ports, id, *Nms.server);
}

PlainPlayer::PlainPlayer(const Names &Nms, int id_base) : PlainPlayer(Nms, to_string(id_base))
{
}

PlainPlayer::~PlainPlayer()
{
  if (num_players() > 1)
  {
    /* Close down the sockets */
    for (auto socket : sockets)
      close_client_socket(socket);
    close_client_socket(send_to_self_socket);
  }
}

template <class T>
MultiPlayer<T>::~MultiPlayer()
{
}

Player::~Player()
{
#ifdef VERBOSE
  for (auto &x : thread_stats)
    x.print();
#endif
}

PlayerBase::~PlayerBase()
{
#ifdef VERBOSE
  comm_stats.print();
  if (timer.elapsed() > 0)
    cerr << "Receiving took " << timer.elapsed() << " seconds" << endl;
#endif
}

// Set up nmachines client and server sockets to send data back and fro
//   A machine is a server between it and player i if i>=my_number
//   Can also communicate with myself, but only with send_to and receive_from
void PlainPlayer::setup_sockets(const vector<string> &names,
                                const vector<int> &ports, const string &id_base, ServerSocket &server)
{
  sockets.resize(nplayers);
  // Set up the client side
  for (int i = 0; i <= player_no; i++)
  {
    auto pn = id_base + "P" + to_string(player_no);
    if (i == player_no)
    {
      const char *localhost = "127.0.0.1";
#ifdef DEBUG_NETWORKING
      fprintf(stderr,
              "Setting up send to self socket to %s:%d with id %s\n",
              localhost, ports[i], pn.c_str());
#endif
      set_up_client_socket(sockets[i], localhost, ports[i]);
    }
    else
    {
#ifdef DEBUG_NETWORKING
      fprintf(stderr, "Setting up client to %s:%d with id %s\n",
              names[i].c_str(), ports[i], pn.c_str());
#endif
      set_up_client_socket(sockets[i], names[i].c_str(), ports[i]);
    }
    octetStream(pn).Send(sockets[i]);
  }
  send_to_self_socket = sockets[player_no];
  // Setting up the server side
  for (int i = player_no; i < nplayers; i++)
  {
    auto id = id_base + "P" + to_string(i);
#ifdef DEBUG_NETWORKING
    fprintf(stderr,
            "As a server, waiting for client with id %s to connect.\n",
            id.c_str());
#endif
    sockets[i] = server.get_connection_socket(id);
  }

  for (int i = 0; i < nplayers; i++)
  {
    // timeout of 5 minutes
    struct timeval tv;
    tv.tv_sec = 300;
    tv.tv_usec = 0;
    int fl = setsockopt(sockets[i], SOL_SOCKET, SO_RCVTIMEO, (char *)&tv, sizeof(struct timeval));
    if (fl < 0)
    {
      error("set_up_socket:setsockopt");
    }
  }
}

template <class T>
void MultiPlayer<T>::send_long(int i, long a) const
{
  TimeScope ts(comm_stats["Sending by number"].add(sizeof(long)));
  send(sockets[i], (octet *)&a, sizeof(long));
  sent += sizeof(long);
}

template <class T>
long MultiPlayer<T>::receive_long(int i) const
{
  long res;
  receive(sockets[i], (octet *)&res, sizeof(long));
  return res;
}

void Player::send_to(int player, const octetStream &o)
{
#ifdef VERBOSE_COMM
  cerr << "sending to " << player << endl;
#endif
  TimeScope ts(comm_stats["Sending directly"].add(o));
  send_to_no_stats(player, o);
  sent += o.get_length();
}

template <class T>
void MultiPlayer<T>::send_to_no_stats(int player, const octetStream &o)
{
  T socket = socket_to_send(player);
  o.Send(socket);
}

void Player::send_all(const octetStream &o)
{
  TimeScope ts(comm_stats["Sending to all"].add(o));
  for (int i = 0; i < nplayers; i++)
  {
    if (i != player_no)
      send_to_no_stats(i, o);
  }
  sent += o.get_length() * (num_players() - 1);
}

void Player::receive_all(vector<octetStream> &os)
{
  os.resize(num_players());
  for (int j = 0; j < num_players(); j++)
    if (j != my_num())
      receive_player(j, os[j]);
}

void Player::receive_player(int i, octetStream &o)
{
#ifdef VERBOSE_COMM
  cerr << "receiving from " << i << endl;
#endif
  TimeScope ts(timer);
  receive_player_no_stats(i, o);
  comm_stats["Receiving directly"].add(o, ts);
}

template <class T>
void MultiPlayer<T>::receive_player_no_stats(int i, octetStream &o)
{
  o.reset_write_head();
  o.Receive(sockets[i]);
}

void Player::receive_player(int i, FlexBuffer &buffer)
{
  octetStream os;
  receive_player(i, os);
  buffer = os;
}

size_t PlainPlayer::send_no_stats(int player,
                                  const PlayerBuffer &buffer, bool block)
{
  if (block)
  {
    send(socket(player), buffer.data, buffer.size);
    return buffer.size;
  }
  else
    return send_non_blocking(socket(player), buffer.data, buffer.size);
}

size_t PlainPlayer::recv_no_stats(int player,
                                  const PlayerBuffer &buffer, bool block)
{
  if (block)
  {
    receive(socket(player), buffer.data, buffer.size);
    return buffer.size;
  }
  else
    return receive_non_blocking(socket(player), buffer.data, buffer.size);
}

void Player::send_relative(const vector<octetStream> &os)
{
  assert((int)os.size() == num_players() - 1);
  for (int offset = 1; offset < num_players(); offset++)
    send_relative(offset, os[offset - 1]);
}

void Player::send_relative(int offset, const octetStream &o)
{
  send_to(positive_modulo(my_num() + offset, num_players()), o);
}

void Player::receive_relative(vector<octetStream> &os)
{
  assert((int)os.size() == num_players() - 1);
  for (int offset = 1; offset < num_players(); offset++)
    receive_relative(offset, os[offset - 1]);
}

void Player::receive_relative(int offset, octetStream &o)
{
  receive_player(positive_modulo(my_num() + offset, num_players()), o);
}

template <class T>
void MultiPlayer<T>::exchange_no_stats(int other, const octetStream &o, octetStream &to_receive)
{
  o.exchange(sockets[other], sockets[other], to_receive);
}

void Player::exchange(int other, const octetStream &o, octetStream &to_receive)
{
#ifdef VERBOSE_COMM
  cerr << "Exchanging with " << other << endl;
#endif
  TimeScope ts(comm_stats["Exchanging"].add(o));
  exchange_no_stats(other, o, to_receive);
  sent += o.get_length();
}

void Player::exchange(int player, octetStream &o)
{
  exchange(player, o, o);
}

void Player::exchange_relative(int offset, octetStream &o)
{
  exchange(get_player(offset), o);
}

template <class T>
void MultiPlayer<T>::pass_around_no_stats(const octetStream &o, octetStream &to_receive, int offset)
{
  o.exchange(sockets.at(get_player(offset)), sockets.at(get_player(-offset)), to_receive);
}

void Player::pass_around(octetStream &o, octetStream &to_receive, int offset)
{
  TimeScope ts(comm_stats["Passing around"].add(o));
  pass_around_no_stats(o, to_receive, offset);
  sent += o.get_length();
}

/* This is deliberately weird to avoid problems with OS max buffer
 * size getting in the way
 */
template <class T>
void MultiPlayer<T>::Broadcast_Receive_no_stats(vector<octetStream> &o)
{
  if (o.size() != sockets.size())
    throw runtime_error("player numbers don't match");

  vector<Exchanger<T>> exchangers;
  for (int i = 1; i < nplayers; i++)
  {
    int send_to = (my_num() + i) % num_players();
    int receive_from = (my_num() + num_players() - i) % num_players();
    exchangers.push_back({sockets[send_to], o[my_num()], sockets[receive_from], o[receive_from]});
  }

  int left = 1;
  while (left > 0)
  {
    left = 0;
    for (auto &exchanger : exchangers)
      left += exchanger.round(false);
  }
}

void Player::unchecked_broadcast(vector<octetStream> &o)
{
  TimeScope ts(comm_stats["Broadcasting"].add(o[player_no]));
  Broadcast_Receive_no_stats(o);
  sent += o[player_no].get_length() * (num_players() - 1);
}

void Player::Broadcast_Receive(vector<octetStream> &o)
{
  unchecked_broadcast(o);
  {
    for (int i = 0; i < nplayers; i++)
    {
      hash_update(&ctx, o[i].get_data(), o[i].get_length());
    }
  }
}

void Player::Check_Broadcast()
{
  if (ctx.size == 0)
    return;
  vector<octetStream> h(nplayers);
  h[player_no].concat(ctx.final());

  unchecked_broadcast(h);
  for (int i = 0; i < nplayers; i++)
  {
    if (i != player_no)
    {
      if (!h[i].equals(h[player_no]))
      {
        throw broadcast_invalid();
      }
    }
  }
  ctx.reset();
}

void Player::send_receive_all(const vector<octetStream> &to_send,
                              vector<octetStream> &to_receive)
{
  send_receive_all(
      vector<vector<bool>>(num_players(), vector<bool>(num_players(), true)),
      to_send, to_receive);
}

void Player::send_receive_all(const vector<bool> &senders,
                              const vector<octetStream> &to_send, vector<octetStream> &to_receive)
{
  vector<vector<bool>> channels;
  for (int i = 0; i < num_players(); i++)
    channels.push_back(vector<bool>(num_players(), senders.at(i)));
  send_receive_all(channels, to_send, to_receive);
}

void Player::send_receive_all(const vector<vector<bool>> &channels,
                              const vector<octetStream> &to_send,
                              vector<octetStream> &to_receive)
{
  size_t data = 0;
  for (int i = 0; i < num_players(); i++)
    if (i != my_num() and channels.at(my_num()).at(i))
    {
      data += to_send.at(i).get_length();
#ifdef VERBOSE_COMM
      cerr << "Send " << to_send.at(i).get_length() << " to " << i << endl;
#endif
    }
  TimeScope ts(comm_stats["Sending/receiving"].add(data));
  sent += data;
  send_receive_all_no_stats(channels, to_send, to_receive);
}

void Player::partial_broadcast(const vector<bool> &,
                               const vector<bool> &, vector<octetStream> &os)
{
  unchecked_broadcast(os);
}

template <class T>
void MultiPlayer<T>::send_receive_all_no_stats(
    const vector<vector<bool>> &channels, const vector<octetStream> &to_send,
    vector<octetStream> &to_receive)
{
  to_receive.resize(num_players());
  for (int offset = 1; offset < num_players(); offset++)
  {
    int receive_from = get_player(-offset);
    int send_to = get_player(offset);
    bool receive = channels[receive_from][my_num()];
    if (channels[my_num()][send_to])
    {
      if (receive)
        pass_around_no_stats(to_send[send_to], to_receive[receive_from], offset);
      else
        send_to_no_stats(send_to, to_send[send_to]);
    }
    else if (receive)
      receive_player_no_stats(receive_from, to_receive[receive_from]);
  }
}

ThreadPlayer::ThreadPlayer(const Names &Nms, const string &id_base) : PlainPlayer(Nms, id_base)
{
  for (int i = 0; i < Nms.num_players(); i++)
  {
    receivers.push_back(new Receiver<int>(sockets[i]));
    senders.push_back(new Sender<int>(socket_to_send(i)));
  }
}

ThreadPlayer::~ThreadPlayer()
{
  for (unsigned int i = 0; i < receivers.size(); i++)
  {
    if (receivers[i]->timer.elapsed() > 0)
      cerr << "Waiting for receiving from " << i << ": " << receivers[i]->timer.elapsed() << endl;
    delete receivers[i];
  }

  for (unsigned int i = 0; i < senders.size(); i++)
  {
    if (senders[i]->timer.elapsed() > 0)
      cerr << "Waiting for sending to " << i << ": " << senders[i]->timer.elapsed() << endl;
    delete senders[i];
  }
}

void ThreadPlayer::request_receive(int i, octetStream &o) const
{
  receivers[i]->request(o);
}

void ThreadPlayer::wait_receive(int i, octetStream &o)
{
  receivers[i]->wait(o);
}

void ThreadPlayer::receive_player_no_stats(int i, octetStream &o)
{
  request_receive(i, o);
  wait_receive(i, o);
}

void ThreadPlayer::send_all(const octetStream &o)
{
  for (int i = 0; i < nplayers; i++)
  {
    if (i != player_no)
      senders[i]->request(o);
  }

  for (int i = 0; i < nplayers; i++)
    if (i != player_no)
      senders[i]->wait(o);
}

RealTwoPartyPlayer::RealTwoPartyPlayer(const Names &Nms, int other_player, const string &id) : VirtualTwoPartyPlayer(*(P = new PlainPlayer(Nms, id + "2")), other_player)
{
}

RealTwoPartyPlayer::RealTwoPartyPlayer(const Names &Nms, int other_player,
                                       int id_base) : RealTwoPartyPlayer(Nms, other_player, to_string(id_base))
{
}

RealTwoPartyPlayer::~RealTwoPartyPlayer()
{
  delete P;
}

void VirtualTwoPartyPlayer::send(octetStream &o) const
{
  TimeScope ts(comm_stats["Sending one-to-one"].add(o));
  P.send_to_no_stats(other_player, o);
  comm_stats.sent += o.get_length();
}

void VirtualTwoPartyPlayer::receive(octetStream &o) const
{
  TimeScope ts(timer);
  P.receive_player_no_stats(other_player, o);
  comm_stats["Receiving one-to-one"].add(o, ts);
}

void VirtualTwoPartyPlayer::send_receive_player(vector<octetStream> &o)
{
  TimeScope ts(comm_stats["Exchanging one-to-one"].add(o[0]));
  comm_stats.sent += o[0].get_length();
  P.exchange_no_stats(other_player, o[0], o[1]);
}

VirtualTwoPartyPlayer::VirtualTwoPartyPlayer(Player &P, int other_player) : TwoPartyPlayer(P.my_num()), P(P), other_player(other_player), comm_stats(
                                                                                                                                              P.thread_stats.at(other_player))
{
}

size_t VirtualTwoPartyPlayer::send(const PlayerBuffer &buffer, bool block) const
{
  auto sent = P.send_no_stats(other_player, buffer, block);
  lock.lock();
  comm_stats.add_to_last_round("Sending one-to-one", sent);
  comm_stats.sent += sent;
  lock.unlock();
  return sent;
}

size_t VirtualTwoPartyPlayer::recv(const PlayerBuffer &buffer, bool block) const
{
  auto received = P.recv_no_stats(other_player, buffer, block);
  lock.lock();
  comm_stats.add_to_last_round("Receiving one-to-one", received);
  lock.unlock();
  return received;
}

void OffsetPlayer::send_receive_player(vector<octetStream> &o)
{
  P.exchange(P.get_player(offset), o[0], o[1]);
}

void TwoPartyPlayer::Broadcast_Receive(vector<octetStream> &o)
{
  vector<octetStream> os(2);
  os[0] = o[my_num()];
  send_receive_player(os);
  o[1 - my_num()] = os[1];
}

NamedCommStats::NamedCommStats() : sent(0)
{
}

CommStats &CommStats::operator+=(const CommStats &other)
{
  data += other.data;
  rounds += other.rounds;
  timer += other.timer;
  return *this;
}

NamedCommStats &NamedCommStats::operator+=(const NamedCommStats &other)
{
  sent += other.sent;
  for (auto it = other.begin(); it != other.end(); it++)
    (*this)[it->first] += it->second;
  return *this;
}

NamedCommStats NamedCommStats::operator+(const NamedCommStats &other) const
{
  auto res = *this;
  res += other;
  return res;
}

CommStats &CommStats::operator-=(const CommStats &other)
{
  data -= other.data;
  rounds -= other.rounds;
  timer -= other.timer;
  return *this;
}

NamedCommStats NamedCommStats::operator-(const NamedCommStats &other) const
{
  NamedCommStats res = *this;
  res.sent = sent - other.sent;
  for (auto it = other.begin(); it != other.end(); it++)
    res[it->first] -= it->second;
  return res;
}

void NamedCommStats::print(bool newline)
{
  for (auto it = begin(); it != end(); it++)
    if (it->second.data)
      cerr << it->first << " " << 1e-6 * it->second.data << " MB in "
           << it->second.rounds << " rounds, taking " << it->second.timer.elapsed()
           << " seconds" << endl;
  if (size() and newline)
    cerr << endl;
}

void NamedCommStats::reset()
{
  clear();
  sent = 0;
}

Timer &NamedCommStats::add_to_last_round(const string &name, size_t length)
{
  if (name == last)
    return (*this)[name].add_length_only(length);
  else
  {
    last = name;
    return (*this)[name].add(length);
  }
}

void PlayerBase::reset_stats()
{
  comm_stats.reset();
}

NamedCommStats Player::total_comm() const
{
  auto res = comm_stats;
  for (auto &x : thread_stats)
    res += x;
  return res;
}

template class MultiPlayer<int>;
template class MultiPlayer<ssl_socket *>;
