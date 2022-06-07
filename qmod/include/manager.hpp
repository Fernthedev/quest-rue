#pragma once

#include "methods.hpp"
#include "socket_lib/shared/SocketHandler.hpp"

#include <sstream>

struct IncomingPacket
{
    using byte = unsigned char;

    IncomingPacket(size_t expectedLength) : data(), expectedLength(expectedLength) {
        data.reserve(expectedLength);
    }

    // by default, invalid packet
    explicit IncomingPacket() : IncomingPacket(0) {}

    inline void insertBytes(std::span<const byte> bytes)
    {
        insertBytes(bytes.data(), bytes.size());
        // data << bytes.data();
        // currentLength += bytes.size();
    }

    template <typename T>
    inline void insertBytes(T && bytes, size_t size)
    {
        data.insert(data.end(), std::forward<T>(bytes), std::forward<T>(bytes) + size);
        // data << std::forward<T>(bytes);
        // currentLength += size;
    }

    [[nodiscard]] auto &getData()
    {
        return data;
    }

    [[nodiscard]] size_t getExpectedLength() const {
        return expectedLength;
    }

    [[nodiscard]] size_t getCurrentLength() const
    {
        return data.size();
    }

    [[nodiscard]] constexpr bool isValid() const
    {
        return expectedLength > 0;
    }

private:
    std::vector<byte> data;
    // size_t currentLength; // should we do this?
    size_t expectedLength;
    // std::stringstream data;
};

class Manager {
    private:
    void connectEvent(SocketLib::Channel& channel, bool connected);
    void listenOnEvents(SocketLib::Channel& client, const SocketLib::Message& message);

    void processMessage(const PacketWrapper& packet);
    void invokeMethod(const InvokeMethod& packet);
    void loadObject(const LoadObject& packet);
    void searchComponents(const SearchComponents& packet);
    void findGameObject(const FindGameObject& packet);

    void sendPacket(const PacketWrapper& packet);

    // separating seems difficult
    void setAndSendObject(class Il2CppObject* object, uint64_t id);

    SocketLib::ServerSocket* serverSocket;
    bool initialized;

    std::unordered_map<SocketLib::Channel *, IncomingPacket> channelIncomingQueue;

    Il2CppObject* object;
    std::vector<Method> methods;

    std::vector<SafePtr<Il2CppObject>> storedResults;

    public:
    void Init();
    void SetObject(class Il2CppObject* object);

    static Manager* Instance;
};