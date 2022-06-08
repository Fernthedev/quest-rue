#include "manager.hpp"
#include "classutils.hpp"
#include "main.hpp"

#include <fmt/ranges.h>

#define MESSAGE_LOGGING

using namespace SocketLib;
using namespace ClassUtils;

template<class T>
inline T& ReinterpretBytes(std::string_view bytes) {
    return *(T*) bytes.data();
}

template<class T>
inline std::string ByteString(const T& bytes) {
    return {(char*) &bytes, sizeof(T)};
}

Manager* Manager::Instance = nullptr;

void Manager::Init() {
    Manager::Instance = this;
    initialized = true;
    LOG_INFO("Starting server at port 3306");
    SocketHandler& socketHandler = SocketHandler::getCommonSocketHandler();

    serverSocket = socketHandler.createServerSocket(3306);
    serverSocket->bindAndListen();
    LOG_INFO("Started server");

    ServerSocket& serverSocket = *this->serverSocket;
    
    serverSocket.connectCallback += {&Manager::connectEvent, this};
    serverSocket.listenCallback += {&Manager::listenOnEvents, this};

    LOG_INFO("Server fully initialized");
}

void Manager::SetObject(Il2CppObject* obj) {
    setAndSendObject(obj, 0);
}

void Manager::connectEvent(Channel& channel, bool connected) {
    LOG_INFO("Connected {} status: {}", channel.clientDescriptor, connected ? "connected" : "disconnected");
    if (!connected)
        channelIncomingQueue.erase(&channel);
    else
        channelIncomingQueue.try_emplace(&channel, 0);
}

void Manager::listenOnEvents(Channel& client, const Message& message) {
    // read the bytes
    // if no packet is being parsed, get the first 8 bytes
    // the first 8 bytes are the size frame, which dictate the size of the incoming packet (excluding the frame)
    // then continue reading bytes until the expected size matches the current byte size
    // if excess bytes, loop again

    std::span<const byte> receivedBytes = message;
    auto &pendingPacket = channelIncomingQueue.at(&client);

    // start of a new packet
    if (!pendingPacket.isValid()) {
        // get the first 8 bytes, then cast to size_t
        size_t expectedLength = *reinterpret_cast<size_t const *>(receivedBytes.first(sizeof(size_t)).data());
        expectedLength = ntohq(expectedLength);
        
        // LOG_INFO("Starting packet: is little endian {} {} flipped {} {}", std::endian::native == std::endian::little, expectedLength, ntohq(expectedLength), receivedBytes);

        pendingPacket = {expectedLength};

        auto subspanData = receivedBytes.subspan(sizeof(size_t));
        pendingPacket.insertBytes(subspanData);
        // continue appending to existing packet
    } else {
        pendingPacket.insertBytes(receivedBytes);
    }

    if (pendingPacket.getCurrentLength() < pendingPacket.getExpectedLength()) {
        return;
    }

    auto stream = std::move(pendingPacket.getData()); // avoid copying
    std::span<const byte> const finalMessage = stream;
    auto const packetBytes = (finalMessage).subspan(0, pendingPacket.getExpectedLength());

    if (pendingPacket.getCurrentLength() > pendingPacket.getExpectedLength()) {
        auto excessData = finalMessage.subspan(pendingPacket.getExpectedLength());
        // get the first 8 bytes, then cast to size_t
        size_t expectedLength = *reinterpret_cast<size_t const*>(excessData.data());

        pendingPacket = IncomingPacket(expectedLength); // reset with excess data

        auto excessDataWithoutSize = excessData.subspan(sizeof(size_t));

        // insert excess data, ignoring the size prefix
        pendingPacket.insertBytes(excessDataWithoutSize);
    } else {
        pendingPacket = IncomingPacket(); // reset 
    }

    PacketWrapper packet;
    packet.ParseFromArray(packetBytes.data(), packetBytes.size());
    processMessage(packet);

    // Parse the next packet as it is ready
    if (pendingPacket.isValid() && pendingPacket.getCurrentLength()  >= pendingPacket.getExpectedLength()) {
        listenOnEvents(client, Message(""));
    }
}

void Manager::sendPacket(const PacketWrapper& packet) {
    packet.CheckInitialized();
    size_t size = packet.ByteSizeLong();
    // send size header
    // send message with that size
    Message message(sizeof(size_t) + size);
    auto networkSize = htonq(size); // convert to big endian

    //set size header
    *reinterpret_cast<size_t*>(message.data()) = networkSize;

    packet.SerializeToArray(message.data() + sizeof(size_t), size); // payload

    for (auto const& [id, client] : serverSocket->getClients()) {
        client->queueWrite(message);
        // LOG_INFO("Sending to {} bytes {} {}", id, size, finishedBytes);
    }
}

#pragma region sending
void Manager::setAndSendObject(Il2CppObject* obj, uint64_t id) {
    if(serverSocket->getClients().empty()) return;
    if(!obj) return;

    object = obj;
    methods.clear();

    auto* klass = classofinst(object);

    if(cachedClasses.contains(klass)) {
        LOG_INFO("Sending cached class");
        sendPacket(cachedClasses.at(klass));
        return;
    }

    LOG_INFO("Adding class to cache");
    PacketWrapper& packet = cachedClasses.insert({klass, {}}).first->second;
    LoadObjectResult& result = *packet.mutable_loadobjectresult();
    result.set_loadid(id);
    TypeDetailsMsg* packetObject = result.mutable_object();
    
    while(klass) {
        *packetObject->mutable_clazz() = GetClassInfo(il2cpp_functions::class_get_type(klass));

        for(auto const& iKlass : GetInterfaces(klass))
            *packetObject->add_interfaces() = GetClassInfo(il2cpp_functions::class_get_type(iKlass));

        for(auto const& fieldInfo : GetFields(klass)) {
            methods.emplace_back(Method(object, fieldInfo, false));
            methods.emplace_back(Method(object, fieldInfo, true));

            auto const& fakeMethodSet = methods.back();
            *packetObject->add_fields() = fakeMethodSet.GetFieldInfo(methods.size() - 2);
        }

        // all property get/set methods are contained in the methods
        // TODO: get the properties and match them to their methods somehow
        for(auto const& methodInfo : GetMethods(klass)) {
            methods.emplace_back(Method(object, methodInfo));

            auto const& method = methods.back();
            *packetObject->add_methods() = method.GetMethodInfo(methods.size() - 1);
        }

        klass = GetParent(klass);
        if(klass)
            packetObject = packetObject->mutable_parent();
    }

    sendPacket(packet);
    LOG_INFO("Object set");
}
#pragma endregion

#pragma region parsing
void Manager::processMessage(const PacketWrapper& packet) {
    LOG_INFO("Packet is {}", packet.DebugString());
    switch(packet.Packet_case()) {
    case PacketWrapper::kInvokeMethod:
        invokeMethod(packet.invokemethod());
        break;
    case PacketWrapper::kLoadObject:
        loadObject(packet.loadobject());
        break;
    case PacketWrapper::kSearchComponents:
        searchComponents(packet.searchcomponents());
        break;
    case PacketWrapper::kFindGameObject:
        findGameObjects(packet.findgameobject());
        break;
    default:
        LOG_INFO("Invalid packet type! {}", packet.Packet_case());
    }
}

void Manager::invokeMethod(const InvokeMethod& packet) {
    uint64_t id = packet.invokeuuid();
    int methodIdx = packet.methodid();

    if(methodIdx >= methods.size() || methodIdx < 0) {
        PacketWrapper wrapper;
        InvokeMethodResult& result = *wrapper.mutable_invokemethodresult();
        result.set_invokeuuid(id);
        result.set_methodid(methodIdx);
        result.set_status(InvokeMethodResult::NOT_FOUND);
        sendPacket(wrapper);
        return;
    }
    
    auto method = methods[methodIdx];
    scheduleFunction([this, packet, methodIdx, id] {
        // TODO: type checking?
        int argNum = packet.args_size();
        void* args[argNum];
        for(int i = 0; i < argNum; i++) {
            // for protobuf here, the string is effectively a pointer to the bytes
            args[i] = ReinterpretBytes<void*>(packet.args(i).data());
        }
        
        std::string err = "";
        auto res = methods[methodIdx].Run(args, err);

        PacketWrapper wrapper;
        InvokeMethodResult& result = *wrapper.mutable_invokemethodresult();
        result.set_invokeuuid(id);
        result.set_methodid(methodIdx);

        if(!err.empty()) {
            result.set_status(InvokeMethodResult::ERR);
            result.set_error(err);
            sendPacket(wrapper);
            return;
        }

        result.set_status(InvokeMethodResult::OK);
        DataMsg& data = *result.mutable_result();
        *data.mutable_typeinfo() = methods[methodIdx].ReturnTypeInfo();
        data.set_data(res.GetAsString());
        sendPacket(wrapper);
    });
}

void Manager::loadObject(const LoadObject& packet) {
    auto ptr = ReinterpretBytes<Il2CppObject*>(packet.pointer());
    setAndSendObject(ptr, packet.loadid());
}

void Manager::searchComponents(const SearchComponents& packet) {
    PacketWrapper wrapper;
    SearchComponentsResult& result = *wrapper.mutable_searchcomponentsresult();
    result.set_queryid(packet.queryid());

    std::string name = packet.componentname();
    bool searchName = name.length() > 0;

    const ClassInfoMsg& componentInfo = packet.componentclass();
    std::string namespaceName = componentInfo.namespaze();
    if(namespaceName == "Global" || namespaceName == "GlobalNamespace")
        namespaceName = "";
    auto& className = componentInfo.clazz();

    Il2CppClass* klass = il2cpp_utils::GetClassFromName(namespaceName, className);
    if(!klass) {
        LOG_INFO("Could not find class {}.{}", namespaceName, className);
        return;
    }
    // ensure class is a subclass of UnityEngine.Object
    static auto objClass = il2cpp_utils::GetClassFromName("UnityEngine", "Object");
    if(klass && !il2cpp_functions::class_is_subclass_of(klass, objClass, false)) {
        LOG_INFO("Class must be a subclass of Object to search");
        return;
    }
    
    static auto findAllMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Resources", "FindObjectsOfTypeAll", 1);
    auto objects = *il2cpp_utils::RunMethod<ArrayW<Il2CppObject*>, false>(nullptr, findAllMethod, il2cpp_utils::GetSystemType(klass));

    std::span<Il2CppObject*> res = objects.ref_to();
    std::vector<Il2CppObject*> namedObjs;
    
    static auto nameMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Object", "get_name", 0);
    if(searchName) {
        LOG_INFO("Searching for name {}", name);
        for(auto& obj : res) {
            if(*il2cpp_utils::RunMethod<StringW, false>(obj, nameMethod) == name)
                namedObjs.push_back(obj);
        }
        res = std::span<Il2CppObject*>(namedObjs);
    }

    for(auto& obj : res) {
        ComponentMsg& found = *result.add_foundcomponents();
        if(!searchName)
            name = (std::string) *il2cpp_utils::RunMethod<StringW, false>(obj, nameMethod);
        found.set_name(name);
        *found.mutable_classinfo() = GetClassInfo(il2cpp_functions::class_get_type(classofinst(obj)));
        found.set_pointer(ByteString(obj));
    }
    
    sendPacket(wrapper);
}

void Manager::findGameObjects(const FindGameObjects &packet) {
    LOG_INFO("Finding all game objects");

    auto const &name = packet.namefilter();

    static auto findAllMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Resources", "FindObjectsOfTypeAll", 1);
    static auto GameObjectKlass = il2cpp_utils::GetClassFromName("UnityEngine", "GameObject");
    static auto NameMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Object", "get_name", 0);

    scheduleFunction([this, id = packet.queryid()]() mutable
                     {
                        PacketWrapper wrapper;
                        FindGameObjectsResult &result = *wrapper.mutable_findgameobjectresult();
                        result.set_queryid(id);

                        LOG_INFO("Finding all game objects on main thread");
                         auto objects = CRASH_UNLESS(il2cpp_utils::RunMethod<ArrayW<Il2CppObject *>, false>(nullptr, findAllMethod, il2cpp_utils::GetSystemType(GameObjectKlass)));
                         LOG_INFO("Found {} objects", objects.size());
                         result.mutable_foundobjects()->Reserve(objects.size());
                         std::vector<std::string> str(objects.size());

                         for (auto const &o : objects)
                         {
                             auto name = (std::string)CRASH_UNLESS(il2cpp_utils::RunMethod<StringW, false>(o, NameMethod));
                             str.emplace_back(name);
                             result.add_foundobjects(std::move(name));
                         }

                        //  LOG_INFO("Objects: {}",str);
                         LOG_INFO("Packet wrapper" ,result.SerializeAsString());

                         SocketHandler::getCommonSocketHandler().queueWork([this, wrapper = std::move(wrapper)]()
                                                                           { sendPacket(wrapper); }); });
}
#pragma endregion
