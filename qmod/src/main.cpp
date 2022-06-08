#include "main.hpp"
#include "objectdump.hpp"
#include "classutils.hpp"
#include "manager.hpp"

#include "beatsaber-hook/shared/utils/il2cpp-utils.hpp"
#include "beatsaber-hook/shared/utils/utils.h"
#include "beatsaber-hook/shared/config/config-utils.hpp"
#include "beatsaber-hook/shared/utils/hooking.hpp"

#include <filesystem>

static ModInfo modInfo{MOD_ID, VERSION};


Logger& getLogger() {
    static Logger* logger = new Logger(ModInfo{"QuestEditor", "1.0.0"}, new LoggerOptions(false, true));
    return *logger;
}


std::string_view GetDataPath() {
    static std::string s(getDataDir(modInfo));
    return s;
}

static std::vector<std::function<void()>> scheduledFunctions{};
static std::mutex scheduleLock;

void scheduleFunction(std::function<void()> const& func) {
    std::unique_lock<std::mutex> lock(scheduleLock);
    scheduledFunctions.emplace_back(func);
}

// Hooks
MAKE_HOOK_FIND_CLASS_INSTANCE(MainMenu, "", "MainMenuViewController", "DidActivate", void, Il2CppObject* self, bool a1, bool a2, bool a3) {
    MainMenu(self, a1, a2, a3);
    // logHierarchy(GetDataPath() + "mainmenu.txt");
}

MAKE_HOOK_FIND_CLASS_INSTANCE(Update, "", "HMMainThreadDispatcher", "Update", void, Il2CppObject* self) {
    Update(self);
    // TODO: Use concurrent queue?
    if (!scheduledFunctions.empty()) {
        std::unique_lock<std::mutex> lock(scheduleLock);
        std::vector<std::function<void()>> functions(std::move(scheduledFunctions));
        scheduledFunctions = {};
        lock.unlock();

        for (auto const& function : functions) {
            LOG_INFO("Running scheduled function on main thread");
            function();
        }
    }
}

void setupLog();

namespace Paper::Logger {
    bool IsInited();
    void Init(std::string_view logPath, LoggerConfig const &config);
}

extern "C" void setup(ModInfo& info) {
    Paper::Logger::RegisterFileContextId("QuestEditor");
    Paper::Logger::RegisterFileContextId("SocketLib");

    if (!Paper::Logger::IsInited()) {
        std::string path = fmt::format("/sdcard/Android/data/{}/files/logs/paper", Modloader::getApplicationId());
        Paper::Logger::Init(path, Paper::LoggerConfig());
    }

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

    LOG_INFO("Initializing connection manager");
    Manager::GetInstance()->Init();

    auto logger = getLogger().WithContext("load");
    // Install hooks
    INSTALL_HOOK(logger, Update);
    // INSTALL_HOOK(logger, MainMenu);
    getLogger().info("Installed all hooks!");
}