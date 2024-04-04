#include "main.hpp"

#include "CameraController.hpp"
#include "MainThreadRunner.hpp"
#include "UnityEngine/Events/UnityAction_2.hpp"
#include "UnityEngine/GameObject.hpp"
#include "UnityEngine/SceneManagement/LoadSceneMode.hpp"
#include "UnityEngine/SceneManagement/Scene.hpp"
#include "UnityEngine/SceneManagement/SceneManager.hpp"
#include "beatsaber-hook/shared/config/config-utils.hpp"
#include "beatsaber-hook/shared/utils/hooking.hpp"
#include "custom-types/shared/delegate.hpp"
#include "custom-types/shared/register.hpp"
#include "manager.hpp"
#include "scotland2/shared/modloader.h"

static modloader::ModInfo modInfo{MOD_ID, VERSION, 1};

using namespace UnityEngine;

void onSceneLoad(SceneManagement::Scene scene, SceneManagement::LoadSceneMode) {
    static bool loaded;
    if (!scene.IsValid() || loaded)
        return;
    loaded = true;

    IL2CPP_CATCH_HANDLER(auto go = UnityEngine::GameObject::New_ctor("QuestRUE"); UnityEngine::Object::DontDestroyOnLoad(go);
                         go->AddComponent<QRUE::MainThreadRunner*>();)
}

std::string_view GetDataPath() {
    static std::string s(getDataDir(modInfo));
    return s;
}

extern "C" void setup(CModInfo* info) {
    Paper::Logger::RegisterFileContextId("QuestEditor");
    Paper::Logger::RegisterFileContextId("SocketLib");

    *info = modInfo.to_c();

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
    if (!cam)
        return;

    auto go = cam->get_gameObject();
    if (auto existing = go->GetComponent<QRUE::CameraController*>())
        existing->set_enabled(true);
    else
        go->AddComponent<QRUE::CameraController*>();
}

void DisableFPFC() {
    auto cam = UnityEngine::Camera::get_main();
    if (!cam)
        return;

    auto go = cam->get_gameObject();
    if (auto existing = go->GetComponent<QRUE::CameraController*>())
        existing->set_enabled(false);
}

#include "GlobalNamespace/DefaultScenesTransitionsFromInit.hpp"

MAKE_HOOK_MATCH(DefaultScenesTransitionsFromInit_TransitionToNextScene,
    &DefaultScenesTransitionsFromInit::TransitionToNextScene,
    void,
    DefaultScenesTransitionsFromInit* self,
    bool goStraightToMenu,
    bool goStraightToEditor,
    bool goToRecordingToolScene) {

    DefaultScenesTransitionsFromInit_TransitionToNextScene(self, true, goStraightToEditor, goToRecordingToolScene);
}

#include "GlobalNamespace/GameScenesManager.hpp"
#include "System/Action_1.hpp"
#include "Zenject/DiContainer.hpp"

MAKE_HOOK_MATCH(GameScenesManager_ScenesTransitionCoroutine,
    &GameScenesManager::ScenesTransitionCoroutine,
    System::Collections::IEnumerator*,
    GameScenesManager* self,
    GlobalNamespace::ScenesTransitionSetupDataSO* newScenesTransitionSetupData,
    System::Collections::Generic::List_1<StringW>* scenesToPresent,
    GlobalNamespace::__GameScenesManager__ScenePresentType presentType,
    System::Collections::Generic::List_1<StringW>* scenesToDismiss,
    GlobalNamespace::__GameScenesManager__SceneDismissType dismissType,
    float_t minDuration,
    System::Action* afterMinDurationCallback,
    System::Action_1<Zenject::DiContainer*>* extraBindingsCallback,
    System::Action_1<Zenject::DiContainer*>* finishCallback) {

    DisableFPFC();

    finishCallback = (System::Action_1<Zenject::DiContainer*>*) System::MulticastDelegate::Combine(finishCallback,
        custom_types::MakeDelegate<System::Action_1<Zenject::DiContainer*>*>((std::function<void(Zenject::DiContainer*)>) [](Zenject::DiContainer*) {
            if (fpfcEnabled)
                EnableFPFC();
        }));

    return GameScenesManager_ScenesTransitionCoroutine(self,
        newScenesTransitionSetupData,
        scenesToPresent,
        presentType,
        scenesToDismiss,
        dismissType,
        minDuration,
        afterMinDurationCallback,
        extraBindingsCallback,
        finishCallback);
}

#include "VRUIControls/ButtonState.hpp"
#include "VRUIControls/MouseButtonEventData.hpp"
#include "VRUIControls/MouseState.hpp"
#include "VRUIControls/VRInputModule.hpp"

static bool clickedLastFrame = false;

MAKE_HOOK_MATCH(VRInputModule_GetMousePointerEventData,
    &VRUIControls::VRInputModule::GetMousePointerEventData,
    VRUIControls::MouseState*,
    VRUIControls::VRInputModule* self,
    int id) {

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

#include "GlobalNamespace/VRPlatformUtils.hpp"
#include "UnityEngine/Input.hpp"

MAKE_HOOK_MATCH(VRPlatformUtils_GetAnyJoystickMaxAxisDefaultImplementation,
    &VRPlatformUtils::GetAnyJoystickMaxAxisDefaultImplementation,
    Vector2,
    IVRPlatformHelper* self) {

    auto ret = VRPlatformUtils_GetAnyJoystickMaxAxisDefaultImplementation(self);
    if (fpfcEnabled)
        return {0, UnityEngine::Input::GetAxis("Mouse ScrollWheel")};
    return ret;
}

#include "GlobalNamespace/UIKeyboardManager.hpp"

MAKE_HOOK_MATCH(UIKeyboardManager_OpenKeyboardFor, &UIKeyboardManager::OpenKeyboardFor, void, UIKeyboardManager* self, HMUI::InputFieldView* input) {

    UIKeyboardManager_OpenKeyboardFor(self, input);

    keyboardOpen = self->_uiKeyboard;
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
    INSTALL_HOOK(logger, DefaultScenesTransitionsFromInit_TransitionToNextScene);
    INSTALL_HOOK(logger, VRPlatformUtils_GetAnyJoystickMaxAxisDefaultImplementation);
    INSTALL_HOOK(logger, VRInputModule_GetMousePointerEventData);
    INSTALL_HOOK(logger, UIKeyboardManager_OpenKeyboardFor);
    INSTALL_HOOK(logger, UIKeyboardManager_CloseKeyboard);
    INSTALL_HOOK(logger, GameScenesManager_ScenesTransitionCoroutine);
    LOG_INFO("Installed hooks!");
#endif

    mainThreadId = std::this_thread::get_id();

    LOG_INFO("Initializing connection manager");
    Manager::GetInstance()->Init();

    std::function<void(SceneManagement::Scene scene, SceneManagement::LoadSceneMode)> onSceneChanged = onSceneLoad;

    auto delegate = custom_types::MakeDelegate<Events::UnityAction_2<SceneManagement::Scene, SceneManagement::LoadSceneMode>*>(onSceneChanged);

    SceneManagement::SceneManager::add_sceneLoaded(delegate);
}
