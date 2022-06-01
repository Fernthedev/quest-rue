#include "manager.hpp"
#include "classutils.hpp"
#include "main.hpp"

#define MESSAGE_LOGGING

using namespace SocketLib;
using namespace ClassUtils;

template<class T>
inline T& ReinterpretBytes(const std::string& bytes) {
    return *(T*) bytes.c_str();
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
    
    serverSocket.connectCallback += [this](Channel& client, bool connected){
        connectEvent(client, connected);
    };

    serverSocket.listenCallback += [this](Channel& client, const Message& message){
        listenOnEvents(client, message);
    };

    LOG_INFO("Server fully initialized");
}

void Manager::SetObject(Il2CppObject* obj) {
    setAndSendObject(obj, 0);
}

void Manager::connectEvent(Channel& channel, bool connected) {
    LOG_INFO("Connected %i status: %s", channel.clientDescriptor, connected ? "connected" : "disconnected");
    this->connected = connected;
    client = &channel;

    if(!connected)
        client = nullptr;
}

void Manager::listenOnEvents(Channel& client, const Message& message) {
    processBytes(message.toSpan());
}

void Manager::sendPacket(const PacketWrapper& packet) {
    if(!connected) return;
    
    // send size header
    size_t size = packet.ByteSizeLong();
    client->queueWrite(Message((byte*) &size, sizeof(size_t)));
    // send message with that size
    byte bytes[size];
    packet.SerializeToArray(bytes, size);
    client->queueWrite(Message(bytes, size));
}

#pragma region sending
void Manager::setAndSendObject(Il2CppObject* obj, uint64_t id) {
    if(!connected) return;
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

        for(auto& iKlass : GetInterfaces(klass))
            *packetObject->add_interfaces() = GetClassInfo(il2cpp_functions::class_get_type(iKlass));

        for(auto& fieldInfo : GetFields(klass)) {
            methods.emplace_back(Method(object, fieldInfo, false));
            methods.emplace_back(Method(object, fieldInfo, true));

            auto& fakeMethodSet = methods.back();
            *packetObject->add_fields() = fakeMethodSet.GetFieldInfo(methods.size() - 2);
        }

        // all property get/set methods are contained in the methods
        // TODO: get the properties and match them to their methods somehow
        for(auto& methodInfo : GetMethods(klass)) {
            methods.emplace_back(Method(object, methodInfo));

            auto& method = methods.back();
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
void Manager::processBytes(std::span<const byte> bytes) {

    // if there is header length left:
    //   if the packet is longer:
    //     fill the rest of the header
    //     remove removed bytes from the packet
    //     set message length left to the header
    //     set header length left to 0
    //   else:
    //     add whole packet to header
    //     update header length left
    //     return
    // if there is message length left:
    //   if the packet is longer:
    //     fill the rest of the message
    //     remove removed bytes from the packet
    //     set header length left to 4
    //     process message
    //     call again with remaining packet
    //   else:
    //     add whole packet to message
    //     update message length left
    //     return

    auto headerRemaining = header.GetRemaining();
    if(headerRemaining > 0) {
        header.AddBytes(bytes.data());
        if(int* len = header.Resolve<int>()) {
            bytes = bytes.subspan(headerRemaining);
            packetBytes.Init(*len);
        } else
            return;
    }
    auto packetRemaining = packetBytes.GetRemaining();
    if(packetRemaining > 0) {
        packetBytes.AddBytes(bytes.data());
        if(std::byte** pkt = packetBytes.Resolve<std::byte*>()) {
            bytes = bytes.subspan(packetRemaining);
            PacketWrapper packet;
            packet.ParseFromArray(*pkt, packetBytes.GetSize());
            processMessage(packet);
            header.Clear();
            if(!bytes.empty())
                processBytes(bytes);
        }
    }
}

void Manager::processMessage(const PacketWrapper& packet) {
    switch(packet.Packet_case()) {
    case PacketWrapper::kInvokeMethod:
        invokeMethod(packet.invokemethod());
    case PacketWrapper::kLoadObject:
        loadObject(packet.loadobject());
    case PacketWrapper::kSearchObjects:
        searchObjects(packet.searchobjects());
    default:
        LOG_INFO("Invalid packet type! %i", packet.Packet_case());
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
