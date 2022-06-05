#include "manager.hpp"
#include "classutils.hpp"
#include "main.hpp"

#define MESSAGE_LOGGING

using namespace SocketLib;
using namespace ClassUtils;

template<class T>
inline T& ReinterpretBytes(std::string_view bytes) {
    return *(T*) bytes.data();
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

    std::span<const byte> receivedBytes = message.toSpan();
    auto &pendingPacket = channelIncomingQueue.at(&client);

    // start of a new packet
    if (!pendingPacket.isValid())
    {
        // get the first 8 bytes, then cast to size_t
        size_t expectedLength = *receivedBytes.first(sizeof(size_t)).data();

        pendingPacket = {expectedLength};

        auto subspanData = receivedBytes.subspan(sizeof(size_t));
        pendingPacket.data << subspanData.data();
        pendingPacket.currentLength += subspanData.size();
        // continue appending to existing packet
    }
    else
    {
        pendingPacket.data << receivedBytes.data();
        pendingPacket.currentLength += receivedBytes.size();
    }

    if (pendingPacket.currentLength < pendingPacket.expectedLength)
    {
        return;
    }

    auto stream = std::move(pendingPacket.data); // avoid copying
    auto finalMessage = stream.str();
    auto packetBytes = finalMessage.substr(0, pendingPacket.expectedLength);


    if (pendingPacket.currentLength > pendingPacket.expectedLength) {
        std::string_view excessData = ((std::string_view)finalMessage).substr(pendingPacket.expectedLength);
        // get the first 8 bytes, then cast to size_t
        size_t expectedLength = *reinterpret_cast<size_t const*>(excessData.data());

        pendingPacket = IncomingPacket(expectedLength); // reset with excess data

        auto excessDataWithoutSize = excessData.substr(sizeof(size_t));

        pendingPacket.data
            << excessDataWithoutSize; // insert excess data, ignoring the size prefix
        pendingPacket.currentLength += excessDataWithoutSize.size();
    } else {
        pendingPacket = IncomingPacket(); // reset 
    }

#ifdef MESSAGE_LOGGING
    LOG_INFO("Received: {}", finalMessage);
#endif

    

    PacketWrapper packet;
    packet.ParseFromString(packetBytes);
    processMessage(packet);

    // Parse the next packet as it is ready
    if (pendingPacket.isValid() && pendingPacket.currentLength >= pendingPacket.expectedLength)
    {
        listenOnEvents(client, Message(""));
    }
}

void Manager::sendPacket(const PacketWrapper& packet) {
    for (auto const& [id, client] : serverSocket->getClients()) {
        // send size header
        size_t size = packet.ByteSizeLong();
        client->queueWrite(Message((byte*) &size, sizeof(size_t)));
        // send message with that size
        byte bytes[size];
        packet.SerializeToArray(bytes, size);
        client->queueWrite(Message(bytes, size));
    }
}

#pragma region sending
void Manager::setAndSendObject(Il2CppObject* obj, uint64_t id) {
    if(serverSocket->getClients().empty()) return;
    if(!obj) return;

    object = obj;
    methods.clear();

    PacketWrapper packet;
    LoadObjectResult& result = *packet.mutable_loadobjectresult();
    result.set_loadid(id);
    TypeDetailsMsg* packetObject = result.mutable_object();
    
    auto* klass = classofinst(object);

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
    switch(packet.Packet_case()) {
    case PacketWrapper::kInvokeMethod:
        invokeMethod(packet.invokemethod());
    case PacketWrapper::kLoadObject:
        loadObject(packet.loadobject());
    case PacketWrapper::kSearchObjects:
        searchObjects(packet.searchobjects());
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

void Manager::searchObjects(const SearchObjects& packet) {
    LOG_INFO("yeah I'm definitely searching for objects rn. just a few months more to finish...");
    PacketWrapper wrapper;
    SearchObjectsResult& result = *wrapper.mutable_searchobjectsresult();
    result.set_queryid(packet.queryid());
    sendPacket(wrapper);
}

// TODO: fix up for protobuf
// void Manager::processFind(std::string command) {
//     #ifdef MESSAGE_LOGGING
//     LOG_INFO("Find: %s", sanitizeString(command).c_str());
//     #endif
//     try {
//         // get args
//         auto args = parse(command, "\n\n\n\n");
//         bool nameSearch = std::stoi(args[0]);
//         std::string name = args[1];
//         std::string namespaceName = args[2];
//         std::string className = args[3];
//         // find class if provided
//         Il2CppClass* klass = nullptr;
//         static auto objClass = il2cpp_utils::GetClassFromName("UnityEngine", "Object");
//         // account for global/unnamed namespace
//         if(namespaceName == " " || namespaceName == "Global" || namespaceName == "GlobalNamespace")
//             namespaceName = "";
//         if(className != " ") {
//             klass = il2cpp_utils::GetClassFromName(namespaceName, className);
//             if(!klass) {
//                 LOG_INFO("Could not find class %s.%s", namespaceName.c_str(), className.c_str());
//             }
//             // ensure class is a subclass of UnityEngine.Object
//             if(klass && !il2cpp_functions::class_is_subclass_of(klass, objClass, false)) {
//                 LOG_INFO("Class must be a subclass of Object to search");
//                 return;
//             }
//         }
//         if(!klass)
//             klass = objClass;
//         // get all objects of its class
//         static auto findAllMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Resources", "FindObjectsOfTypeAll", 1);
//         auto objects = unwrap_optionals(il2cpp_utils::RunMethod<ArrayW<Il2CppObject*>, false>(nullptr, findAllMethod, il2cpp_utils::GetSystemType(klass)));
//         // do search or return first object
//         if(nameSearch && name != " ") {
//             LOG_INFO("name");
//             auto nameMethod = il2cpp_functions::class_get_method_from_name(klass, "get_name", 0);
//             if(!nameMethod) {
//                 LOG_INFO("Class must have a get_name() method to search by name");
//                 return;
//             }
//             auto obj = objects.FirstOrDefault([&name, &nameMethod](auto x) {
//                 return unwrap_optionals(il2cpp_utils::RunMethod<StringW, false>(x, nameMethod)) == name;
//             });
//             if(!obj) {
//                 LOG_INFO("Could not find object with name '%s'", name.c_str());
//                 return;
//             }
//             SetObject(obj);
//             return;
//         } else {
//             if(objects.Length() > 0)
//                 SetObject(objects[0]);
//             else
//                 LOG_INFO("No objects found");
//             return;
//         }
//     } catch(...) {
//         LOG_INFO("Could not parse find command");
//     }
// }
#pragma endregion
