#pragma once

#include "packethandler.hpp"

class Manager {
   private:
    static bool tryValidatePtr(void const* ptr);

    void processMessage(PacketWrapper const& packet);
    void setField(SetField const& packet, uint64_t id);
    void getField(GetField const& packet, uint64_t id);
    void invokeMethod(InvokeMethod const& packet, uint64_t id);
    void searchObjects(SearchObjects const& packet, uint64_t id);
    void getAllGameObjects(GetAllGameObjects const& packet, uint64_t id);
    void getGameObjectComponents(GetGameObjectComponents const& packet, uint64_t id);
    void readMemory(ReadMemory const& packet, uint64_t id);
    void writeMemory(WriteMemory const& packet, uint64_t id);
    void getClassDetails(GetClassDetails const& packet, uint64_t id);
    void getInstanceClass(GetInstanceClass const& packet, uint64_t id);
    void getInstanceValues(GetInstanceValues const& packet, uint64_t id);
    void getInstanceDetails(GetInstanceDetails const& packet, uint64_t id);
    void createGameObject(CreateGameObject const& packet, uint64_t id);
    void addSafePtrAddress(AddSafePtrAddress const& packet, uint64_t id);
    void sendSafePtrList(uint64_t id);
    void setLoggerListener(RequestLogger const& packet, uint64_t id);
    void setCameraOptions(CameraOptions const& packet, uint64_t id);
    void getHoveredObject(GetCameraHovered const& packet, uint64_t id);

    bool initialized;
    bool sendLoggerUpdates = false;
    std::unique_ptr<PacketHandler> handler;

   public:
    void Init();

    static Manager* GetInstance();
};
