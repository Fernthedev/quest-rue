#pragma once

#include "../packethandler.hpp"

#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>

class WebSocketHandler : public PacketHandler {
    typedef websocketpp::server<websocketpp::config::asio> WebSocketServer;

    public:
        WebSocketHandler(ReceivePacketFunc onReceivePacket) : PacketHandler(onReceivePacket) { }
        void listen(const int port);
        void sendPacket(const PacketWrapper& packet);
        bool hasConnection();
    private:
        WebSocketServer serverSocket;
        void OnOpen(websocketpp::connection_hdl hdl);
        void OnClose(websocketpp::connection_hdl hdl);
        void OnMessage(WebSocketServer* s, websocketpp::connection_hdl hdl, WebSocketServer::message_ptr msg);
        std::set<websocketpp::connection_hdl, std::owner_less<websocketpp::connection_hdl>> connections;
};