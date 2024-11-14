#include "main.hpp"

#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>

#include "CameraController.hpp"
#include "MainThreadRunner.hpp"
#include "UnityEngine/Color.hpp"
#include "UnityEngine/Events/UnityAction_2.hpp"
#include "UnityEngine/FilterMode.hpp"
#include "UnityEngine/GameObject.hpp"
#include "UnityEngine/Matrix4x4.hpp"
#include "UnityEngine/Rect.hpp"
#include "UnityEngine/RenderTexture.hpp"
#include "UnityEngine/RenderTextureFormat.hpp"
#include "UnityEngine/RenderTextureReadWrite.hpp"
#include "UnityEngine/SceneManagement/LoadSceneMode.hpp"
#include "UnityEngine/SceneManagement/Scene.hpp"
#include "UnityEngine/SceneManagement/SceneManager.hpp"
#include "UnityEngine/StereoTargetEyeMask.hpp"
#include "UnityEngine/TextureWrapMode.hpp"
#include "beatsaber-hook/shared/config/config-utils.hpp"
#include "beatsaber-hook/shared/utils/hooking.hpp"
#include "custom-types/shared/delegate.hpp"
#include "custom-types/shared/register.hpp"
#include "manager.hpp"
#include "scotland2/shared/modloader.h"

static modloader::ModInfo modInfo{MOD_ID, VERSION, 1};

using namespace UnityEngine;
using namespace websocketpp;

static Camera* mainCamera;
static QRUE::CameraStreamer* streamer;

typedef websocketpp::server<websocketpp::config::asio> WebSocketServer;
static std::unique_ptr<WebSocketServer> streamSocketHandler;
static std::set<websocketpp::connection_hdl, std::owner_less<websocketpp::connection_hdl>> connections;

RenderTexture* CreateCameraTexture(int w, int h) {
    auto texture = RenderTexture::New_ctor(w, h, 24, RenderTextureFormat::Default, RenderTextureReadWrite::Default);
    Object::DontDestroyOnLoad(texture);
    texture->wrapMode = TextureWrapMode::Clamp;
    texture->filterMode = FilterMode::Bilinear;
    texture->Create();
    return texture;
}

inline UnityEngine::Matrix4x4 MatrixTranslate(UnityEngine::Vector3 const& vector) {
    UnityEngine::Matrix4x4 result;
    result.m00 = 1;
    result.m01 = 0;
    result.m02 = 0;
    result.m03 = vector.x;
    result.m10 = 0;
    result.m11 = 1;
    result.m12 = 0;
    result.m13 = vector.y;
    result.m20 = 0;
    result.m21 = 0;
    result.m22 = 1;
    result.m23 = vector.z;
    result.m30 = 0;
    result.m31 = 0;
    result.m32 = 0;
    result.m33 = 1;
    return result;
}

void onSceneLoad(SceneManagement::Scene scene, SceneManagement::LoadSceneMode) {
    if (auto main = Camera::get_main()) {
        main->set_enabled(false);
        mainCamera = main;
    }

    LOG_DEBUG("scene load, main camera is {}", fmt::ptr(mainCamera));

    static bool loaded;
    if (!scene.IsValid() || loaded)
        return;
    loaded = true;

    auto go = GameObject::New_ctor("QuestRUE");
    Object::DontDestroyOnLoad(go);
    go->AddComponent<QRUE::MainThreadRunner*>();

    auto cam = go->AddComponent<Camera*>();

    int w = 1080;
    int h = 720;

    cam->set_stereoTargetEye(StereoTargetEyeMask::None);
    cam->set_backgroundColor({0, 0, 0, 0});
    cam->set_aspect(w / (float) h);
    cam->set_fieldOfView(80);
    cam->set_pixelRect({0, 0, (float) w, (float) h});
    cam->set_rect({0, 0, 1, 1});

#ifdef UNITY_2021
    auto forwardMult = UnityEngine::Vector3::op_Multiply(UnityEngine::Vector3::get_forward(), -49999.5);
    auto mat = UnityEngine::Matrix4x4::Ortho(-99999, 99999, -99999, 99999, 0.001, 99999);
    mat = UnityEngine::Matrix4x4::op_Multiply(mat, MatrixTranslate(forwardMult));
    mat = UnityEngine::Matrix4x4::op_Multiply(mat, cam->worldToCameraMatrix);
    cam->cullingMatrix = mat;
#endif

    auto tex = CreateCameraTexture(w, h);
    cam->set_targetTexture(tex);

    streamer = go->AddComponent<QRUE::CameraStreamer*>();
#ifdef UNITY_2021
    streamer->texture = (uintptr_t) tex->GetNativeTexturePtr().m_value.convert();
#else
    streamer->texture = (uintptr_t) tex->GetNativeTexturePtr();
#endif
    streamer->onOutputFrame = [](uint8_t* data, size_t length) {
        if (!streamSocketHandler)
            return;
        for (auto const& hdl : connections) {
            try {
                // LOG_DEBUG("sending {} data", length);
                streamSocketHandler->send(hdl, (void*) data, length, frame::opcode::value::BINARY);
            } catch (exception const& e) {
                LOG_ERROR("send failed: {}", e.what());
            }
        }
    };

    streamSocketHandler = std::make_unique<WebSocketServer>();
    streamSocketHandler->set_access_channels(log::alevel::none);
    streamSocketHandler->set_error_channels(log::elevel::none);

    streamSocketHandler->init_asio();
    streamSocketHandler->set_reuse_addr(true);
    streamSocketHandler->set_open_handler([](websocketpp::connection_hdl hdl) {
        scheduleFunction([hdl]() {
            connections.clear();
            streamer->Stop();
            connections.insert(hdl);
            LOG_INFO("Connected {} status: connected", hdl.lock().get());
        });
    });
    streamSocketHandler->set_close_handler([](websocketpp::connection_hdl hdl) {
        scheduleFunction([hdl]() {
            streamer->Stop();
            connections.erase(hdl);
            LOG_INFO("Connected {} status: disconnected", hdl.lock().get());
        });
    });
    streamSocketHandler->set_message_handler([](websocketpp::connection_hdl hdl, WebSocketServer::message_ptr msg) {
        scheduleFunction([packet = std::string(msg->get_payload().data(), msg->get_payload().size())]() {
            LOG_DEBUG("got packet {}", packet);
            if (packet == "start")
                streamer->Init(1080, 720, 1000000);
        });
    });

    lib::asio::error_code ec;
    streamSocketHandler->listen(lib::asio::ip::tcp::v4(), 3307, ec);

    streamSocketHandler->start_accept();
    std::thread([]() { streamSocketHandler->run(); }).detach();
}

extern "C" void setup(CModInfo* info) {
    Paper::Logger::RegisterFileContextId("QuestEditor");
    Paper::Logger::RegisterFileContextId("SocketLib");

    *info = modInfo.to_c();

    setenv("QuestRUE", "", 0);

    LOG_INFO("Completed setup!");
}

#ifdef BEAT_SABER
#include "GlobalNamespace/BloomPrePass.hpp"
#include "GlobalNamespace/DefaultScenesTransitionsFromInit.hpp"
#include "GlobalNamespace/MainCamera.hpp"
#include "GlobalNamespace/UIKeyboardManager.hpp"
#include "GlobalNamespace/VRPlatformUtils.hpp"
#include "UnityEngine/Input.hpp"
#include "VRUIControls/ButtonState.hpp"
#include "VRUIControls/MouseButtonEventData.hpp"
#include "VRUIControls/MouseState.hpp"
#include "VRUIControls/VRInputModule.hpp"

using namespace GlobalNamespace;

MAKE_HOOK_MATCH(
    DefaultScenesTransitionsFromInit_TransitionToNextScene,
    &DefaultScenesTransitionsFromInit::TransitionToNextScene,
    void,
    DefaultScenesTransitionsFromInit* self,
    bool goStraightToMenu,
    bool goStraightToEditor,
    bool goToRecordingToolScene
) {
    DefaultScenesTransitionsFromInit_TransitionToNextScene(self, true, goStraightToEditor, goToRecordingToolScene);
}

static bool clickedLastFrame = false;

MAKE_HOOK_MATCH(
    VRInputModule_GetMousePointerEventData,
    &VRUIControls::VRInputModule::GetMousePointerEventData,
    VRUIControls::MouseState*,
    VRUIControls::VRInputModule* self,
    int id
) {
    using EventData = UnityEngine::EventSystems::PointerEventData;

    auto ret = VRInputModule_GetMousePointerEventData(self, id);
    if (fpfcEnabled) {
        auto state = EventData::FramePressState::NotChanged;
        if (click && !clickedLastFrame)
            state = EventData::FramePressState::Pressed;
        if (!click && clickedLastFrame)
            state = EventData::FramePressState::Released;
        if (clickOnce) {
            state = EventData::FramePressState::PressedAndReleased;
            clickOnce = false;
        }
        ret->GetButtonState(EventData::InputButton::Left)->eventData->buttonState = state;
        clickedLastFrame = click;
    } else
        clickedLastFrame = false;
    return ret;
}

MAKE_HOOK_MATCH(
    VRPlatformUtils_GetAnyJoystickMaxAxisDefaultImplementation,
    &VRPlatformUtils::GetAnyJoystickMaxAxisDefaultImplementation,
    Vector2,
    IVRPlatformHelper* self
) {
    auto ret = VRPlatformUtils_GetAnyJoystickMaxAxisDefaultImplementation(self);
    if (fpfcEnabled)
        return {0, UnityEngine::Input::GetAxis("Mouse ScrollWheel")};
    return ret;
}

MAKE_HOOK_MATCH(UIKeyboardManager_OpenKeyboardFor, &UIKeyboardManager::OpenKeyboardFor, void, UIKeyboardManager* self, HMUI::InputFieldView* input) {

    UIKeyboardManager_OpenKeyboardFor(self, input);

    keyboardOpen = self->_uiKeyboard;
}
MAKE_HOOK_MATCH(UIKeyboardManager_CloseKeyboard, &UIKeyboardManager::CloseKeyboard, void, UIKeyboardManager* self) {

    UIKeyboardManager_CloseKeyboard(self);

    keyboardOpen = nullptr;
}

#ifdef UNITY_2021
MAKE_HOOK_MATCH(MainCamera_Awake, &MainCamera::Awake, void, MainCamera* self) {

    MainCamera_Awake(self);

    if (!self->_camera || !streamer)
        return;
    mainCamera = self->_camera;
    self->_camera->enabled = false;

    auto cam = streamer->GetComponent<Camera*>();
    auto mainBloom = self->_camera->GetComponent<BloomPrePass*>();
    if (!cam || !mainBloom)
        return;

    cam->gameObject->SetActive(false);
    auto bloom = cam->gameObject->AddComponent<BloomPrePass*>();
    if (!bloom)
        bloom = cam->GetComponent<BloomPrePass*>();
    bloom->_bloomPrePassEffectContainer = mainBloom->_bloomPrePassEffectContainer;
    bloom->_bloomPrepassRenderer = mainBloom->_bloomPrepassRenderer;
    bloom->_bloomPrePassRenderData = mainBloom->_bloomPrePassRenderData;
    bloom->_mode = mainBloom->_mode;
    bloom->_renderData = mainBloom->_renderData;
    cam->gameObject->SetActive(true);
}
#endif
#endif

extern "C" void load() {
    il2cpp_functions::Init();

    custom_types::Register::AutoRegister();

#ifdef BEAT_SABER
    LOG_INFO("Installing hooks...");
    INSTALL_HOOK(logger, DefaultScenesTransitionsFromInit_TransitionToNextScene);
    INSTALL_HOOK(logger, VRPlatformUtils_GetAnyJoystickMaxAxisDefaultImplementation);
    INSTALL_HOOK(logger, VRInputModule_GetMousePointerEventData);
    INSTALL_HOOK(logger, UIKeyboardManager_OpenKeyboardFor);
    INSTALL_HOOK(logger, UIKeyboardManager_CloseKeyboard);
#ifdef UNITY_2021
    INSTALL_HOOK(logger, MainCamera_Awake);
#endif
    LOG_INFO("Installed hooks!");
#endif

    mainThreadId = std::this_thread::get_id();

    LOG_INFO("Initializing connection manager");
    Manager::GetInstance()->Init();

    std::function<void(SceneManagement::Scene scene, SceneManagement::LoadSceneMode)> onSceneChanged = onSceneLoad;

    auto delegate = custom_types::MakeDelegate<Events::UnityAction_2<SceneManagement::Scene, SceneManagement::LoadSceneMode>*>(onSceneChanged);

    SceneManagement::SceneManager::add_sceneLoaded(delegate);
}
