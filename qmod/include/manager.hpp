#pragma once

#include "methods.hpp"
#include "socket_lib/shared/SocketHandler.hpp"

struct ByteBuilder {
    private:
    std::byte* buffer = nullptr;
    size_t size;
    size_t progress;

    public:
    ByteBuilder() = default;
    ByteBuilder(size_t N) {
        Init(N);
    }
    ~ByteBuilder() {
        delete[] buffer;
    }
    void Init(size_t N) {
        if(buffer)
            delete[] buffer;
        buffer = new std::byte[N];
        progress = 0;
        size = N;
    }
    void AddBytes(const void* bytes, int length = -1) {
        if(length > size - progress || length < 0)
            length = size - progress;
        memcpy(buffer + progress, bytes, length);
        progress += length;
    }
    template<class T>
    T* Resolve() {
        if(progress != size)
            return nullptr;
        return (T*) buffer;
    }
    void Clear() {
        progress = 0;
    }
    size_t GetProgress() {
        return progress;
    }
    size_t GetSize() {
        return size;
    }
    size_t GetRemaining() {
        return size - progress;
    }
};

class Manager {
    private:
    void connectEvent(SocketLib::Channel& channel, bool connected);
    void listenOnEvents(SocketLib::Channel& client, const SocketLib::Message& message);

    void processBytes(std::span<const SocketLib::byte> bytes);

    void processMessage(const PacketWrapper& packet);
    void invokeMethod(const InvokeMethod& packet);
    void loadObject(const LoadObject& packet);
    void searchObjects(const SearchObjects& packet);

    void sendPacket(const PacketWrapper& packet);

    // separating seems difficult
    void setAndSendObject(class Il2CppObject* object, uint64_t id);

    SocketLib::ServerSocket* serverSocket;
    SocketLib::Channel* client;
    bool initialized, connected;

    ByteBuilder header;
    ByteBuilder packetBytes;

    Il2CppObject* object;
    std::vector<Method> methods;

    std::vector<SafePtr<Il2CppObject>> storedResults;

    public:
    void Init();
    void SetObject(class Il2CppObject* object);

    static Manager* Instance;
};