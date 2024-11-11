#pragma once

#ifdef BEAT_SABER
#include "custom-types/shared/macros.hpp"

#include "sombrero/shared/FastVector2.hpp"
#include "sombrero/shared/FastVector3.hpp"

#include "UnityEngine/MonoBehaviour.hpp"
#include "UnityEngine/Vector2.hpp"
#include "UnityEngine/Transform.hpp"
#include "UnityEngine/GameObject.hpp"
#include "UnityEngine/Camera.hpp"
#include "GlobalNamespace/VRController.hpp"
#include "HMUI/UIKeyboard.hpp"

DECLARE_CLASS_CODEGEN(QRUE, CameraController, UnityEngine::MonoBehaviour,
    DECLARE_DEFAULT_CTOR();

    DECLARE_INSTANCE_METHOD(void, OnEnable);
    DECLARE_INSTANCE_METHOD(void, OnDisable);
    DECLARE_INSTANCE_METHOD(void, Update);
    DECLARE_INSTANCE_METHOD(void, Rotate, Sombrero::FastVector2);
    DECLARE_INSTANCE_METHOD(void, Move, Sombrero::FastVector3);

#ifdef UNITY_2021
    DECLARE_INSTANCE_FIELD(UnityEngine::Camera*, customCamera);
    DECLARE_INSTANCE_FIELD_DEFAULT(bool, recording, false);
#endif
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

#ifdef UNITY_2021
#include <EGL/egl.h>

#include "media/NdkMediaCodec.h"

DECLARE_CLASS_CODEGEN(QRUE, CameraStreamer, UnityEngine::MonoBehaviour,
    DECLARE_DEFAULT_CTOR();

    DECLARE_INSTANCE_METHOD(void, Init, int width, int height, int bitrate);
    DECLARE_INSTANCE_METHOD(void, Stop);
    DECLARE_INSTANCE_METHOD(void, FinishStop);
    DECLARE_INSTANCE_METHOD(void, Update);
    DECLARE_INSTANCE_METHOD(void, OnDestroy);

    DECLARE_INSTANCE_FIELD_DEFAULT(int, texture, -1);
    DECLARE_INSTANCE_FIELD_DEFAULT(int, buffer, -1);
    DECLARE_INSTANCE_FIELD_DEFAULT(int, id, -1);
    DECLARE_INSTANCE_FIELD_DEFAULT(int, width, -1);
    DECLARE_INSTANCE_FIELD_DEFAULT(int, height, -1);
    DECLARE_INSTANCE_FIELD_DEFAULT(bool, initializedEncoder, false);
    DECLARE_INSTANCE_FIELD_DEFAULT(bool, initializedEgl, false);
    DECLARE_INSTANCE_FIELD_DEFAULT(int, framesProcessing, 0);

   public:
    std::function<void(uint8_t*, size_t)> onOutputFrame;

    ANativeWindow* window;
    EGLSurface surface;

    static CameraStreamer* GetById(int id);

   private:
    AMediaCodec* encoder;

    bool stopThread = false;
    std::thread threadInst;
    void EncodingThread();

    static inline int maxId = 0;
    static inline std::shared_mutex idMapMutex;
    static inline std::unordered_map<int, CameraStreamer*> idMap{};
)
#endif

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
