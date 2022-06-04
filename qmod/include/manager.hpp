#pragma once

#include "methods.hpp"
#include "socket_lib/shared/SocketHandler.hpp"

#include <sstream>

struct IncomingPacket
{
    std::stringstream data;
    size_t expectedLength;
    size_t currentLength; // should we do this?

    [[nodiscard]] constexpr bool isValid() const
    {
        return expectedLength > 0;
    }

    IncomingPacket(size_t expectedLength) : data(expectedLength), expectedLength(expectedLength) {}

    // by default, invalid packet
    explicit IncomingPacket() : IncomingPacket(0) {}
};

class Manager {
    private:
    void connectEvent(SocketLib::Channel& channel, bool connected);
    void listenOnEvents(SocketLib::Channel& client, const SocketLib::Message& message);

    void processMessage(const PacketWrapper& packet);
    void invokeMethod(const InvokeMethod& packet);
    void loadObject(const LoadObject& packet);
    void searchObjects(const SearchObjects& packet);

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