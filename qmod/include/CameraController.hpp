#pragma once

#ifdef BEAT_SABER
#include "custom-types/shared/macros.hpp"

#include "sombrero/shared/FastVector2.hpp"
#include "sombrero/shared/FastVector3.hpp"

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
    DECLARE_INSTANCE_METHOD(void, Rotate, Sombrero::FastVector2);
    DECLARE_INSTANCE_METHOD(void, Move, Sombrero::FastVector3);

    DECLARE_INSTANCE_FIELD(float, lastTime);
    DECLARE_INSTANCE_FIELD(float, lastMovement);
    DECLARE_INSTANCE_FIELD(bool, backspaceHold);
    DECLARE_INSTANCE_FIELD(float, backspaceHoldStart);
    DECLARE_INSTANCE_FIELD(UnityEngine::Vector2, lastPos);
    DECLARE_INSTANCE_FIELD(GlobalNamespace::VRController*, controller0);
    DECLARE_INSTANCE_FIELD(GlobalNamespace::VRController*, controller1);
    DECLARE_INSTANCE_FIELD(UnityEngine::Transform*, parentTransform);
    DECLARE_INSTANCE_FIELD(UnityEngine::Transform*, childTransform);
)

extern bool fpfcEnabled;
#ifdef UNITY_2021
extern Sombrero::FastVector3 fpfcPos;
extern Sombrero::FastVector3 fpfcRot;
#endif

extern bool click;
extern bool clickOnce;
extern HMUI::UIKeyboard* keyboardOpen;

extern float rotateSensitivity;
extern float moveSensitivity;
extern float clickTime;
extern float movementThreshold;

UnityEngine::GameObject* GetHovered();

#endif
