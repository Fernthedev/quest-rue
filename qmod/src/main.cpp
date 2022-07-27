#include "main.hpp"
#include "objectdump.hpp"
#include "classutils.hpp"
#include "manager.hpp"
#include "MainThreadRunner.hpp"

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

// MainThreadRunner.cpp
extern std::thread::id mainThreadId;

Logger& getLogger() {
    static Logger* logger = new Logger(ModInfo{"QuestEditor", "1.0.0"}, new LoggerOptions(false, true));
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
    LOG_INFO("Completed setup!");
}

extern "C" void load()
{
    LOG_INFO("Installing hooks...");
    il2cpp_functions::Init();

    custom_types::Register::AutoRegister();

    mainThreadId = std::this_thread::get_id();

    LOG_INFO("Initializing connection manager");
    Manager::GetInstance()->Init();

    std::function<void(UnityEngine::SceneManagement::Scene, ::UnityEngine::SceneManagement::LoadSceneMode)> onSceneChanged = [](UnityEngine::SceneManagement::Scene scene, ::UnityEngine::SceneManagement::LoadSceneMode)
    {
        static bool loaded;
        if (!scene.IsValid() || loaded)
            return;

        loaded = true;

        IL2CPP_CATCH_HANDLER(
            auto go = UnityEngine::GameObject::New_ctor("QuestRUE");
            UnityEngine::Object::DontDestroyOnLoad(go);
            go->AddComponent<QRUE::MainThreadRunner *>();
        )
    };

    auto delegate = custom_types::MakeDelegate<UnityEngine::Events::UnityAction_2<::UnityEngine::SceneManagement::Scene, ::UnityEngine::SceneManagement::LoadSceneMode> *>(onSceneChanged);

    UnityEngine::SceneManagement::SceneManager::add_sceneLoaded(delegate);
}