#pragma once

#include <functional>

#include "qrue.pb.h"

using ReceivePacketFunc = std::function<void(PacketWrapper const& packet)>;

class PacketHandler {
   public:
    PacketHandler(ReceivePacketFunc onReceivePacket) { this->onReceivePacket = onReceivePacket; }
    virtual ~PacketHandler(){};
    virtual void listen(int const port) = 0;
    virtual void sendPacket(PacketWrapper const& packet) = 0;
    virtual bool hasConnection() = 0;

    virtual void scheduleAsync(std::function<void()>&& f) = 0;

   protected:
    ReceivePacketFunc onReceivePacket = nullptr;
};
