#pragma once

#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>

#include "../packethandler.hpp"

class WebSocketHandler : public PacketHandler {
    typedef websocketpp::server<websocketpp::config::asio> WebSocketServer;

   public:
    WebSocketHandler(ReceivePacketFunc onReceivePacket) : PacketHandler(onReceivePacket) {}
    ~WebSocketHandler() override;
    void listen(int const port) override;
    void stop();
    void sendPacket(PacketWrapper const& packet) override;
    bool hasConnection() override;
    void scheduleAsync(std::function<void()>&& f) override;

   private:
    std::unique_ptr<WebSocketServer> serverSocket;
    std::thread serverThread;
    void OnOpen(websocketpp::connection_hdl hdl);
    void OnClose(websocketpp::connection_hdl hdl);
    void OnMessage(WebSocketServer* s, websocketpp::connection_hdl hdl, WebSocketServer::message_ptr msg);
    std::set<websocketpp::connection_hdl, std::owner_less<websocketpp::connection_hdl>> connections;
};
