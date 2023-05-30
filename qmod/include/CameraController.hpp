#pragma once

#include "custom-types/shared/macros.hpp"

#include "UnityEngine/MonoBehaviour.hpp"
#include "UnityEngine/Vector2.hpp"
#include "UnityEngine/Transform.hpp"
#include "GlobalNamespace/VRController.hpp"

DECLARE_CLASS_CODEGEN(QRUE, CameraController, UnityEngine::MonoBehaviour,
    DECLARE_INSTANCE_METHOD(void, Start);
    DECLARE_INSTANCE_METHOD(void, Update);
    DECLARE_INSTANCE_METHOD(void, Rotate, UnityEngine::Vector2);
    DECLARE_INSTANCE_METHOD(void, Move, UnityEngine::Vector3);

    DECLARE_INSTANCE_FIELD(float, rotateSensitivity);
    DECLARE_INSTANCE_FIELD(float, moveSensitivity);
    DECLARE_INSTANCE_FIELD(float, clickTime);
    DECLARE_INSTANCE_FIELD(float, movementThreshold);
    DECLARE_INSTANCE_FIELD(float, lastTime);
    DECLARE_INSTANCE_FIELD(float, lastMovement);
    DECLARE_INSTANCE_FIELD(UnityEngine::Vector2, lastPos);
    DECLARE_INSTANCE_FIELD(GlobalNamespace::VRController*, controller0);
    DECLARE_INSTANCE_FIELD(GlobalNamespace::VRController*, controller1);
    DECLARE_INSTANCE_FIELD(UnityEngine::Transform*, parentTransform);
    DECLARE_INSTANCE_FIELD(UnityEngine::Transform*, childTransform);
)

extern bool click;
