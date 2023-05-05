#include "manager.hpp"
#include "classutils.hpp"
#include "main.hpp"
#include "mem.hpp"

#include <fmt/ranges.h>

#include "packethandlers/socketlib_handler.hpp"
#include "packethandlers/websocket_handler.hpp"

#include "UnityEngine/Transform.hpp"
#include "UnityEngine/Component.hpp"
#include "UnityEngine/Object.hpp"
#include "UnityEngine/GameObject.hpp"
#include "UnityEngine/SceneManagement/Scene.hpp"
#include "UnityEngine/Resources.hpp"

#include "sombrero/shared/linq.hpp"
#include "sombrero/shared/linq_functional.hpp"

#define MESSAGE_LOGGING

using namespace ClassUtils;
using namespace UnityEngine;
using namespace UnityEngine::SceneManagement;

Manager* Manager::GetInstance() {
    static Manager Instance = Manager();
    return &Instance;
}

void Manager::Init() {
    initialized = true;
    LOG_INFO("Starting server at port 3306");
    handler = std::make_unique<WebSocketHandler>((ReceivePacketFunc)std::bind(&Manager::processMessage, this, std::placeholders::_1));
    handler->listen(3306);
    LOG_INFO("Server fully initialized");
}

#pragma region parsing
void Manager::processMessage(const PacketWrapper& packet) {
    scheduleFunction([this, packet]{
        auto id = packet.queryresultid();
        LOG_INFO("Packet is {}", packet.DebugString());

        switch(packet.Packet_case()) {
        case PacketWrapper::kInvokeMethod:
            invokeMethod(packet.invokemethod(), id);
            break;
        case PacketWrapper::kSetField:
            setField(packet.setfield(), id);
            break;
        case PacketWrapper::kGetField:
            getField(packet.getfield(), id);
            break;
        case PacketWrapper::kSearchObjects:
            searchObjects(packet.searchobjects(), id);
            break;
        case PacketWrapper::kGetAllGameObjects:
            getAllGameObjects(packet.getallgameobjects(), id);
            break;
        case PacketWrapper::kGetGameObjectComponents:
            getGameObjectComponents(packet.getgameobjectcomponents(), id);
            break;
        case PacketWrapper::kReadMemory:
            readMemory(packet.readmemory(), id);
            break;
        case PacketWrapper::kWriteMemory:
            writeMemory(packet.writememory(), id);
            break;
        case PacketWrapper::kGetClassDetails:
            getClassDetails(packet.getclassdetails(), id);
            break;
        case PacketWrapper::kGetInstanceDetails:
            getInstanceDetails(packet.getinstancedetails(), id);
            break;
        default:
            LOG_INFO("Invalid packet type! {}", packet.Packet_case());
        }
    });
}

void Manager::setField(const SetField& packet, uint64_t queryId) {
    auto field = asPtr(FieldInfo, packet.fieldid());
    auto object = asPtr(Il2CppObject, packet.objectaddress());

    auto value = (void*) packet.value().data().data();

    FieldUtils::Set(field, object, &value);

    PacketWrapper wrapper;
    wrapper.set_queryresultid(queryId);
    SetFieldResult& result = *wrapper.mutable_setfieldresult();
    result.set_fieldid(asInt(field));

    handler->sendPacket(wrapper);
}

void Manager::getField(const GetField& packet, uint64_t queryId) {
    auto field = asPtr(FieldInfo, packet.fieldid());
    auto object = asPtr(Il2CppObject, packet.objectaddress());

    auto res = FieldUtils::Get(field, object);

    PacketWrapper wrapper;
    wrapper.set_queryresultid(queryId);
    GetFieldResult& result = *wrapper.mutable_getfieldresult();
    result.set_fieldid(asInt(field));

    ProtoDataPayload& data = *result.mutable_value();
    *data.mutable_typeinfo() = ClassUtils::GetTypeInfo(field->type);
    if(field->type->type == IL2CPP_TYPE_STRING)
        data.mutable_typeinfo()->set_size(res.GetAsBytes().size());
    if(res.HasValue())
        data.set_data(res.GetAsString());

    handler->sendPacket(wrapper);
}

void Manager::invokeMethod(const InvokeMethod& packet, uint64_t queryId) {
    auto method = asPtr(MethodInfo, packet.methodid());
    auto object = asPtr(Il2CppObject, packet.objectaddress());

    // TODO: type checking?
    int argNum = packet.args_size();
    void* args[argNum];
    for(int i = 0; i < argNum; i++) {
        // for protobuf here, the string is effectively a pointer to the bytes
        args[i] = (void*) packet.args(i).data().data();
    }

    std::string err = "";
    auto res = MethodUtils::Run(method, object, args, err);

    PacketWrapper wrapper;
    wrapper.set_queryresultid(queryId);
    InvokeMethodResult& result = *wrapper.mutable_invokemethodresult();
    result.set_methodid(asInt(method));

    if(!err.empty()) {
        result.set_status(InvokeMethodResult::ERR);
        result.set_error(err);
        handler->sendPacket(wrapper);
        return;
    }

    result.set_status(InvokeMethodResult::OK);
    ProtoDataPayload& data = *result.mutable_result();
    *data.mutable_typeinfo() = ClassUtils::GetTypeInfo(method->return_type);
    if(method->return_type->type == IL2CPP_TYPE_STRING)
        data.mutable_typeinfo()->set_size(res.GetAsBytes().size());
    if(res.HasValue())
        data.set_data(res.GetAsString());
    handler->sendPacket(wrapper);
}

ProtoScene ReadScene(Scene obj) {
    ProtoScene protoObj;
    protoObj.set_handle(obj.m_Handle);
    protoObj.set_name(obj.get_name());
    protoObj.set_isloaded(obj.get_isLoaded());
    return protoObj;
}

ProtoTransform ReadTransform(Transform* obj) {
    ProtoTransform protoObj;
    protoObj.set_address(asInt(obj));
    protoObj.set_name(obj->get_name());

    protoObj.set_childcount(obj->get_childCount());
    protoObj.set_parent(asInt(obj->GetParent()));
    return protoObj;
}

ProtoGameObject ReadGameObject(GameObject* obj) {
    ProtoGameObject protoObj;
    protoObj.set_address(asInt(obj));
    protoObj.set_name(obj->get_name());

    protoObj.set_active(obj->get_active());
    protoObj.set_layer(obj->get_layer());
    if(obj->get_scene().IsValid())
        *protoObj.mutable_scene() = ReadScene(obj->get_scene());
    protoObj.set_tag(obj->get_tag());
    *protoObj.mutable_transform() = ReadTransform(obj->get_transform());
    return protoObj;
}

void Manager::searchObjects(const SearchObjects& packet, uint64_t id) {
    PacketWrapper wrapper;
    SearchObjectsResult& result = *wrapper.mutable_searchobjectsresult();
    wrapper.set_queryresultid(id);

    std::string name = packet.name();
    bool searchName = name.length() > 0;

    const ProtoClassInfo& componentInfo = packet.componentclass();
    std::string namespaceName = componentInfo.namespaze();
    if(namespaceName == "Global" || namespaceName == "GlobalNamespace")
        namespaceName = "";
    auto const& className = componentInfo.clazz();

    Il2CppClass* klass = il2cpp_utils::GetClassFromName(namespaceName, className);
    if(!klass) {
        LOG_INFO("Could not find class {}.{}", namespaceName, className);
        return;
    }

    auto objects = Resources::FindObjectsOfTypeAll(il2cpp_utils::GetSystemType(klass));

    std::span<Object*> res = objects.ref_to();
    std::vector<Object*> namedObjs;

    if(searchName) {
        LOG_INFO("Searching for name {}", name);
        for(auto const& obj : res) {
            if(obj->get_name() == name)
                namedObjs.push_back(obj);
        }
        res = std::span<Object*>(namedObjs);
    }

    for(auto const& obj : res) {
        ProtoObject& found = *result.add_objects();
        if(!searchName)
            name = obj->get_name().operator std::string();
        found.set_address(asInt(obj));
        found.set_name(name);
        *found.mutable_classinfo() = GetClassInfo(classofinst(obj));
    }

    handler->sendPacket(wrapper);
}

void Manager::getAllGameObjects(const GetAllGameObjects& packet, uint64_t id) {
    PacketWrapper wrapper;
    GetAllGameObjectsResult& result = *wrapper.mutable_getallgameobjectsresult();
    wrapper.set_queryresultid(id);
    auto objects = Resources::FindObjectsOfTypeAll<GameObject*>();
    result.mutable_objects()->Reserve(objects.Length());
    LOG_INFO("found {} game objects", objects.Length());
    for (const auto& obj : objects) {
        *result.add_objects() = ReadGameObject(obj);
    }
    handler->sendPacket(wrapper);
}

void Manager::getGameObjectComponents(const GetGameObjectComponents& packet, uint64_t id) {
    PacketWrapper wrapper;
    GetGameObjectComponentsResult& result = *wrapper.mutable_getgameobjectcomponentsresult();
    wrapper.set_queryresultid(id);

    for (const auto comp : reinterpret_cast<GameObject*>(packet.address())->GetComponents<Component*>()) {
        ProtoComponent& found = *result.add_components();

        found.set_address(asInt(comp));
        found.set_name(comp->get_name());
        *found.mutable_classinfo() = GetClassInfo(classofinst(comp));
    }

    handler->sendPacket(wrapper);
}

void Manager::readMemory(const ReadMemory& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);
    ReadMemoryResult& result = *wrapper.mutable_readmemoryresult();
    result.set_address(packet.address());
    auto src = reinterpret_cast<void*>(packet.address());
    auto size = packet.size();
    if(mem::protect(src, size, mem::protection::read_write_execute)) {
        result.set_status(ReadMemoryResult_Status::ReadMemoryResult_Status_ERR);
    } else {
        result.set_status(ReadMemoryResult_Status::ReadMemoryResult_Status_OK);
        result.set_data(src, size);
    }
    LOG_INFO("Result is {}", wrapper.DebugString());
    handler->sendPacket(wrapper);
}

void Manager::writeMemory(const WriteMemory& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);
    WriteMemoryResult& result = *wrapper.mutable_writememoryresult();
    result.set_address(packet.address());
    auto dst = reinterpret_cast<void*>(packet.address());
    auto src = packet.data().data();
    auto size = packet.data().size();
    if(mem::protect(dst, size, mem::protection::read_write_execute)) {
        result.set_status(WriteMemoryResult_Status::WriteMemoryResult_Status_ERR);
    } else {
        result.set_status(WriteMemoryResult_Status::WriteMemoryResult_Status_OK);
        result.set_size(size);
        memcpy(dst, src, size);
    }
    LOG_INFO("Result is {}", wrapper.DebugString());
    handler->sendPacket(wrapper);
}

ProtoClassDetails getClassDetails_internal(Il2CppClass* clazz) {
    ProtoClassDetails ret;

    auto currentClass = clazz;
    auto currentClassProto = &ret;

    // Use a while loop instead of recursive
    // method to improve stack allocations
    while (currentClass != nullptr) {
        LOG_INFO("Finding class details for {}::{}", il2cpp_functions::class_get_namespace(currentClass), il2cpp_functions::class_get_name(currentClass));
        *currentClassProto->mutable_clazz() = ClassUtils::GetClassInfo(currentClass);

        for (auto f : ClassUtils::GetFields(currentClass))
            *currentClassProto->add_fields() = FieldUtils::GetFieldInfo(f);

        std::set<const MethodInfo*> propertyMethods = {};
        for (auto p : ClassUtils::GetProperties(currentClass)) {
            propertyMethods.insert(p->get);
            propertyMethods.insert(p->set);
            *currentClassProto->add_properties() = MethodUtils::GetPropertyInfo(p);
        }

        for (const auto& m : ClassUtils::GetMethods(currentClass)) {
            if(propertyMethods.find(m) != propertyMethods.end()) continue;
            *currentClassProto->add_methods() = MethodUtils::GetMethodInfo(m);
        }

        for (auto i : ClassUtils::GetInterfaces(currentClass))
            *currentClassProto->add_interfaces() = ClassUtils::GetClassInfo(i);

        currentClass = ClassUtils::GetParent(currentClass);
        if (currentClass)
            currentClassProto = currentClassProto->mutable_parent();
    }

    return ret;
}

// TODO: generics
void Manager::getClassDetails(const GetClassDetails& packet, uint64_t id) {
    using namespace Sombrero;

    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto result = wrapper.mutable_getclassdetailsresult();

    const auto& classInfo = packet.classinfo();
    auto clazz = il2cpp_utils::GetClassFromName(classInfo.namespaze(), classInfo.clazz());

    if (!clazz) {
        LOG_INFO("Could not find class {}::{}", classInfo.namespaze(), classInfo.clazz());
        handler->sendPacket(wrapper);
        return;
    }

    *result->mutable_classdetails() = getClassDetails_internal(clazz);

    handler->sendPacket(wrapper);
}

void Manager::getInstanceDetails(const GetInstanceDetails& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto result = wrapper.mutable_getinstancedetailsresult();

    auto instance = asPtr(Il2CppObject, packet.address());
    *result->mutable_classdetails() = getClassDetails_internal(instance->klass);

    // TODO: field / property values

    handler->sendPacket(wrapper);
}

#pragma endregion
