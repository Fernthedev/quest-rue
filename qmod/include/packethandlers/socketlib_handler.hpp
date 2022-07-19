#pragma once

#include "../packethandler.hpp"

#include "socket_lib/shared/SocketHandler.hpp"

struct IncomingPacket {
    using byte = unsigned char;

    IncomingPacket(size_t expectedLength) : data(), expectedLength(expectedLength) {
        data.reserve(expectedLength);
    }

    // by default, invalid packet
    explicit IncomingPacket() : IncomingPacket(0) {}

    inline void insertBytes(std::span<const byte> bytes) {
        insertBytes(bytes.data(), bytes.size());
        // data << bytes.data();
        // currentLength += bytes.size();
    }

    template <typename T>
    inline void insertBytes(T && bytes, size_t size) {
        data.insert(data.end(), std::forward<T>(bytes), std::forward<T>(bytes) + size);
        // data << std::forward<T>(bytes);
        // currentLength += size;
    }

    [[nodiscard]] auto &getData() {
        return data;
    }

    [[nodiscard]] size_t getExpectedLength() const {
        return expectedLength;
    }

    [[nodiscard]] size_t getCurrentLength() const {
        return data.size();
    }

    [[nodiscard]] constexpr bool isValid() const {
        return expectedLength > 0;
    }

private:
    std::vector<byte> data;
    // size_t currentLength; // should we do this?
    size_t expectedLength;
    // std::stringstream data;
};

class SocketLibHandler : public PacketHandler {
    public:
        SocketLibHandler(ReceivePacketFunc onReceivePacket) : PacketHandler(onReceivePacket) { }
        void listen(const int port) override;
        void sendPacket(const PacketWrapper &packet) override;
        bool hasConnection() override;
        void scheduleAsync(std::function<void()> &&f) override;
    private:
        SocketLib::ServerSocket* serverSocket;

        std::unordered_map<SocketLib::Channel *, IncomingPacket> channelIncomingQueue;
        void connectEvent(SocketLib::Channel& channel, bool connected);
        void listenOnEvents(SocketLib::Channel& client, const SocketLib::Message& message);
};