#pragma once

#include "main.hpp"
#include <functional>

using ReceivePacketFunc = std::function<void(const PacketWrapper& packet)>;

class PacketHandler {
    public:
        PacketHandler(ReceivePacketFunc onReceivePacket) {
            this->onReceivePacket = onReceivePacket;
        }
        virtual ~PacketHandler() { };
        virtual void listen(const int port) = 0;
        virtual void sendPacket(const PacketWrapper& packet) = 0;
        virtual bool hasConnection() = 0;
    protected:
        ReceivePacketFunc onReceivePacket = nullptr;

};