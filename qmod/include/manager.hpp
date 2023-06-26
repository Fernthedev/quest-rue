#pragma once

#include "methods.hpp"
#include "packethandler.hpp"
#include "socket_lib/shared/SocketHandler.hpp"

#include <sstream>

class Manager {
    private:
    static bool tryValidatePtr(const void* ptr);

    void processMessage(const PacketWrapper& packet);
    void setField(const SetField& packet, uint64_t id);
    void getField(const GetField& packet, uint64_t id);
    void invokeMethod(const InvokeMethod& packet, uint64_t id);
    void searchObjects(const SearchObjects& packet, uint64_t id);
    void getAllGameObjects(const GetAllGameObjects& packet, uint64_t id);
    void getGameObjectComponents(const GetGameObjectComponents& packet, uint64_t id);
    void readMemory(const ReadMemory& packet, uint64_t id);
    void writeMemory(const WriteMemory& packet, uint64_t id);
    void getClassDetails(const GetClassDetails& packet, uint64_t id);
    void getInstanceClass(const GetInstanceClass& packet, uint64_t id);
    void getInstanceValues(const GetInstanceValues& packet, uint64_t id);
    void getInstanceDetails(const GetInstanceDetails& packet, uint64_t id);
    void createGameObject(const CreateGameObject& packet, uint64_t id);
    void addSafePtrAddress(const AddSafePtrAddress& packet, uint64_t id);
    void sendSafePtrList(uint64_t id);

    bool initialized;
    std::unique_ptr<PacketHandler> handler;

    std::unordered_map<Il2CppClass*, PacketWrapper> cachedClasses;

    // TODO: implement
    std::vector<SafePtr<Il2CppObject>> storedResults;

    public:
    void Init();

    static Manager* GetInstance();
};
