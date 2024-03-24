#pragma once

#include "UnityEngine/GameObject.hpp"
#include "protobuf/qrue.pb.h"

ProtoGameObject ReadGameObject(UnityEngine::GameObject* obj);

GetGameObjectComponentsResult GetComponents(UnityEngine::GameObject* obj);
SearchObjectsResult FindObjects(Il2CppClass* klass, std::string name);
GetAllGameObjectsResult FindAllGameObjects();
