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
#include "GlobalNamespace/DefaultScenesTransitionsFromInit.hpp"

using namespace GlobalNamespace;

MAKE_HOOK_MATCH(
    DefaultScenesTransitionsFromInit_TransitionToNextScene,
    &DefaultScenesTransitionsFromInit::TransitionToNextScene,
    void,
    DefaultScenesTransitionsFromInit* self,
    bool goStraightToMenu,
    bool goStraightToEditor,
    bool goToRecordingToolScene,
    System::Action* onFinishShaderWarmup
) {
    DefaultScenesTransitionsFromInit_TransitionToNextScene(self, true, goStraightToEditor, goToRecordingToolScene, onFinishShaderWarmup);
}
#endif

extern "C" void load() {
    il2cpp_functions::Init();

    custom_types::Register::AutoRegister();

#ifdef BEAT_SABER
    LOG_INFO("Installing hooks...");
    INSTALL_HOOK(logger, DefaultScenesTransitionsFromInit_TransitionToNextScene);
    LOG_INFO("Installed hooks!");
#endif

    mainThreadId = std::this_thread::get_id();

    LOG_INFO("Initializing connection manager");
    Manager::GetInstance()->Init();

    std::function<void(SceneManagement::Scene scene, SceneManagement::LoadSceneMode)> onSceneChanged = onSceneLoad;

    auto delegate = custom_types::MakeDelegate<Events::UnityAction_2<SceneManagement::Scene, SceneManagement::LoadSceneMode>*>(onSceneChanged);

    SceneManagement::SceneManager::add_sceneLoaded(delegate);

    LOG_INFO("Completed load!");
}
