#pragma once

#include "UnityEngine/MonoBehaviour.hpp"
#include "custom-types/shared/macros.hpp"

DECLARE_CLASS_CODEGEN(QRUE, MainThreadRunner, UnityEngine::MonoBehaviour) {
    DECLARE_INSTANCE_FIELD(ListW<Il2CppObject*>, keepAliveObjects);
    DECLARE_INSTANCE_METHOD(void, Awake);
    DECLARE_INSTANCE_METHOD(void, Update);

   public:
    DECLARE_INSTANCE_METHOD(void, addKeepAlive, Il2CppObject* obj);
    DECLARE_INSTANCE_METHOD(void, removeKeepAlive, Il2CppObject* obj);
};

void scheduleFunction(std::function<void()> const& func);
QRUE::MainThreadRunner* getUnityHandle();
