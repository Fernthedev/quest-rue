#pragma once

#include "methods.hpp"
#include "packethandler.hpp"
#include "socket_lib/shared/SocketHandler.hpp"

#include <sstream>

class Manager {
    private:
    
    void processMessage(const PacketWrapper& packet);
    void invokeMethod(const InvokeMethod& packet);
    void loadObject(const LoadObject& packet);
    void searchComponents(const SearchComponents& packet);
    void findGameObjects(const FindGameObjects& packet);

    // separating seems difficult
    void setAndSendObject(class Il2CppObject* object, uint64_t id);

    bool initialized;
    PacketHandler* handler;
    Il2CppObject* object;
    std::vector<Method> methods;

    std::unordered_map<Il2CppClass*, PacketWrapper> cachedClasses;

    // todo
    std::vector<SafePtr<Il2CppObject>> storedResults;

    public:
    void Init();
    void SetObject(class Il2CppObject* object);

    static Manager* Instance;
};