#pragma once

#include "methods.hpp"
#include "packethandler.hpp"
#include "socket_lib/shared/SocketHandler.hpp"

#include <sstream>

class Manager {
    private:
    
    void processMessage(const PacketWrapper& packet);
    void invokeMethod(const InvokeMethod& packet, uint64_t id);
    void searchObjects(const SearchObjects& packet, uint64_t id);
    void getAllGameObjects(const GetAllGameObjects& packet, uint64_t id);
    void getGameObjectComponents(const GetGameObjectComponents& packet, uint64_t id);
    void readMemory(const ReadMemory& packet, uint64_t id);
    void writeMemory(const WriteMemory& packet, uint64_t id);
    void getClassDetails(const GetClassDetails& packet, uint64_t id);
    void readInstanceDetails(const ReadInstanceDetails& packet, uint64_t id);

    bool initialized;
    std::unique_ptr<PacketHandler> handler;

    std::unordered_map<Il2CppClass*, PacketWrapper> cachedClasses;

    // TODO: implement
    std::vector<SafePtr<Il2CppObject>> storedResults;

    public:
    void Init();

    static Manager* GetInstance();
};