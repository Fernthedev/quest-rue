#ifdef BEAT_SABER
#include "CameraController.hpp"

#include "main.hpp"
#include "sombrero/shared/FastVector2.hpp"
#include "sombrero/shared/FastVector3.hpp"

DEFINE_TYPE(QRUE, CameraController);
#ifdef UNITY_2021
DEFINE_TYPE(QRUE, CameraStreamer);
#endif

bool fpfcEnabled = true;
#ifdef UNITY_2021
Sombrero::FastVector3 fpfcPos;
Sombrero::FastVector3 fpfcRot;
#endif

bool click = false;
bool clickOnce = false;
HMUI::UIKeyboard* keyboardOpen = nullptr;

float rotateSensitivity = 1;
float moveSensitivity = 1;
float clickTime = 0.2;
float movementThreshold = 1;
float backspaceTime = 0.5;

#include "UnityEngine/EventSystems/PointerEventData.hpp"
#include "VRUIControls/VRInputModule.hpp"

SafePtrUnity<VRUIControls::VRInputModule> latestInputModule;

UnityEngine::GameObject* GetHovered() {
    if (!latestInputModule)
        return nullptr;
    auto eventData = latestInputModule->GetLastPointerEventData(-1);
    if (eventData)
        return eventData->pointerEnter;
    return nullptr;
}

UnityEngine::GameObject* GetPauseMenu() {
    if (auto ret = UnityEngine::GameObject::Find("PauseMenu"))
        return ret;
    else if (auto ret = UnityEngine::GameObject::Find("TutorialPauseMenu"))
        return ret;
    else if (auto ret = UnityEngine::GameObject::Find("MultiplayerLocalActivePlayerInGameMenuViewController"))
        return ret;
    else
        return nullptr;
}

using namespace QRUE;
using namespace UnityEngine;
using namespace GlobalNamespace;

#include "GlobalNamespace/FirstPersonFlyingController.hpp"
#include "GlobalNamespace/VRCenterAdjust.hpp"
#include "VRUIControls/VRLaserPointer.hpp"
#include "VRUIControls/VRPointer.hpp"

void CameraController::OnEnable() {
    fpfcEnabled = true;
    LOG_INFO("CameraController enable");

    childTransform = get_transform();
#ifdef UNITY_2021
    fpfcPos = {0, 1.5, 0};
    fpfcRot = {};
#else
    parentTransform = childTransform->GetParent();

    if (!parentTransform) {
        set_enabled(false);
        return;
    }

    static auto disablePositionalTracking = il2cpp_utils::resolve_icall<void, bool>("UnityEngine.XR.InputTracking::set_disablePositionalTracking");
    disablePositionalTracking(true);

    parentTransform->set_position({0, 1.5, 0});
    parentTransform->set_eulerAngles({0, 0, 0});
    childTransform->set_localPosition({0, 0, 0});
    childTransform->set_localEulerAngles({0, 0, 0});
#endif

#ifdef UNITY_2021
    // in level
    if (auto pauseMenu = GetPauseMenu()) {
        // can't just search for "MenuControllers" because there are two, we need
        // the one that's a child of the pause menu
        auto transform = pauseMenu->get_transform()->Find("MenuControllers");
        controller0 = transform->Find("ControllerLeft")->GetComponent<VRController*>();
        controller1 = transform->Find("ControllerRight")->GetComponent<VRController*>();
        // in main menu
    } else if (auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>()) {
        objectsSource->_centerAdjust->ResetRoom();
        objectsSource->_centerAdjust->set_enabled(false);
        for (auto gameObject : objectsSource->_controllerModels) {
            if (gameObject)
                gameObject->SetActive(false);
        }
        controller0 = objectsSource->_controller0;
        controller1 = objectsSource->_controller1;
    }
    if (controller0 && controller1) {
        controller0->mouseMode = true;
        controller1->mouseMode = true;
        latestInputModule = Object::FindObjectOfType<VRUIControls::VRInputModule*>();
    }
#else
    // in level
    if (auto pauseMenu = GetPauseMenu()) {
        // can't just search for "MenuControllers" because there are two, we need
        // the one that's a child of the pause menu
        auto transform = pauseMenu->get_transform()->Find("MenuControllers");
        controller0 = transform->Find("ControllerLeft")->GetComponent<VRController*>();
        controller1 = transform->Find("ControllerRight")->GetComponent<VRController*>();
        if (auto vrInputModule = Object::FindObjectOfType<VRUIControls::VRInputModule*>()) {
            latestInputModule = vrInputModule;
            vrInputModule->set_useMouseForPressInput(true);
            vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(false);
        }
        // in main menu
    } else if (auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>()) {
        latestInputModule = objectsSource->vrInputModule;
        objectsSource->vrInputModule->set_useMouseForPressInput(true);
        objectsSource->vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(false);
        objectsSource->centerAdjust->ResetRoom();
        objectsSource->centerAdjust->set_enabled(false);
        for (auto gameObject : objectsSource->controllerModels) {
            if (gameObject)
                gameObject->SetActive(false);
        }
        controller0 = objectsSource->controller0;
        controller1 = objectsSource->controller1;
    }
#endif

    if (controller0 && controller1) {
        controller0->set_enabled(false);
        controller1->set_enabled(false);
        if (auto pointer = controller1->get_transform()->Find("VRLaserPointer(Clone)"))
            pointer->get_gameObject()->SetActive(false);
        if (auto pointer = controller1->get_transform()->Find("MenuHandle"))
            pointer->get_gameObject()->SetActive(false);
    }
}

void CameraController::OnDisable() {
    fpfcEnabled = false;
    LOG_INFO("CameraController disable");

#ifndef UNITY_2021
    if (!parentTransform)
        return;

    // reverse of enable
    static auto disablePositionalTracking = il2cpp_utils::resolve_icall<void, bool>("UnityEngine.XR.InputTracking::set_disablePositionalTracking");
    disablePositionalTracking(false);

    parentTransform->set_position({0, 0, 0});
    parentTransform->set_eulerAngles({0, 0, 0});
#endif

#ifdef UNITY_2021
    if (auto pauseMenu = GetPauseMenu()) {
        LOG_DEBUG("Using controllers from pause menu");
        auto transform = pauseMenu->get_transform()->Find("MenuControllers");
        controller0 = transform->Find("ControllerLeft")->GetComponent<VRController*>();
        controller1 = transform->Find("ControllerRight")->GetComponent<VRController*>();
    } else if (auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>()) {
        LOG_DEBUG("Using controllers from original fpfc");
        objectsSource->_centerAdjust->set_enabled(true);
        for (auto gameObject : objectsSource->_controllerModels) {
            if (gameObject)
                gameObject->SetActive(true);
        }
        controller0 = objectsSource->_controller0;
        controller1 = objectsSource->_controller1;
    }
    if (controller0 && controller1) {
        controller0->mouseMode = false;
        controller1->mouseMode = false;
    }

    latestInputModule = nullptr;
#else
    if (auto pauseMenu = GetPauseMenu()) {
        LOG_DEBUG("Using controllers from pause menu");
        auto transform = pauseMenu->get_transform()->Find("MenuControllers");
        controller0 = transform->Find("ControllerLeft")->GetComponent<VRController*>();
        controller1 = transform->Find("ControllerRight")->GetComponent<VRController*>();
        if (auto vrInputModule = Object::FindObjectOfType<VRUIControls::VRInputModule*>()) {
            vrInputModule->set_useMouseForPressInput(false);
            vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(true);
        }
    } else if (auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>()) {
        LOG_DEBUG("Using controllers from original fpfc");
        objectsSource->vrInputModule->set_useMouseForPressInput(false);
        objectsSource->vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(true);
        objectsSource->centerAdjust->set_enabled(true);
        for (auto gameObject : objectsSource->controllerModels) {
            if (gameObject)
                gameObject->SetActive(true);
        }
        controller0 = objectsSource->controller0;
        controller1 = objectsSource->controller1;
    }

    latestInputModule = nullptr;
#endif

    if (controller0 && controller1) {
        controller0->set_enabled(true);
        controller1->set_enabled(true);
        if (auto pointer = controller1->get_transform()->Find("VRLaserPointer(Clone)"))
            pointer->get_gameObject()->SetActive(true);
        if (auto pointer = controller1->get_transform()->Find("MenuHandle"))
            pointer->get_gameObject()->SetActive(true);
    } else
        LOG_INFO("Failed to find menu controllers for FPFC");
}

#include "GlobalNamespace/DepthTextureController.hpp"
#include "GlobalNamespace/MainCamera.hpp"
#include "GlobalNamespace/MainCameraCullingMask.hpp"
#include "GlobalNamespace/PauseController.hpp"
#include "GlobalNamespace/PauseMenuManager.hpp"
#include "GlobalNamespace/UIKeyboardManager.hpp"
#include "System/Action.hpp"
#include "System/Action_1.hpp"
#include "UnityEngine/Camera.hpp"
#include "UnityEngine/CameraType.hpp"
#include "UnityEngine/FilterMode.hpp"
#include "UnityEngine/Input.hpp"
#include "UnityEngine/KeyCode.hpp"
#include "UnityEngine/RenderTexture.hpp"
#include "UnityEngine/RenderTextureFormat.hpp"
#include "UnityEngine/RenderTextureReadWrite.hpp"
#include "UnityEngine/StereoTargetEyeMask.hpp"
#include "UnityEngine/TextureWrapMode.hpp"
#include "UnityEngine/Time.hpp"
#include "UnityEngine/Touch.hpp"

RenderTexture* CreateCameraTexture(int w, int h) {
    auto texture = RenderTexture::New_ctor(w, h, 24, RenderTextureFormat::Default, RenderTextureReadWrite::Default);
    Object::DontDestroyOnLoad(texture);
    texture->wrapMode = TextureWrapMode::Clamp;
    texture->filterMode = FilterMode::Bilinear;
    texture->Create();
    return texture;
}

void CameraController::Update() {
    if (Input::GetKeyDown(KeyCode::X)) {
        LOG_INFO("Disabling FPFC due to X press (reenable with Z)");

        fpfcEnabled = false;
        set_enabled(false);
        return;
    }

#ifdef UNITY_2021
    if (Input::GetKeyDown(KeyCode::V)) {
        if (recording) {
            LOG_INFO("Disabling recording");

            Object::DestroyImmediate(customCamera->gameObject);
            customCamera = nullptr;
            recording = false;
        } else {
            LOG_INFO("Enabling recording");
            auto mainCamera = GetComponent<Camera*>();
            if (auto comp = mainCamera->GetComponent<DepthTextureController*>())
                Object::DestroyImmediate(comp);
            customCamera = Object::Instantiate(mainCamera);
            customCamera->gameObject->active = false;
            customCamera->enabled = true;

            while (customCamera->transform->childCount > 0)
                Object::DestroyImmediate(customCamera->transform->GetChild(0)->gameObject);

            if (auto comp = customCamera->GetComponent<MainCameraCullingMask*>())
                Object::DestroyImmediate(comp);
            if (auto comp = customCamera->GetComponent<MainCamera*>())
                Object::DestroyImmediate(comp);
            if (auto comp = customCamera->GetComponent<SpatialTracking::TrackedPoseDriver*>())
                Object::DestroyImmediate(comp);
            if (auto comp = customCamera->GetComponent("CameraController"))
                Object::DestroyImmediate(comp);

            customCamera->clearFlags = mainCamera->clearFlags;
            customCamera->nearClipPlane = mainCamera->nearClipPlane;
            customCamera->farClipPlane = mainCamera->farClipPlane;
            customCamera->backgroundColor = mainCamera->backgroundColor;
            customCamera->hideFlags = mainCamera->hideFlags;
            customCamera->depthTextureMode = mainCamera->depthTextureMode;
            customCamera->cullingMask = mainCamera->cullingMask;
            // Makes the camera render after the main
            customCamera->depth = mainCamera->depth + 1;

            customCamera->stereoTargetEye = StereoTargetEyeMask::None;

            int w = 1080;
            int h = 720;
            auto tex = CreateCameraTexture(w, h);
            customCamera->targetTexture = tex;
            auto streamer = customCamera->gameObject->AddComponent<CameraStreamer*>();
            streamer->texture = (uintptr_t) tex->GetNativeTexturePtr().m_value.convert();
            streamer->onOutputFrame = [](uint8_t* data, size_t length) {
                // LOG_DEBUG("output frame callback!");
            };
            streamer->Init(w, h, 1000000);
            customCamera->gameObject->active = true;

            recording = true;
        }
    }
#endif

    float time = UnityEngine::Time::get_time();

    if (Input::get_touchCount() > 0) {
        auto touch = Input::GetTouch(0);
        auto& pos = touch.m_Position;
        auto phase = touch.m_Phase;
        bool drag = Input::GetKey(KeyCode::LeftShift) || Input::GetKey(KeyCode::RightShift);
        switch (phase) {
            case TouchPhase::Began:
                lastTime = UnityEngine::Time::get_time();
                lastMovement = 0;
                lastPos = pos;
                click = drag;
                break;
            case TouchPhase::Ended:
            case TouchPhase::Canceled:
                Rotate(Sombrero::FastVector2(pos) - lastPos);
                if (!click && (time - lastTime) < clickTime && lastMovement < movementThreshold)
                    clickOnce = true;
                click = false;
                break;
            default:
                Rotate(Sombrero::FastVector2(pos) - lastPos);
                lastPos = pos;
                click = drag;
                break;
        }
    }

    if (!keyboardOpen) {
        Sombrero::FastVector3 movement = {0};
        if (Input::GetKey(KeyCode::W))
            movement = movement + childTransform->get_forward();
        if (Input::GetKey(KeyCode::S))
            movement = movement - childTransform->get_forward();
        if (Input::GetKey(KeyCode::D))
            movement = movement + childTransform->get_right();
        if (Input::GetKey(KeyCode::A))
            movement = movement - childTransform->get_right();
        if (Input::GetKey(KeyCode::Space))
            movement = movement + childTransform->get_up();
        if (Input::GetKey(KeyCode::LeftControl) || Input::GetKey(KeyCode::RightControl))
            movement = movement - childTransform->get_up();
        if (movement != Sombrero::FastVector3::zero())
            Move(movement);

        if (Input::GetKeyDown(KeyCode::Escape)) {
            if (auto pauser = Object::FindObjectOfType<PauseController*>())
                pauser->Pause();
        } else if (Input::GetKeyDown(KeyCode::Return)) {
            if (auto pauser = Object::FindObjectOfType<PauseMenuManager*>())
                pauser->ContinueButtonPressed();
        } else if (Input::GetKeyDown(KeyCode::Q)) {
            if (auto pauser = Object::FindObjectOfType<PauseMenuManager*>())
                pauser->MenuButtonPressed();
        }
    } else {
        if (Input::GetKey(KeyCode::Escape)) {
            if (auto manager = Object::FindObjectOfType<UIKeyboardManager*>())
                manager->CloseKeyboard();
            return;
        }

        static auto getInputString = il2cpp_utils::resolve_icall<StringW>("UnityEngine.Input::get_inputString");
        static auto getAnyKeyDown = il2cpp_utils::resolve_icall<bool>("UnityEngine.Input::get_anyKeyDown");

        if (getAnyKeyDown()) {
            for (auto& c : getInputString()) {
                if (c != u'\n' && c != u'\b')
                    keyboardOpen->keyWasPressedEvent->Invoke(c);
            }
        }
        if (Input::GetKey(KeyCode::Backspace)) {
            if (backspaceHoldStart == 0 || backspaceHold) {
                keyboardOpen->deleteButtonWasPressedEvent->Invoke();
                backspaceHoldStart = time;
            } else if (time - backspaceHoldStart > backspaceTime)
                backspaceHold = true;
        } else {
            backspaceHold = false;
            backspaceHoldStart = 0;
        }
        if (Input::GetKeyDown(KeyCode::Return))
            keyboardOpen->okButtonWasPressedEvent->Invoke();
    }

    if (controller0 && controller1) {
        controller0->get_transform()->SetPositionAndRotation(childTransform->get_position(), childTransform->get_rotation());
        controller1->get_transform()->SetPositionAndRotation(childTransform->get_position(), childTransform->get_rotation());
    }
}

void CameraController::Rotate(Sombrero::FastVector2 delta) {
    delta = delta * rotateSensitivity * 20;
    lastMovement += delta.get_magnitude();
#ifdef UNITY_2021
    fpfcRot += Sombrero::FastVector3{-delta.y, delta.x, 0};
#else
    Sombrero::FastVector3 prev = parentTransform->get_eulerAngles();
    parentTransform->set_eulerAngles(prev + Sombrero::FastVector3{-delta.y, delta.x, 0});
#endif
}

void CameraController::Move(Sombrero::FastVector3 delta) {
    delta = delta * moveSensitivity / 50;
#ifdef UNITY_2021
    fpfcPos += delta;
#else
    Sombrero::FastVector3 prev = parentTransform->get_position();
    parentTransform->set_position(prev + delta);
#endif
}

// should be easily ported to 2019 as well
#ifdef UNITY_2021
#include <EGL/eglext.h>
#include <GLES/gl.h>
#include <GLES3/gl3.h>
#include <GLES3/gl32.h>
#include <GLES3/gl3ext.h>
#include <android/native_window.h>

#include "assets.hpp"
#include "media/NdkMediaFormat.h"

static FILE* f;

// clang-format off
// if you change these, it will probably break
EGLint const attribs[] = {
    EGL_RED_SIZE, 8,
    EGL_BLUE_SIZE, 8,
    EGL_GREEN_SIZE, 8,
    EGL_ALPHA_SIZE, 8,
    EGL_RENDERABLE_TYPE, EGL_OPENGL_ES3_BIT_KHR,
    EGL_RECORDABLE_ANDROID, 1,
    EGL_NONE
};
// clang-format on

#ifdef GL_DEBUG
#define EGL_BOOL_CHECK(action, msg) if (!action) LOG_ERROR(msg " egl error {}", eglGetErrorString())
#define GL_ERR_CHECK(msg) if (int e = glGetError()) LOG_ERROR(msg " gl error {}", e)

#define CASE_STR(value) case value: return #value;
char const* eglGetErrorString() {
    switch (eglGetError()) {
        CASE_STR(EGL_SUCCESS)
        CASE_STR(EGL_NOT_INITIALIZED)
        CASE_STR(EGL_BAD_ACCESS)
        CASE_STR(EGL_BAD_ALLOC)
        CASE_STR(EGL_BAD_ATTRIBUTE)
        CASE_STR(EGL_BAD_CONTEXT)
        CASE_STR(EGL_BAD_CONFIG)
        CASE_STR(EGL_BAD_CURRENT_SURFACE)
        CASE_STR(EGL_BAD_DISPLAY)
        CASE_STR(EGL_BAD_SURFACE)
        CASE_STR(EGL_BAD_MATCH)
        CASE_STR(EGL_BAD_PARAMETER)
        CASE_STR(EGL_BAD_NATIVE_PIXMAP)
        CASE_STR(EGL_BAD_NATIVE_WINDOW)
        CASE_STR(EGL_CONTEXT_LOST)
        default:
            return "Unknown";
    }
}
#undef CASE_STR

#define LOG_ATTR(attr) \
eglGetConfigAttrib(display, config, attr, &value); \
LOG_DEBUG(#attr ": {}", value);
void eglLogConfig(EGLDisplay display, EGLConfig config) {
    EGLint value;
    LOG_DEBUG("--- logging egl config ---");
    LOG_ATTR(EGL_CONFIG_ID);
    LOG_ATTR(EGL_COLOR_BUFFER_TYPE);
    LOG_ATTR(EGL_BUFFER_SIZE);
    LOG_ATTR(EGL_RED_SIZE);
    LOG_ATTR(EGL_GREEN_SIZE);
    LOG_ATTR(EGL_BLUE_SIZE);
    LOG_ATTR(EGL_ALPHA_SIZE);
    LOG_ATTR(EGL_DEPTH_SIZE);
    LOG_ATTR(EGL_STENCIL_SIZE);
    LOG_ATTR(EGL_LUMINANCE_SIZE);
    LOG_ATTR(EGL_ALPHA_MASK_SIZE);
    LOG_ATTR(EGL_SAMPLE_BUFFERS);
    LOG_ATTR(EGL_SAMPLES);
    LOG_ATTR(EGL_MAX_PBUFFER_WIDTH);
    LOG_ATTR(EGL_MAX_PBUFFER_HEIGHT);
    LOG_ATTR(EGL_MAX_PBUFFER_PIXELS);
    LOG_ATTR(EGL_MAX_SWAP_INTERVAL);
    LOG_ATTR(EGL_MIN_SWAP_INTERVAL);
    LOG_ATTR(EGL_NATIVE_RENDERABLE);
    LOG_ATTR(EGL_NATIVE_VISUAL_ID);
    LOG_ATTR(EGL_NATIVE_VISUAL_TYPE);
    LOG_ATTR(EGL_SURFACE_TYPE);
    LOG_ATTR(EGL_TRANSPARENT_TYPE);
}
#undef LOG_ATTR

void GLDebugMessageCallback(GLenum source, GLenum type, GLuint id, GLenum severity, GLsizei length, GLchar const* msg, void const* data) {
    std::string _source;
    std::string _type;
    std::string _severity;

    switch (source) {
        case GL_DEBUG_SOURCE_API:
            _source = "API";
            break;
        case GL_DEBUG_SOURCE_WINDOW_SYSTEM:
            _source = "WINDOW SYSTEM";
            break;
        case GL_DEBUG_SOURCE_SHADER_COMPILER:
            _source = "SHADER COMPILER";
            break;
        case GL_DEBUG_SOURCE_THIRD_PARTY:
            _source = "THIRD PARTY";
            break;
        case GL_DEBUG_SOURCE_APPLICATION:
            _source = "APPLICATION";
            break;
        default:
            _source = "UNKNOWN";
            break;
    }

    switch (type) {
        case GL_DEBUG_TYPE_ERROR:
            _type = "ERROR";
            break;
        case GL_DEBUG_TYPE_DEPRECATED_BEHAVIOR:
            _type = "DEPRECATED BEHAVIOR";
            break;
        case GL_DEBUG_TYPE_UNDEFINED_BEHAVIOR:
            _type = "UDEFINED BEHAVIOR";
            break;
        case GL_DEBUG_TYPE_PORTABILITY:
            _type = "PORTABILITY";
            break;
        case GL_DEBUG_TYPE_PERFORMANCE:
            _type = "PERFORMANCE";
            return;
            // break;
        case GL_DEBUG_TYPE_OTHER:
            _type = "OTHER";
            break;
        case GL_DEBUG_TYPE_MARKER:
            _type = "MARKER";
            break;
        default:
            _type = "UNKNOWN";
            break;
    }

    switch (severity) {
        case GL_DEBUG_SEVERITY_HIGH:
            _severity = "HIGH";
            break;
        case GL_DEBUG_SEVERITY_MEDIUM:
            _severity = "MEDIUM";
            break;
        case GL_DEBUG_SEVERITY_LOW:
            _severity = "LOW";
            break;
        case GL_DEBUG_SEVERITY_NOTIFICATION:
            _severity = "NOTIFICATION";
            return;
            // break;
        default:
            _severity = "UNKNOWN";
            break;
    }

    LOG_DEBUG("{}: {} of {} severity, raised from {}: {}", id, _type, _severity, _source, msg);
    // logger.Backtrace(69);
}
#else
#define EGL_BOOL_CHECK(action, msg) action
#define GL_ERR_CHECK(id)
#endif

// not sure if this is necessary with unity, but it should be more correct
namespace EGLState {
    EGLDisplay display;
    EGLSurface read;
    EGLSurface draw;
    EGLContext context;

    void Save() {
        EGLState::display = eglGetCurrentDisplay();
        EGLState::read = eglGetCurrentSurface(EGL_READ);
        EGLState::draw = eglGetCurrentSurface(EGL_DRAW);
        EGLState::context = eglGetCurrentContext();
    }

    void Load() {
        if (EGLState::display && EGLState::context)
            EGL_BOOL_CHECK(eglMakeCurrent(EGLState::display, EGLState::draw, EGLState::read, EGLState::context), "restore egl");
    }
}

namespace GammaShader {
    GLuint shaderId;
    bool initialized = false;

    bool CheckCompileError(GLuint shader, char const* name) {
        GLint isCompiled = 0;
        glGetShaderiv(shader, GL_COMPILE_STATUS, &isCompiled);

        if (isCompiled == GL_FALSE) {
            GLint maxLength = 0;
            glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &maxLength);

            // maxLength includes the NULL character
            std::vector<GLchar> errorLog(maxLength);
            glGetShaderInfoLog(shader, maxLength, &maxLength, errorLog.data());

            glDeleteShader(shader);

            LOG_ERROR("Unable to create shader {}:", name);
            LOG_ERROR("{}", errorLog.data());
            return true;
        }

        return false;
    }

    bool Create() {
        LOG_INFO("Creating shader program");

        GLuint vertex = glCreateShader(GL_VERTEX_SHADER);

        glShaderSource(vertex, 1, &IncludedAssets::gamma_vs_glsl.data, &IncludedAssets::gamma_vs_glsl.len);
        glCompileShader(vertex);
        GL_ERR_CHECK("vertex shader");

        if (CheckCompileError(vertex, "vertex"))
            return false;

        GLuint fragment = glCreateShader(GL_FRAGMENT_SHADER);

        glShaderSource(fragment, 1, &IncludedAssets::gamma_fs_glsl.data, &IncludedAssets::gamma_fs_glsl.len);
        glCompileShader(fragment);
        GL_ERR_CHECK("fragment shader");

        // make sure shaders are deleted correctly
        if (!CheckCompileError(fragment, "fragment")) {
            shaderId = glCreateProgram();

            glAttachShader(shaderId, vertex);
            glAttachShader(shaderId, fragment);
            glLinkProgram(shaderId);
            GL_ERR_CHECK("link shader");

            // delete the shaders as they're linked into our program now
            glDeleteShader(vertex);

            initialized = true;
        }
        glDeleteShader(fragment);

        return initialized;
    }

    bool Use() {
        if (!initialized && !Create())
            return false;

        glUseProgram(shaderId);
        return true;
    }
}

namespace RenderThread {
    bool globalInit = false;
    EGLDisplay display;
    EGLConfig config;
    EGLContext context;

    void InitGlobals() {
        if (globalInit)
            return;

        LOG_INFO("Initializing EGL render thread globals");

        display = eglGetDisplay(EGL_DEFAULT_DISPLAY);
        EGL_BOOL_CHECK(eglInitialize(display, 0, 0), "initialize");

        LOG_DEBUG("EGL version {}", eglQueryString(display, EGL_VERSION));

        context = eglGetCurrentContext();

        EGLint numConfigs;
        EGL_BOOL_CHECK(eglChooseConfig(display, attribs, &config, 1, &numConfigs), "choose config");

#ifdef GL_DEBUG
        eglLogConfig(display, config);

        glEnable(GL_DEBUG_OUTPUT);
        glEnable(GL_DEBUG_OUTPUT_SYNCHRONOUS);
        glDebugMessageCallback(GLDebugMessageCallback, 0);
        GL_ERR_CHECK("callback");
#endif

        globalInit = true;
    }

    void InitId(int id) {
        EGLState::Save();

        InitGlobals();

        LOG_INFO("Initializing EGL for streamer {}", id);

        auto streamer = CameraStreamer::GetById(id);
        streamer->surface = eglCreateWindowSurface(display, config, streamer->window, 0);
        EGL_BOOL_CHECK(eglMakeCurrent(display, streamer->surface, streamer->surface, context), "make current");

#ifdef NO_GAMMA_SHADER
        GLuint fboId;
        glGenFramebuffers(1, &fboId);
        streamer->buffer = fboId;
#else
        GLuint vboId;
        glGenVertexArrays(1, &vboId);
        streamer->buffer = vboId;
#endif

        EGLState::Load();
    }

    void UpdateId(int id) {
        EGLState::Save();

        auto streamer = CameraStreamer::GetById(id);
        EGL_BOOL_CHECK(eglMakeCurrent(display, streamer->surface, streamer->surface, context), "make current");

#ifdef NO_GAMMA_SHADER
        glBindFramebuffer(GL_READ_FRAMEBUFFER, streamer->buffer);
        GL_ERR_CHECK("bind fbo");
        glFramebufferTexture2D(GL_READ_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, streamer->texture, 0);
        GL_ERR_CHECK("fbo tex");
        glBindFramebuffer(GL_DRAW_FRAMEBUFFER, 0);
        GL_ERR_CHECK("bind draw fbo");
        glBlitFramebuffer(0, 0, streamer->width, streamer->height, 0, 0, streamer->width, streamer->height, GL_COLOR_BUFFER_BIT, GL_NEAREST);
        GL_ERR_CHECK("blit fbo");
#else
        glViewport(0, 0, streamer->width, streamer->height);
        GL_ERR_CHECK("viewport");
        glActiveTexture(GL_TEXTURE0);
        GL_ERR_CHECK("active tex");
        glBindTexture(GL_TEXTURE_2D, streamer->texture);
        GL_ERR_CHECK("bind tex");
        GammaShader::Use();
        GL_ERR_CHECK("use shader");
        glBindFramebuffer(GL_DRAW_FRAMEBUFFER, 0);
        GL_ERR_CHECK("bind draw fbo");
        glBindVertexArray(streamer->buffer);
        GL_ERR_CHECK("bind vbo");
        glDisable(GL_CULL_FACE);
        glDisable(GL_DEPTH_TEST);
        glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
        GL_ERR_CHECK("draw");
#endif

        EGL_BOOL_CHECK(eglSwapBuffers(display, streamer->surface), "swap buffers");

        EGLState::Load();
    }

    void StopId(int id) {
        EGLState::Save();

        auto streamer = CameraStreamer::GetById(id);
        eglDestroySurface(display, streamer->surface);
        streamer->surface = nullptr;

#ifdef NO_GAMMA_SHADER
        GLuint fboId = streamer->buffer;
        glDeleteFramebuffers(1, &fboId);
#else
        GLuint vboId = streamer->buffer;
        glDeleteVertexArrays(1, &vboId);
#endif
        streamer->buffer = -1;

        streamer->FinishStop();

        EGLState::Load();
    }
}

void IssuePluginEvent(void (*function)(int), int id) {
    static auto icall = il2cpp_utils::resolve_icall<void, void*, int>("UnityEngine.GL::GLIssuePluginEvent");
    icall((void*) function, id);
}

// whole game freezes after a few frames, no idea why
// namespace MediaCodecAsync {
//     static void OnInputAvailable(AMediaCodec* codec, void* userdata, int32_t index) {}

//     static void OnOutputAvailable(AMediaCodec* codec, void* userdata, int32_t index, AMediaCodecBufferInfo* bufferInfo) {
//         auto streamer = (CameraStreamer*) userdata;
//         size_t outSize;
//         uint8_t* data = AMediaCodec_getOutputBuffer(codec, index, &outSize);
//         streamer->framesProcessing--;
//         streamer->onOutputFrame(data, bufferInfo->size);
//         fwrite(data, sizeof(uint8_t), bufferInfo->size, f);
//         AMediaCodec_releaseOutputBuffer(codec, index, false);
//     }

//     static void OnFormatChanged(AMediaCodec* codec, void* userdata, AMediaFormat* format) {}

//     static void OnError(AMediaCodec* codec, void* userdata, media_status_t error, int32_t actionCode, char const* detail) {
//         LOG_ERROR("MediaCodec error: {} {}: {}", (int) error, actionCode, detail);
//     }

//     static AMediaCodecOnAsyncNotifyCallback Callbacks = {
//         .onAsyncInputAvailable = OnInputAvailable,
//         .onAsyncOutputAvailable = OnOutputAvailable,
//         .onAsyncFormatChanged = OnFormatChanged,
//         .onAsyncError = OnError
//     };
// }

void CameraStreamer::Init(int width, int height, int bitrate) {
    if (initializedEncoder)
        return;

    std::unique_lock lock(idMapMutex);
    if (id >= 0)
        idMap.erase(id);

    id = maxId++;
    idMap[id] = this;
    lock.unlock();

    LOG_INFO("Initializing encoder for streamer {}: w/h {} {} br {}", id, width, height, bitrate);

    this->width = width;
    this->height = height;

    AMediaFormat* format = AMediaFormat_new();
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_WIDTH, width);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_HEIGHT, height);
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_BIT_RATE, bitrate);

    AMediaFormat_setString(format, AMEDIAFORMAT_KEY_MIME, "video/avc");  // H.264
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_COLOR_FORMAT, 0x7f000789);  // COLOR_FormatSurface
    AMediaFormat_setFloat(format, AMEDIAFORMAT_KEY_FRAME_RATE, -1);  // needs to be set to something
    AMediaFormat_setInt32(format, AMEDIAFORMAT_KEY_I_FRAME_INTERVAL, 30);

    encoder = AMediaCodec_createEncoderByType("video/avc");
    if (!encoder) {
        LOG_ERROR("Failed to create encoder");
        return;
    }

    char* name;
    AMediaCodec_getName(encoder, &name);
    LOG_DEBUG("Using encoder {}", name);
    AMediaCodec_releaseName(encoder, name);

    // AMediaCodec_setAsyncNotifyCallback(encoder, MediaCodecAsync::Callbacks, this);

    media_status_t err = AMediaCodec_configure(encoder, format, NULL, NULL, AMEDIACODEC_CONFIGURE_FLAG_ENCODE);
    AMediaFormat_delete(format);

    if (err != AMEDIA_OK) {
        LOG_ERROR("Configure error: {}", (int) err);
        AMediaCodec_delete(encoder);
        return;
    }

    format = AMediaCodec_getInputFormat(encoder);
    LOG_DEBUG("Using input format {}", AMediaFormat_toString(format));
    AMediaFormat_delete(format);

    format = AMediaCodec_getOutputFormat(encoder);
    LOG_DEBUG("Using output format {}", AMediaFormat_toString(format));
    AMediaFormat_delete(format);

    err = AMediaCodec_createInputSurface(encoder, &window);
    if (err != AMEDIA_OK) {
        LOG_ERROR("Create surface error: {}", (int) err);
        AMediaCodec_delete(encoder);
        return;
    }

    err = AMediaCodec_start(encoder);
    if (err != AMEDIA_OK) {
        LOG_ERROR("Start error: {}", (int) err);
        AMediaCodec_delete(encoder);
        return;
    }

    f = fopen("/sdcard/test.h264", "wb");
    if (!f)
        logger.error("Could not open /sdcard/test.h264");

    framesProcessing = 0;
    initializedEncoder = true;

    stopThread = false;
    threadInst = std::thread(&CameraStreamer::EncodingThread, this);

    LOG_INFO("Finished initializing encoder");
}

void CameraStreamer::Stop() {
    LOG_INFO("Stopping streamer {}", id);

    if (initializedEgl)
        IssuePluginEvent(RenderThread::StopId, id);
    initializedEgl = false;
    stopThread = true;
    threadInst.join();
    // wait until the event happens before we do the rest
}

void CameraStreamer::FinishStop() {
    if (initializedEncoder) {
        ANativeWindow_release(window);
        AMediaCodec_stop(encoder);
        AMediaCodec_delete(encoder);
        encoder = nullptr;
        initializedEncoder = false;
    }

    std::unique_lock lock(idMapMutex);
    LOG_INFO("Finished stopping streamer {}", id);

    idMap.erase(id);
    id = -1;

    fclose(f);
    f = nullptr;
}

void CameraStreamer::Update() {
    if (!initializedEncoder)
        return;

    if (!initializedEgl) {
        IssuePluginEvent(RenderThread::InitId, id);
        initializedEgl = true;
    }

    framesProcessing++;
    // can add max frames processing or other restrictions here if needed
    IssuePluginEvent(RenderThread::UpdateId, id);
}

void CameraStreamer::OnDestroy() {
    Stop();
}

CameraStreamer* CameraStreamer::GetById(int id) {
    std::shared_lock lock(idMapMutex);
    return idMap[id];
}

void CameraStreamer::EncodingThread() {
    AMediaCodecBufferInfo bufferInfo;

    LOG_DEBUG("starting thread");

    while (!stopThread) {
        ssize_t index = AMediaCodec_dequeueOutputBuffer(encoder, &bufferInfo, 10000);

        if (index >= 0) {
            // frame!
            size_t outSize;
            uint8_t* data = AMediaCodec_getOutputBuffer(encoder, index, &outSize);

            // note: make sure to write the CODEC_CONFIG to have a valid raw .h264 file

            // not sure what outSize represents, but it seems wrong
            if (bufferInfo.size != 0) {
                framesProcessing--;

                // bufferInfo.offset seems to always be 0 for encoding
                onOutputFrame(data, bufferInfo.size);
                fwrite(data, sizeof(uint8_t), bufferInfo.size, f);
            }

            AMediaCodec_releaseOutputBuffer(encoder, index, false);

            if ((bufferInfo.flags & AMEDIACODEC_BUFFER_FLAG_END_OF_STREAM) != 0)
                break;
        }
    }

    LOG_DEBUG("stopping thread");
}
#endif

#endif
