#include "unity.hpp"
#include "classutils.hpp"

#include "UnityEngine/Transform.hpp"
#include "UnityEngine/Component.hpp"
#include "UnityEngine/Object.hpp"
#include "UnityEngine/SceneManagement/Scene.hpp"
#include "UnityEngine/Resources.hpp"

using namespace UnityEngine;

ProtoScene ReadScene(SceneManagement::Scene obj) {
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
    protoObj.set_parent(asInt(obj->GetParent().unsafePtr()));
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

GetGameObjectComponentsResult GetComponents(UnityEngine::GameObject* obj) {
    GetGameObjectComponentsResult result;

    for (const auto comp : obj->GetComponents<Component*>()) {
        ProtoComponent& found = *result.add_components();

        found.set_address(asInt(comp));
        found.set_name(comp->get_name());
        *found.mutable_classinfo() = ClassUtils::GetClassInfo(typeofinst(comp));
    }

    return result;
}

SearchObjectsResult FindObjects(Il2CppClass* klass, std::string name) {
    SearchObjectsResult result;
    LOG_DEBUG("Searching for objects");

    auto objects = Resources::FindObjectsOfTypeAll(
        reinterpret_cast<System::Type*>(il2cpp_utils::GetSystemType(klass)));

    std::span<UnityW<Object>> res = objects.ref_to();
    std::vector<UnityW<Object>> namedObjs;

    if(!name.empty()) {
        LOG_DEBUG("Searching for name {}", name);
        StringW il2cppName(name);
        for(auto obj : res) {
            if(obj->get_name()->Contains(il2cppName))
                namedObjs.push_back(obj);
        }
        res = std::span<UnityW<Object>>(namedObjs);
    }

    for(auto obj : res) {
        ProtoObject& found = *result.add_objects();
        name = static_cast<std::string>(obj->get_name());
        found.set_address(asInt(obj.unsafePtr()));
        found.set_name(name);
        *found.mutable_classinfo() = ClassUtils::GetClassInfo(typeofinst(obj));
    }
    return result;
}

GetAllGameObjectsResult FindAllGameObjects() {
    GetAllGameObjectsResult result;

    auto objects = Resources::FindObjectsOfTypeAll<GameObject*>();
    result.mutable_objects()->Reserve(objects.size());
    LOG_DEBUG("found {} game objects", objects.size());
    for (const auto& obj : objects) {
        *result.add_objects() = ReadGameObject(obj);
    }

    return result;
}

