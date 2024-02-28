#include <algorithm>

#include "MainThreadRunner.hpp"

#include "packethandlers/websocket_handler.hpp"

#include "socket_lib/shared/SocketHandler.hpp"

using namespace websocketpp;
using lib::placeholders::_1;
using lib::placeholders::_2;
using lib::bind;

WebSocketHandler::~WebSocketHandler() {
    stop();
}

void WebSocketHandler::listen(const int port) {
    stop();
    try {
        serverSocket = std::make_unique<WebSocketServer>();
        serverSocket->set_access_channels(log::alevel::none);
        serverSocket->set_error_channels(log::elevel::none);

        serverSocket->init_asio();
        serverSocket->set_reuse_addr(true);
        serverSocket->set_open_handler(bind(&WebSocketHandler::OnOpen, this, ::_1));
        serverSocket->set_close_handler(bind(&WebSocketHandler::OnClose, this, ::_1));
        serverSocket->set_message_handler(bind(&WebSocketHandler::OnMessage, this, serverSocket.get(), ::_1, ::_2));

        serverSocket->listen(port);
        serverSocket->start_accept();
        
        serverThread = std::thread([this]() {
            serverSocket->run();
        });
        serverThread.detach(); 
        LOG_INFO("Started server");
    } catch (exception const & e) {
        LOG_INFO("Server failed because: ({})!", e.what());
        stop();
        LOG_INFO("Retrying in 5 seconds!");
        sleep(5);
        listen(port);
    } catch (...) {
        LOG_INFO("Server failed!");
    }
}

void WebSocketHandler::stop() {
    if(!serverSocket) {
        connections.clear();
        return;
    }
    LOG_INFO("Stopping server!");
    try {
        if(serverSocket->is_listening())
            serverSocket->stop_listening();
    } catch (exception const & e) {
        LOG_INFO("Stop_listening failed because: ({})", e.what());
    }
    for (auto const& hdl : connections) {
        try {
            serverSocket->close(hdl, close::status::going_away, "shutdown");
        } catch (exception const & e) {
            LOG_INFO("Close failed because: ({})", e.what());
        }
    }
    serverSocket.release();
    connections.clear();
}

void WebSocketHandler::scheduleAsync(std::function<void()> &&f)
{
    // TODO: Thread pool or something
    std::thread(std::move(f)).detach();
}

bool WebSocketHandler::hasConnection() {
    return !connections.empty();
}

void WebSocketHandler::OnOpen(connection_hdl hdl) {
    connections.insert(hdl);
    LOG_INFO("Connected {} status: connected", hdl.lock().get());
}

void WebSocketHandler::OnClose(connection_hdl hdl) {
    connections.erase(hdl);
    LOG_INFO("Connected {} status: disconnected", hdl.lock().get());
}

void WebSocketHandler::OnMessage(WebSocketServer* s, connection_hdl hdl, WebSocketServer::message_ptr msg) {
    LOG_DEBUG("OnMessage called with hdl: {} and message: {}", hdl.lock().get(), msg->get_payload());
    PacketWrapper packet;
    packet.ParseFromArray(msg->get_payload().data(), msg->get_payload().size());
    scheduleFunction([this, packet = std::move(packet)]() {
        onReceivePacket(packet);
    });
}

void WebSocketHandler::sendPacket(const PacketWrapper& packet) {
    packet.CheckInitialized();
    auto string = packet.SerializeAsString();
    for (auto const& hdl : connections) {
        try {
            serverSocket->send(hdl, string, frame::opcode::value::BINARY);
        } catch (exception const & e) {
            LOG_INFO("Echo failed because: ({})", e.what());
        }
    }
}
