#include "manager.hpp"

#include <fmt/ranges.h>

#include "CameraController.hpp"
#include "MainThreadRunner.hpp"
#include "UnityEngine/Transform.hpp"
#include "classutils.hpp"
#include "main.hpp"
#include "mem.hpp"
#include "methods.hpp"
#include "packethandlers/websocket_handler.hpp"
#include "sombrero/shared/linq.hpp"
#include "sombrero/shared/linq_functional.hpp"
#include "unity.hpp"

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
    handler = std::make_unique<WebSocketHandler>((ReceivePacketFunc) std::bind(&Manager::processMessage, this, std::placeholders::_1));
    handler->listen(3306);
    LOG_INFO("Server fully initialized");

    // Logger sink
    // TODO: Make this a queue and flush
    Paper::Logger::AddLogSink([this](Paper::LogData const& data, std::string_view fmtMessage, std::string_view originalString) {
        if (!sendLoggerUpdates)
            return;

        PacketWrapper wrapper;
        wrapper.set_queryresultid(-1);

        auto& loggerUpdate = *wrapper.mutable_responseloggerupdate();

        auto* log = loggerUpdate.add_paperlogs();
        log->set_str(fmtMessage.data(), fmtMessage.length());
        log->set_threadid(((uint64_t*) (&data.threadId))[0]);
        log->set_tag(data.tag);
        auto filename = data.loc.file_name();
        log->set_filename(filename.data(), filename.length());
        auto fname = data.loc.function_name();
        log->set_functionname(fname.data(), fname.length());
        log->set_fileline(data.loc.line());
        log->mutable_logtime()->set_nanos(std::chrono::duration_cast<std::chrono::nanoseconds>(data.logTime.time_since_epoch()).count());

        handler->sendPacket(wrapper);
    });
}

bool Manager::tryValidatePtr(void const* ptr) {
    if (asInt(ptr) <= 0 || asInt(ptr) > UINTPTR_MAX) {
        LOG_INFO("invalid ptr was {}", fmt::ptr(ptr));
        return false;
    }
    return true;
}

#pragma region parsing
void Manager::processMessage(PacketWrapper const& packet) {
    scheduleFunction([this, packet] {
        auto id = packet.queryresultid();
        LOG_INFO("Processing packet type {}", (int) packet.Packet_case());
        LOG_DEBUG("Packet is {}", packet.DebugString());

        switch (packet.Packet_case()) {
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
            case PacketWrapper::kGetInstanceValues:
                getInstanceValues(packet.getinstancevalues(), id);
                break;
            case PacketWrapper::kGetInstanceDetails:
                getInstanceDetails(packet.getinstancedetails(), id);
                break;
            case PacketWrapper::kCreateGameObject:
                createGameObject(packet.creategameobject(), id);
                break;
            case PacketWrapper::kAddSafePtrAddress:
                addSafePtrAddress(packet.addsafeptraddress(), id);
                break;
            case PacketWrapper::kGetSafePtrAddresses:
                sendSafePtrList(id);
                break;
            case PacketWrapper::kRequestLogger:
                setLoggerListener(packet.requestlogger(), id);
                break;
            case PacketWrapper::kGetCameraHovered:
                getHoveredObject(packet.getcamerahovered(), id);
                break;
            default:
                LOG_INFO("Invalid packet type!");
        }
    });
}

#define INPUT_ERROR(...)                              \
{                                                     \
    LOG_INFO(__VA_ARGS__);                            \
    wrapper.set_inputerror(fmt::format(__VA_ARGS__)); \
}

void Manager::setField(SetField const& packet, uint64_t queryId) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(queryId);

    auto field = asPtr(FieldInfo, packet.fieldid());

    if (!tryValidatePtr(field))
        INPUT_ERROR("field info pointer was invalid")
    else if (GetIsLiteral(field))
        INPUT_ERROR("literal fields cannot be set")
    else {
        FieldUtils::Set(field, packet.inst(), packet.value());

        SetFieldResult& result = *wrapper.mutable_setfieldresult();
        result.set_fieldid(asInt(field));
    }
    handler->sendPacket(wrapper);
}

void Manager::getField(GetField const& packet, uint64_t queryId) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(queryId);

    auto field = asPtr(FieldInfo, packet.fieldid());

    if (!tryValidatePtr(field))
        INPUT_ERROR("field info pointer was invalid")
    else {
        LOG_DEBUG("Getting field {}", packet.fieldid());

        auto res = FieldUtils::Get(field, packet.inst());

        GetFieldResult& result = *wrapper.mutable_getfieldresult();
        result.set_fieldid(asInt(field));

        *result.mutable_value() = res;
    }
    handler->sendPacket(wrapper);
}

void Manager::invokeMethod(InvokeMethod const& packet, uint64_t queryId) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(queryId);

    auto method = asPtr(MethodInfo const, packet.methodid());

    if (!tryValidatePtr(method))
        INPUT_ERROR("method info pointer was invalid")
    else {
        bool validGenerics = true;
        if (int size = packet.generics_size()) {
            std::vector<Il2CppClass*> generics{};
            for (int i = 0; i < size; i++) {
                auto clazz = GetClass(packet.generics(i));
                if (!clazz) {
                    INPUT_ERROR("generic {} was invalid", packet.generics(i).ShortDebugString())
                    validGenerics = false;
                    break;
                } else
                    generics.push_back(clazz);
            }
            if (validGenerics)
                method = il2cpp_utils::MakeGenericMethod(method, generics);
        }
        if (validGenerics) {
            std::vector<ProtoDataPayload> args{};
            for (int i = 0; i < packet.args_size(); i++)
                args.emplace_back(packet.args(i));

            std::string err = "";
            auto res = MethodUtils::Run(method, packet.inst(), args, err);

            InvokeMethodResult& result = *wrapper.mutable_invokemethodresult();
            result.set_methodid(asInt(method));

            if (!err.empty()) {
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

void Manager::searchObjects(SearchObjects const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    std::string name = packet.has_name() ? packet.name() : "";

    Il2CppClass* klass = GetClass(packet.componentclass());
    if (!klass) {
        INPUT_ERROR("Could not find class {}", packet.componentclass().DebugString())
        handler->sendPacket(wrapper);
        return;
    }

    *wrapper.mutable_searchobjectsresult() = FindObjects(klass, name);

    handler->sendPacket(wrapper);
}

void Manager::getAllGameObjects(GetAllGameObjects const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    *wrapper.mutable_getallgameobjectsresult() = FindAllGameObjects();

    handler->sendPacket(wrapper);
}

void Manager::getGameObjectComponents(GetGameObjectComponents const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto gameObject = asPtr(UnityEngine::GameObject, packet.address());

    if (!tryValidatePtr(gameObject))
        INPUT_ERROR("gameObject pointer was invalid")
    else
        *wrapper.mutable_getgameobjectcomponentsresult() = GetComponents(gameObject);

    handler->sendPacket(wrapper);
}

void Manager::createGameObject(CreateGameObject const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto go = GameObject::New_ctor(packet.name());
    auto parent = packet.has_parent() ? asPtr(UnityEngine::GameObject, packet.parent()) : nullptr;

    if (packet.has_parent() && !tryValidatePtr(parent))
        INPUT_ERROR("parent pointer was invalid")
    else {
        if (packet.has_parent())
            go->get_transform()->SetParent(parent->get_transform());
        *wrapper.mutable_creategameobjectresult() = CreateGameObjectResult{};
    }
    handler->sendPacket(wrapper);
}

void Manager::readMemory(ReadMemory const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto src = asPtr(void, packet.address());

    if (!tryValidatePtr(src))
        INPUT_ERROR("src pointer was invalid")
    else {
        ReadMemoryResult& result = *wrapper.mutable_readmemoryresult();
        result.set_address(packet.address());

        auto size = packet.size();
        if (mem::protect(src, size, mem::protection::read_write_execute)) {
            result.set_status(ReadMemoryResult_Status::ReadMemoryResult_Status_ERR);
        } else {
            result.set_status(ReadMemoryResult_Status::ReadMemoryResult_Status_OK);
            result.set_data(src, size);
        }
        LOG_INFO("Result is {}", wrapper.DebugString());
    }
    handler->sendPacket(wrapper);
}

void Manager::writeMemory(WriteMemory const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto dst = asPtr(void, packet.address());

    if (!tryValidatePtr(dst))
        INPUT_ERROR("dst pointer was invalid")
    else {
        WriteMemoryResult& result = *wrapper.mutable_writememoryresult();
        result.set_address(packet.address());

        auto src = packet.data().data();
        auto size = packet.data().size();
        if (mem::protect(dst, size, mem::protection::read_write_execute)) {
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

std::unordered_map<Il2CppClass const*, ProtoClassDetails> cachedClasses;

ProtoClassDetails getClassDetails_internal(Il2CppClass* clazz) {
    if (clazz == nullptr)
        return ProtoClassDetails();  // don't add to cache

    auto cached = cachedClasses.find(clazz);
    if (cached != cachedClasses.end()) {
        LOG_INFO("Returning cached details for {}::{}", il2cpp_functions::class_get_namespace(clazz), il2cpp_functions::class_get_name(clazz));
        return cached->second;
    }

    ProtoClassDetails ret;

    auto const* currentClass = clazz;
    auto currentClassProto = &ret;

    // Use a while loop instead of recursive
    // method to improve stack allocations
    while (currentClass != nullptr) {
        LOG_INFO(
            "Finding class details for {}::{}", il2cpp_functions::class_get_namespace(currentClass), il2cpp_functions::class_get_name(currentClass)
        );
        *currentClassProto->mutable_clazz() = GetClassInfo(typeofclass(currentClass));

        for (auto f : GetFields(currentClass)) {
            if (GetIsStatic(f))
                *currentClassProto->add_staticfields() = FieldUtils::GetFieldInfo(f);
            else
                *currentClassProto->add_fields() = FieldUtils::GetFieldInfo(f);
        }

        std::set<MethodInfo const*> propertyMethods = {};
        for (auto p : GetProperties(currentClass)) {
            propertyMethods.insert(p->get);
            propertyMethods.insert(p->set);
            if (GetIsStatic(p))
                *currentClassProto->add_staticproperties() = MethodUtils::GetPropertyInfo(p);
            else
                *currentClassProto->add_properties() = MethodUtils::GetPropertyInfo(p);
        }

        for (auto const& m : GetMethods(currentClass)) {
            if (propertyMethods.find(m) != propertyMethods.end())
                continue;
            if (GetIsStatic(m))
                *currentClassProto->add_staticmethods() = MethodUtils::GetMethodInfo(m);
            else
                *currentClassProto->add_methods() = MethodUtils::GetMethodInfo(m);
        }

        for (auto i : GetInterfaces(currentClass))
            *currentClassProto->add_interfaces() = GetClassInfo(typeofclass(i));

        currentClass = GetParent(currentClass);
        if (currentClass)
            currentClassProto = currentClassProto->mutable_parent();
    }

    // while loop means I can't add the parents to the cache in it
    // because it goes in the wrong order, so parents aren't filled out when they would be added
    currentClass = clazz;
    currentClassProto = &ret;

    while (currentClass != nullptr) {
        cachedClasses[currentClass] = *currentClassProto;
        currentClass = GetParent(currentClass);
        if (currentClass)
            currentClassProto = currentClassProto->mutable_parent();
    }

    return ret;
}

void Manager::getClassDetails(GetClassDetails const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto result = wrapper.mutable_getclassdetailsresult();

    Il2CppClass* klass = GetClass(packet.classinfo());
    if (!klass) {
        INPUT_ERROR("Could not find class {}", packet.classinfo().DebugString())
        handler->sendPacket(wrapper);
        return;
    }

    *result->mutable_classdetails() = getClassDetails_internal(klass);

    handler->sendPacket(wrapper);
}

void Manager::getInstanceClass(GetInstanceClass const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto instance = asPtr(Il2CppObject, packet.address());

    if (!tryValidatePtr(instance))
        INPUT_ERROR("instance pointer was invalid")
    else {
        auto result = wrapper.mutable_getinstanceclassresult();
        *result->mutable_classinfo() = GetClassInfo(typeofinst(instance));
    }

    handler->sendPacket(wrapper);
}

GetInstanceValuesResult getInstanceValues_internal(Il2CppObject* instance, ProtoClassDetails const* classDetails) {
    GetInstanceValuesResult ret;

    while (classDetails) {
        for (int i = 0; i < classDetails->fields_size(); i++) {
            auto field = classDetails->fields(i);
            auto fieldInfo = asPtr(FieldInfo, field.id());
            (*ret.mutable_fieldvalues())[field.id()] = FieldUtils::Get(fieldInfo, instance).data();
        }
        for (int i = 0; i < classDetails->properties_size(); i++) {
            auto prop = classDetails->properties(i);
            if (!prop.has_getterid() || !prop.getterid())
                continue;
            auto getter = asPtr(MethodInfo, prop.getterid());
            std::string err = "";
            auto res = MethodUtils::Run(getter, instance, {}, err);
            if (!err.empty())
                LOG_INFO("getting property failed with error: {}", err);
            else
                (*ret.mutable_propertyvalues())[prop.getterid()] = res.data();
        }
        if (!classDetails->has_parent())
            break;
        classDetails = &classDetails->parent();
    }

    return ret;
}

void Manager::getInstanceValues(GetInstanceValues const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto instance = asPtr(Il2CppObject, packet.address());

    LOG_DEBUG("Requesting values of {}", packet.address());
    if (!tryValidatePtr(instance))
        INPUT_ERROR("instance pointer was invalid")
    else {
        auto details = getClassDetails_internal(instance->klass);
        *wrapper.mutable_getinstancevaluesresult() = getInstanceValues_internal(instance, &details);
    }
    handler->sendPacket(wrapper);
}

void Manager::getInstanceDetails(GetInstanceDetails const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    LOG_DEBUG("Requesting details of {}", packet.address());
    auto instance = asPtr(Il2CppObject, packet.address());

    if (!tryValidatePtr(instance))
        INPUT_ERROR("instance pointer was invalid")
    else {
        auto result = wrapper.mutable_getinstancedetailsresult();
        auto classDetails = result->mutable_classdetails();
        *classDetails = getClassDetails_internal(instance->klass);
        *result->mutable_values() = getInstanceValues_internal(instance, classDetails);
    }
    handler->sendPacket(wrapper);
}

void Manager::addSafePtrAddress(AddSafePtrAddress const& addPacket, uint64_t id) {
    auto addr = asPtr(Il2CppObject, addPacket.address());
    if (addPacket.remove()) {
        getUnityHandle()->removeKeepAlive(addr);
    } else {
        getUnityHandle()->addKeepAlive(addr);
    }
    sendSafePtrList(id);
}

void Manager::sendSafePtrList(uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto res = wrapper.mutable_getsafeptraddressesresult();
    auto objs = getUnityHandle()->keepAliveObjects;

    auto& resMap = *res->mutable_address();

    for (auto const& addr : objs) {
        resMap[asInt(addr)] = ClassUtils::GetClassInfo(typeofclass(addr->klass));
    }

    handler->sendPacket(wrapper);
}

void Manager::setLoggerListener(RequestLogger const& packet, uint64_t id) {
    this->sendLoggerUpdates = packet.listen();
}

void Manager::getHoveredObject(GetCameraHovered const& packet, uint64_t id) {
    PacketWrapper wrapper;
    wrapper.set_queryresultid(id);

    auto res = wrapper.mutable_getcamerahoveredresult()->mutable_hoveredobject();
    if (auto obj = GetHovered())
        *res = ReadGameObject(obj);

    handler->sendPacket(wrapper);
}

#pragma endregion
