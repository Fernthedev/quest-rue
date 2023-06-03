#include "manager.hpp"
#include "classutils.hpp"
#include "unity.hpp"
#include "mem.hpp"

#include <fmt/ranges.h>

#include "packethandlers/socketlib_handler.hpp"
#include "packethandlers/websocket_handler.hpp"

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

bool Manager::tryValidatePtr(const void* ptr) {
    if(asInt(ptr) <= 0 || asInt(ptr) > UINTPTR_MAX) {
        LOG_INFO("invalid ptr was {}", fmt::ptr(ptr));
        return false;
    }
    return true;
}

#pragma region parsing
void Manager::processMessage(const PacketWrapper& packet) {
    scheduleFunction([this, packet]{
        auto id = packet.queryresultid();
        LOG_INFO("Processing packet type {}", packet.Packet_case());
        LOG_DEBUG("Packet is {}", packet.DebugString());

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
        case PacketWrapper::kGetInstanceClass:
            getInstanceClass(packet.getinstanceclass(), id);
            break;
        case PacketWrapper::kGetInstanceDetails:
            getInstanceDetails(packet.getinstancedetails(), id);
            break;
        default:
            LOG_INFO("Invalid packet type!");
        }
    });
}

void Manager::setField(const SetField& packet, uint64_t queryId) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(queryId);

    auto field = asPtr(FieldInfo, packet.fieldid());
    auto object = asPtr(Il2CppObject, packet.objectaddress());

    if(!tryValidatePtr(field))
        LOG_INFO("field info pointer was invalid");
    else if(!tryValidatePtr(object))
        LOG_INFO("instance pointer was invalid");
    else {
        FieldUtils::Set(field, object, packet.value());

        SetFieldResult& result = *wrapper.mutable_setfieldresult();
        result.set_fieldid(asInt(field));
    }
    handler->sendPacket(wrapper);
}

void Manager::getField(const GetField& packet, uint64_t queryId) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(queryId);

    auto field = asPtr(FieldInfo, packet.fieldid());
    auto object = asPtr(Il2CppObject, packet.objectaddress());

    if(!tryValidatePtr(field))
        LOG_INFO("field info pointer was invalid");
    else if(!tryValidatePtr(object))
        LOG_INFO("instance pointer was invalid");
    else {
        LOG_INFO("Getting field {} ({}) for object {} ({})", fmt::ptr(field), packet.fieldid(),
                fmt::ptr(object), packet.objectaddress());

        auto res = FieldUtils::Get(field, object);

        GetFieldResult& result = *wrapper.mutable_getfieldresult();
        result.set_fieldid(asInt(field));

        *result.mutable_value() = res;
    }
    handler->sendPacket(wrapper);
}

void Manager::invokeMethod(const InvokeMethod& packet, uint64_t queryId) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(queryId);

    auto method = asPtr(const MethodInfo, packet.methodid());
    auto object = asPtr(Il2CppObject, packet.objectaddress());

    if(!tryValidatePtr(method))
        LOG_INFO("method info pointer was invalid");
    else if(!tryValidatePtr(object))
        LOG_INFO("instance pointer was invalid");
    else {
        bool validGenerics = true;
        if(int size = packet.generics_size()) {
            std::vector<Il2CppClass*> generics{};
            for(int i = 0; i < size; i++) {
                auto clazz = GetClass(packet.generics(i));
                if(!clazz) {
                    validGenerics = false;
                    break;
                } else
                    generics.push_back(clazz);
            }
            if(validGenerics)
                method = il2cpp_utils::MakeGenericMethod(method, generics);
        }
        if(validGenerics) {
            std::vector<ProtoDataPayload> args{};
            for(int i = 0; i < packet.args_size(); i++)
                args.emplace_back(packet.args(i));

            std::string err = "";
            auto res = MethodUtils::Run(method, object, args, err);

            InvokeMethodResult& result = *wrapper.mutable_invokemethodresult();
            result.set_methodid(asInt(method));

            if(!err.empty()) {
                result.set_status(InvokeMethodResult::ERR);
                result.set_error(err);
                handler->sendPacket(wrapper);
                return;
            }

            result.set_status(InvokeMethodResult::OK);
            *result.mutable_result() = res;
        }
    }
    handler->sendPacket(wrapper);
}

void Manager::searchObjects(const SearchObjects& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    std::string name = packet.has_name() ? packet.name() : "";

    Il2CppClass* klass = GetClass(packet.componentclass());
    if(!klass) {
        LOG_INFO("Could not find class {}", packet.componentclass().DebugString());
        handler->sendPacket(wrapper);
        return;
    }

    *wrapper.mutable_searchobjectsresult() = FindObjects(klass, name);

    handler->sendPacket(wrapper);
}

void Manager::getAllGameObjects(const GetAllGameObjects& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    *wrapper.mutable_getallgameobjectsresult() = FindAllGameObjects();

    handler->sendPacket(wrapper);
}

void Manager::getGameObjectComponents(const GetGameObjectComponents& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto gameObject = asPtr(UnityEngine::GameObject, packet.address());

    if(!tryValidatePtr(gameObject))
        LOG_INFO("gameObject pointer was invalid");
    else
        *wrapper.mutable_getgameobjectcomponentsresult() = GetComponents(gameObject);

    handler->sendPacket(wrapper);
}

void Manager::readMemory(const ReadMemory& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto src = asPtr(void, packet.address());

    if(!tryValidatePtr(src))
        LOG_INFO("src pointer was invalid");
    else {
        ReadMemoryResult& result = *wrapper.mutable_readmemoryresult();
        result.set_address(packet.address());

        auto size = packet.size();
        if(mem::protect(src, size, mem::protection::read_write_execute)) {
            result.set_status(ReadMemoryResult_Status::ReadMemoryResult_Status_ERR);
        } else {
            result.set_status(ReadMemoryResult_Status::ReadMemoryResult_Status_OK);
            result.set_data(src, size);
        }
        LOG_INFO("Result is {}", wrapper.DebugString());
    }
    handler->sendPacket(wrapper);
}

void Manager::writeMemory(const WriteMemory& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto dst = asPtr(void, packet.address());

    if(!tryValidatePtr(dst))
        LOG_INFO("dst pointer was invalid");
    else {
        WriteMemoryResult& result = *wrapper.mutable_writememoryresult();
        result.set_address(packet.address());

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
    }
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
        *currentClassProto->mutable_clazz() = ClassUtils::GetClassInfo(typeofclass(currentClass));

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
            *currentClassProto->add_interfaces() = ClassUtils::GetClassInfo(typeofclass(i));

        currentClass = ClassUtils::GetParent(currentClass);
        if (currentClass)
            currentClassProto = currentClassProto->mutable_parent();
    }

    return ret;
}

// TODO: generics
void Manager::getClassDetails(const GetClassDetails& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto result = wrapper.mutable_getclassdetailsresult();

    Il2CppClass* klass = GetClass(packet.classinfo());
    if(!klass) {
        LOG_INFO("Could not find class {}", packet.classinfo().DebugString());
        handler->sendPacket(wrapper);
        return;
    }

    *result->mutable_classdetails() = getClassDetails_internal(klass);

    handler->sendPacket(wrapper);
}

void Manager::getInstanceClass(const GetInstanceClass& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto instance = asPtr(Il2CppObject, packet.address());

    if(!tryValidatePtr(instance))
        LOG_INFO("instance pointer was invalid");
    else {
        auto result = wrapper.mutable_getinstanceclassresult();
        *result->mutable_classinfo() = GetClassInfo(typeofinst(instance));
    }

    handler->sendPacket(wrapper);
}

void Manager::getInstanceDetails(const GetInstanceDetails& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    LOG_INFO("Requesting object {}", packet.address());
    auto instance = asPtr(Il2CppObject, packet.address());

    if(!tryValidatePtr(instance))
        LOG_INFO("instance pointer was invalid");
    else {
        auto result = wrapper.mutable_getinstancedetailsresult();
        *result->mutable_classdetails() = getClassDetails_internal(instance->klass);
    }
    // TODO: field / property values

    handler->sendPacket(wrapper);
}

#pragma endregion
