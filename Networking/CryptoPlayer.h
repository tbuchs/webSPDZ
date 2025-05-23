/*
 * CryptoPlayer.h
 *
 */

#ifndef NETWORKING_CRYPTOPLAYER_H_
#define NETWORKING_CRYPTOPLAYER_H_

#include "ssl_sockets.h"
#include "Networking/Player.h"

#include <boost/asio/ssl.hpp>
#include <boost/asio.hpp>

/**
 * Encrypted multi-party communication.
 * Uses OpenSSL and certificates issued to "P<player_no>".
 * Sending and receiving is done in separate threads to allow
 * for bidirectional communication.
 */
class CryptoPlayer : public MultiPlayer<ssl_socket*>
{
    ssl_ctx ctx;
    boost::asio::io_service io_service;

    vector<ssl_socket*> other_sockets;

    vector<Sender<ssl_socket*>*> senders;
    vector<Receiver<ssl_socket*>*> receivers;

    void connect(int other, vector<int>* plaintext_sockets);

public:
    /**
     * Start a new set of encrypted connections.
     * @param Nms network setup
     * @param id unique identifier
     */
    CryptoPlayer(const Names& Nms, const string& id);
    // legacy interface
    CryptoPlayer(const Names& Nms, int id_base = 0);
    ~CryptoPlayer();

    bool is_encrypted() { return true; }

    void send_to_no_stats(int other, const octetStream& o);
    void receive_player_no_stats(int other, octetStream& o);

    size_t send_no_stats(int player, const PlayerBuffer& buffer,
            bool block);
    size_t recv_no_stats(int player, const PlayerBuffer& buffer,
            bool block);

    void exchange_no_stats(int other, const octetStream& to_send,
        octetStream& to_receive);

    void pass_around_no_stats(const octetStream& to_send, octetStream& to_receive,
        int offset);

    void send_receive_all_no_stats(const vector<vector<bool>>& channels,
            const vector<octetStream>& to_send,
            vector<octetStream>& to_receive);

    void partial_broadcast(const vector<bool>& my_senders,
            const vector<bool>& my_receivers, vector<octetStream>& os);

    void Broadcast_Receive_no_stats(vector<octetStream>& os);
};

#endif /* NETWORKING_CRYPTOPLAYER_H_ */
