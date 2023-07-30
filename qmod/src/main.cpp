#include "main.hpp"
#include "objectdump.hpp"
#include "classutils.hpp"
#include "manager.hpp"
#include "MainThreadRunner.hpp"
#include "CameraController.hpp"

#include "UnityEngine/GameObject.hpp"
#include "UnityEngine/SceneManagement/SceneManager.hpp"
#include "UnityEngine/SceneManagement/Scene.hpp"
#include "UnityEngine/SceneManagement/LoadSceneMode.hpp"
#include "UnityEngine/Events/UnityAction_2.hpp"

#include "beatsaber-hook/shared/utils/il2cpp-utils.hpp"
#include "beatsaber-hook/shared/utils/utils.h"
#include "beatsaber-hook/shared/config/config-utils.hpp"
#include "beatsaber-hook/shared/utils/hooking.hpp"

#include "custom-types/shared/register.hpp"
#include "custom-types/shared/delegate.hpp"

#include <filesystem>

static ModInfo modInfo{MOD_ID, VERSION};

using namespace UnityEngine;

void onSceneLoad(SceneManagement::Scene scene, SceneManagement::LoadSceneMode) {
    static bool loaded;
    if(!scene.IsValid() || loaded)
        return;
    loaded = true;

    IL2CPP_CATCH_HANDLER(
        auto go = UnityEngine::GameObject::New_ctor("QuestRUE");
        UnityEngine::Object::DontDestroyOnLoad(go);
        go->AddComponent<QRUE::MainThreadRunner*>();
    )
}

Logger &getLogger()
{
    static Logger* logger = new Logger(modInfo, new LoggerOptions(false, true));
    return *logger;
}

std::string_view GetDataPath() {
    static std::string s(getDataDir(modInfo));
    return s;
}

extern "C" void setup(ModInfo& info) {
    Paper::Logger::RegisterFileContextId("QuestEditor");
    Paper::Logger::RegisterFileContextId("SocketLib");

    info.id = MOD_ID;
    info.version = VERSION;
    modInfo = info;

    auto dataPath = GetDataPath();
    if (!direxists(dataPath))
        mkpath(dataPath);

#ifdef BEAT_SABER
    setenv("QuestRUE", "", 0);
#endif

    LOG_INFO("Completed setup!");
}

#ifdef BEAT_SABER
#include "UnityEngine/Camera.hpp"

using namespace GlobalNamespace;

void EnableFPFC() {
    LOG_INFO("Enabling camera controller");

    auto cam = UnityEngine::Camera::get_main();
    if(!cam)
        return;

    auto go = cam->get_gameObject();
    if(auto existing = go->GetComponent<QRUE::CameraController*>())
        existing->set_enabled(true);
    else
        go->AddComponent<QRUE::CameraController*>();
}

#include "GlobalNamespace/DefaultScenesTransitionsFromInit.hpp"

MAKE_HOOK_MATCH(DefaultScenesTransitionsFromInit_TransitionToNextScene, &DefaultScenesTransitionsFromInit::TransitionToNextScene, void, DefaultScenesTransitionsFromInit* self, bool goStraightToMenu, bool goStraightToEditor, bool goToRecordingToolScene) {

    DefaultScenesTransitionsFromInit_TransitionToNextScene(self, true, goStraightToEditor, goToRecordingToolScene);
}

#include "GlobalNamespace/MainMenuViewController.hpp"

MAKE_HOOK_MATCH(MainMenuViewController_DidActivate, &MainMenuViewController::DidActivate, void, MainMenuViewController* self, bool firstActivation, bool addedToHierarchy, bool screenSystemEnabling) {

    MainMenuViewController_DidActivate(self, firstActivation, addedToHierarchy, screenSystemEnabling);

    if(enabled)
        EnableFPFC();
}

#include "GlobalNamespace/AudioTimeSyncController.hpp"

MAKE_HOOK_MATCH(AudioTimeSyncController_Start, &AudioTimeSyncController::Start, void, AudioTimeSyncController* self) {

    AudioTimeSyncController_Start(self);

    if(enabled)
        EnableFPFC();
}

#include "VRUIControls/VRInputModule.hpp"
#include "VRUIControls/MouseState.hpp"
#include "VRUIControls/ButtonState.hpp"
#include "VRUIControls/MouseButtonEventData.hpp"

MAKE_HOOK_MATCH(VRInputModule_GetMousePointerEventData, &VRUIControls::VRInputModule::GetMousePointerEventData, VRUIControls::MouseState*, VRUIControls::VRInputModule* self, int id) {

    using EventData = UnityEngine::EventSystems::PointerEventData;

    auto ret = VRInputModule_GetMousePointerEventData(self, id);
    ret->GetButtonState(EventData::InputButton::Left)->eventData->buttonState = click ? EventData::FramePressState::PressedAndReleased : EventData::FramePressState::NotChanged;
    click = false;
    return ret;
}

#include "GlobalNamespace/UIKeyboardManager.hpp"

MAKE_HOOK_MATCH(UIKeyboardManager_OpenKeyboardFor, &UIKeyboardManager::OpenKeyboardFor, void, UIKeyboardManager* self, HMUI::InputFieldView* input) {

    UIKeyboardManager_OpenKeyboardFor(self, input);

    keyboardOpen = self->uiKeyboard;
}
MAKE_HOOK_MATCH(UIKeyboardManager_CloseKeyboard, &UIKeyboardManager::CloseKeyboard, void, UIKeyboardManager* self) {

    UIKeyboardManager_CloseKeyboard(self);

    keyboardOpen = nullptr;
}
#endif

extern "C" void load() {
    il2cpp_functions::Init();

    custom_types::Register::AutoRegister();

#ifdef BEAT_SABER
    LOG_INFO("Installing hooks...");
    INSTALL_HOOK(getLogger(), DefaultScenesTransitionsFromInit_TransitionToNextScene);
    INSTALL_HOOK(getLogger(), MainMenuViewController_DidActivate);
    INSTALL_HOOK(getLogger(), AudioTimeSyncController_Start);
    INSTALL_HOOK(getLogger(), VRInputModule_GetMousePointerEventData);
    INSTALL_HOOK(getLogger(), UIKeyboardManager_OpenKeyboardFor);
    INSTALL_HOOK(getLogger(), UIKeyboardManager_CloseKeyboard);
    LOG_INFO("Installed hooks!");
#endif

    mainThreadId = std::this_thread::get_id();

    LOG_INFO("Initializing connection manager");
    Manager::GetInstance()->Init();

    std::function<void(SceneManagement::Scene scene, SceneManagement::LoadSceneMode)> onSceneChanged = onSceneLoad;

    auto delegate = custom_types::MakeDelegate<Events::UnityAction_2<SceneManagement::Scene, SceneManagement::LoadSceneMode>*>(onSceneChanged);

    SceneManagement::SceneManager::add_sceneLoaded(delegate);
}
