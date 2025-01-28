#pragma once

#include "UnityEngine/MonoBehaviour.hpp"
#include "UnityEngine/Transform.hpp"
#include "UnityEngine/Vector2.hpp"
#include "UnityEngine/Vector3.hpp"
#include "custom-types/shared/macros.hpp"

#ifdef BEAT_SABER
#include "GlobalNamespace/VRController.hpp"
#include "HMUI/UIKeyboard.hpp"
#endif

DECLARE_CLASS_CODEGEN(QRUE, CameraController, UnityEngine::MonoBehaviour) {
    DECLARE_DEFAULT_CTOR();

    DECLARE_INSTANCE_METHOD(void, OnEnable);
    DECLARE_INSTANCE_METHOD(void, OnDisable);
    DECLARE_INSTANCE_METHOD(void, Update);
    DECLARE_INSTANCE_METHOD(void, Rotate, UnityEngine::Vector2);
    DECLARE_INSTANCE_METHOD(void, KeyDown, StringW);
    DECLARE_INSTANCE_METHOD(void, KeyUp, StringW);

   private:
    UnityEngine::Vector3 movementF;
    UnityEngine::Vector3 movementB;
};

extern float rotateSensitivity;
extern float moveSensitivity;

#ifdef BEAT_SABER
UnityEngine::GameObject* GetHovered();
#endif
