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
#include "UnityEngine/Resources.hpp"
#include "UnityEngine/SceneManagement/LoadSceneMode.hpp"
#include "UnityEngine/SceneManagement/Scene.hpp"
#include "UnityEngine/SceneManagement/SceneManager.hpp"
#include "UnityEngine/StereoTargetEyeMask.hpp"
#include "UnityEngine/TextureWrapMode.hpp"
#include "beatsaber-hook/shared/config/config-utils.hpp"
#include "beatsaber-hook/shared/utils/hooking.hpp"
#include "custom-types/shared/delegate.hpp"
#include "custom-types/shared/register.hpp"
#include "hollywood/shared/hollywood.hpp"
#include "manager.hpp"
#include "scotland2/shared/modloader.h"

static modloader::ModInfo modInfo{MOD_ID, VERSION, 1};

using namespace UnityEngine;
using namespace websocketpp;

static Camera* mainCamera = nullptr;
static QRUE::CameraController* fpfc = nullptr;
static Hollywood::CameraCapture* streamer;

typedef websocketpp::server<websocketpp::config::asio> WebSocketServer;
static std::unique_ptr<WebSocketServer> streamSocketHandler;
static std::set<websocketpp::connection_hdl, std::owner_less<websocketpp::connection_hdl>> connections;

void onSceneLoad(SceneManagement::Scene scene, SceneManagement::LoadSceneMode) {
    mainCamera = Resources::FindObjectsOfTypeAll<Camera*>()->FirstOrDefault([](Camera* c) { return c->tag == "MainCamera"; });

    LOG_DEBUG("scene load, main camera is {}", fmt::ptr(mainCamera));

    if (fpfc) {
        if (UnityW(mainCamera))
            mainCamera->set_enabled(!fpfc->get_enabled());
#ifdef BEAT_SABER
        if (fpfc->get_enabled())
            fpfc->GetControllers();
#endif
    }

    static bool loaded;
    if (!scene.IsValid() || loaded)
        return;
    loaded = true;

    auto go = GameObject::New_ctor("QuestRUE");
    Object::DontDestroyOnLoad(go);
    go->AddComponent<QRUE::MainThreadRunner*>();

    go->AddComponent<Camera*>();
    fpfc = go->AddComponent<QRUE::CameraController*>();
    fpfc->set_enabled(false);
    streamer = go->AddComponent<Hollywood::CameraCapture*>();
    streamer->onOutputUnit = [](uint8_t* data, size_t length) {
        if (!streamSocketHandler)
            return;
        for (auto const& hdl : connections) {
            try {
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
            if (connections.empty()) {
                if (UnityW(mainCamera))
                    mainCamera->set_enabled(true);
                fpfc->set_enabled(false);
            }
        });
    });
    streamSocketHandler->set_message_handler([](websocketpp::connection_hdl hdl, WebSocketServer::message_ptr msg) {
        scheduleFunction([packet = std::string(msg->get_payload().data(), msg->get_payload().size())]() {
            if (packet.starts_with("key") && packet.size() >= 5) {
                std::string key = packet.substr(4);
                if (packet[3] == 'd')
                    fpfc->KeyDown(key);
                else
                    fpfc->KeyUp(key);
            } else if (packet.starts_with("mse") && packet.size() >= 4) {
                if (packet[3] == 'd')
                    fpfc->MouseDown();
                else if (packet[3] == 'u')
                    fpfc->MouseUp();
                else {
                    float x = std::stoi(packet.substr(3, 4));
                    float y = std::stoi(packet.substr(7, 4));
                    fpfc->Rotate({x, y});
                }
            } else if (packet.starts_with("scr") && packet.size() >= 4) {
                float scroll = std::stof(packet.substr(3, 5));
                fpfc->AddScroll(scroll);
            } else if (packet.starts_with("start")) {
                moveSensitivity = std::stof(packet.substr(5, 5));
                rotateSensitivity = std::stof(packet.substr(10, 5));
                int fps = std::stoi(packet.substr(15, 3));
                float fov = std::stof(packet.substr(18, 5)) * 20;
                streamer->Init(1080, 720, fps, 10000000, fov);
                if (UnityW(mainCamera))
                    mainCamera->set_enabled(false);
                fpfc->set_enabled(true);
            }
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
#include "GlobalNamespace/OculusVRHelper.hpp"
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

MAKE_HOOK_MATCH(
    VRInputModule_GetMousePointerEventData,
    &VRUIControls::VRInputModule::GetMousePointerEventData,
    VRUIControls::MouseState*,
    VRUIControls::VRInputModule* self,
    int id
) {
    using EventData = UnityEngine::EventSystems::PointerEventData;

    static bool clickedLastFrame = false;

    auto ret = VRInputModule_GetMousePointerEventData(self, id);
    if (fpfc && fpfc->get_enabled()) {
        auto state = EventData::FramePressState::NotChanged;
        if (click && !clickedLastFrame)
            state = EventData::FramePressState::Pressed;
        if (!click && clickedLastFrame)
            state = EventData::FramePressState::Released;
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
    if (fpfc && fpfc->get_enabled())
        return {0, fpfc->GetScroll()};
    return ret;
}

MAKE_HOOK_MATCH(
    OculusVRHelper_TriggerHapticPulse,
    &OculusVRHelper::TriggerHapticPulse,
    void,
    OculusVRHelper* self,
    XR::XRNode node,
    float duration,
    float strength,
    float frequency
) {
    if (fpfc && fpfc->get_enabled())
        return;

    OculusVRHelper_TriggerHapticPulse(self, node, duration, strength, frequency);
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
    // self->_camera->enabled = false;

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
    Hollywood::Init();

    custom_types::Register::AutoRegister();

#ifdef BEAT_SABER
    LOG_INFO("Installing hooks...");
    INSTALL_HOOK(logger, DefaultScenesTransitionsFromInit_TransitionToNextScene);
    INSTALL_HOOK(logger, VRPlatformUtils_GetAnyJoystickMaxAxisDefaultImplementation);
    INSTALL_HOOK(logger, VRInputModule_GetMousePointerEventData);
    INSTALL_HOOK(logger, OculusVRHelper_TriggerHapticPulse);
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
