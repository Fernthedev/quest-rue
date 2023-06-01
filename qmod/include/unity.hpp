#pragma once

#include "main.hpp"

#include "UnityEngine/GameObject.hpp"

ProtoGameObject ReadGameObject(UnityEngine::GameObject* obj);

GetGameObjectComponentsResult GetComponents(UnityEngine::GameObject* obj);
SearchObjectsResult FindObjects(Il2CppClass* klass, std::string name);
GetAllGameObjectsResult FindAllGameObjects();
