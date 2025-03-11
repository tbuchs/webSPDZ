#include "Processor/ExternalClients.h"
#include "Processor/OnlineOptions.h"
#include "Networking/ServerSocket.h"
#include "Networking/ssl_sockets.h"
#include <netinet/in.h>
#include <arpa/inet.h>
#include <thread>

ExternalClients::ExternalClients(int party_num):
   party_num(party_num),
   ctx(0)
{
}

ExternalClients::~ExternalClients() 
{
  // close client sockets
  for (auto it = external_client_sockets.begin();
    it != external_client_sockets.end(); it++)
  {
    delete it->second;
  }
  for (map<int,AnonymousServerSocket*>::iterator it = client_connection_servers.begin();
    it != client_connection_servers.end(); it++)
  {
    delete it->second;
  }
  if (ctx)
    delete ctx;
  for (auto it = peer_ctxs.begin(); it != peer_ctxs.end(); it++)
    delete it->second;
}

void ExternalClients::start_listening(int portnum_base)
{
  ScopeLock _(lock);
  client_connection_servers[portnum_base] = new AnonymousServerSocket(portnum_base + get_party_num());
  client_connection_servers[portnum_base]->init();
  if (OnlineOptions::singleton.verbose)
    cerr << "Party " << get_party_num() << " is listening on port "
        << (portnum_base + get_party_num())
        << " for external client connections." << endl;
}

int ExternalClients::get_client_connection(int portnum_base)
{
  ScopeLock _(lock);
  map<int,AnonymousServerSocket*>::iterator it = client_connection_servers.find(portnum_base);
  if (it == client_connection_servers.end())
  {
    cerr << "Thread " << this_thread::get_id() << " didn't find server." << endl; 
    throw runtime_error("No connection on port " + to_string(portnum_base));
  }
  int client_id, socket;
  string client;
  socket = client_connection_servers[portnum_base]->get_connection_socket(
      client);
  client_id = stoi(client);
  if (ctx == 0)
    ctx = new client_ctx("P" + to_string(get_party_num()));
  external_client_sockets[client_id] = new client_socket(io_service, *ctx, socket,
      "C" + to_string(client_id), "P" + to_string(get_party_num()), false);
  client_ports[client_id] = portnum_base;
  if (OnlineOptions::singleton.verbose)
    cerr << "Party " << get_party_num()
        << " received external client connection from client id: " << dec
        << client_id << endl;
  return client_id;
}

int ExternalClients::init_client_connection(const string& host, int portnum,
    int my_client_id)
{
  ScopeLock _(lock);
  int plain_socket;
  set_up_client_socket(plain_socket, host.c_str(), portnum);
  octetStream(to_string(my_client_id)).Send(plain_socket);
  string my_client_name = "C" + to_string(my_client_id);
  if (peer_ctxs.find(my_client_id) == peer_ctxs.end())
    peer_ctxs[my_client_id] = new client_ctx(my_client_name);
  auto socket = new client_socket(io_service, *peer_ctxs[my_client_id],
      plain_socket, "P" + to_string(party_num), "C" + to_string(my_client_id),
      true);
  if (party_num == 0)
    {
      octetStream specification;
      specification.Receive(socket);
    }
  int id = -1;
  if (not external_client_sockets.empty())
    id = min(id, external_client_sockets.begin()->first);
  external_client_sockets[id] = socket;
  return id;
}

void ExternalClients::close_connection(int client_id)
{
  ScopeLock _(lock);
  auto it = external_client_sockets.find(client_id);
  if (it == external_client_sockets.end())
    throw runtime_error("client id not active: " + to_string(client_id));
  delete external_client_sockets[client_id];
  external_client_sockets.erase(client_id);
  client_connection_servers[client_ports[client_id]]->remove_client(
      to_string(client_id));
}

int ExternalClients::get_party_num() 
{
  return party_num;
}

client_socket* ExternalClients::get_socket(int id)
{
  ScopeLock _(lock);
  if (external_client_sockets.find(id) == external_client_sockets.end())
    throw runtime_error("external connection not found for id " + to_string(id));
  return external_client_sockets[id];
}
