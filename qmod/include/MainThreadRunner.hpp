#pragma once

#include "custom-types/shared/macros.hpp"

#include "UnityEngine/MonoBehaviour.hpp"
#include "System/Collections/Generic/List_1.hpp"

#include "beatsaber-hook/shared/utils/typedefs-list.hpp"

DECLARE_CLASS_CODEGEN(QRUE, MainThreadRunner, UnityEngine::MonoBehaviour,
    DECLARE_INSTANCE_FIELD(ListW<Il2CppObject*>, keepAliveObjects);
    DECLARE_INSTANCE_METHOD(void, Awake);
    DECLARE_INSTANCE_METHOD(void, Update);

   public:
    DECLARE_INSTANCE_METHOD(void, addKeepAlive, Il2CppObject *obj);
    DECLARE_INSTANCE_METHOD(void, removeKeepAlive, Il2CppObject *obj);
)

void scheduleFunction(std::function<void()> const& func);
QRUE::MainThreadRunner *getUnityHandle();
