#pragma once

#ifdef BEAT_SABER
#include "custom-types/shared/macros.hpp"

#include "UnityEngine/MonoBehaviour.hpp"
#include "UnityEngine/Vector2.hpp"
#include "UnityEngine/Transform.hpp"
#include "UnityEngine/GameObject.hpp"
#include "GlobalNamespace/VRController.hpp"
#include "HMUI/UIKeyboard.hpp"

DECLARE_CLASS_CODEGEN(QRUE, CameraController, UnityEngine::MonoBehaviour,
    DECLARE_INSTANCE_METHOD(void, OnEnable);
    DECLARE_INSTANCE_METHOD(void, OnDisable);
    DECLARE_INSTANCE_METHOD(void, Update);
    DECLARE_INSTANCE_METHOD(void, Rotate, UnityEngine::Vector2);
    DECLARE_INSTANCE_METHOD(void, Move, UnityEngine::Vector3);

    DECLARE_INSTANCE_FIELD(float, lastTime);
    DECLARE_INSTANCE_FIELD(float, lastMovement);
    DECLARE_INSTANCE_FIELD(float, lastBackspace);
    DECLARE_INSTANCE_FIELD(bool, backspaceHold);
    DECLARE_INSTANCE_FIELD(bool, backspaceHoldStart);
    DECLARE_INSTANCE_FIELD(UnityEngine::Vector2, lastPos);
    DECLARE_INSTANCE_FIELD(GlobalNamespace::VRController*, controller0);
    DECLARE_INSTANCE_FIELD(GlobalNamespace::VRController*, controller1);
    DECLARE_INSTANCE_FIELD(UnityEngine::Transform*, parentTransform);
    DECLARE_INSTANCE_FIELD(UnityEngine::Transform*, childTransform);
)

extern bool enabled;

extern bool click;
extern HMUI::UIKeyboard* keyboardOpen;

extern float rotateSensitivity;
extern float moveSensitivity;
extern float clickTime;
extern float movementThreshold;

UnityEngine::GameObject* GetHovered();

#endif
