#include "main.hpp"
#include "objectdump.hpp"
#include "classutils.hpp"
#include "manager.hpp"

#include "beatsaber-hook/shared/utils/il2cpp-utils.hpp"
#include "beatsaber-hook/shared/utils/utils.h"
#include "beatsaber-hook/shared/config/config-utils.hpp"
#include "beatsaber-hook/shared/utils/hooking.hpp"

#include <filesystem>

static ModInfo modInfo;

Logger& getLogger() {
    static Logger* logger = new Logger(modInfo);
    return *logger;
}

std::string GetDataPath() {
    static std::string s(getDataDir(modInfo));
    return s;
}

static int numFunctions = 0;
static std::vector<std::function<void()>> scheduledFunctions{};
static std::mutex scheduleLock;

void scheduleFunction(std::function<void()> func) {
    std::lock_guard<std::mutex> lock(scheduleLock);
    scheduledFunctions.emplace_back(func);
    numFunctions++;
}

// Hooks
MAKE_HOOK_FIND_CLASS_INSTANCE(MainMenu, "", "MainMenuViewController", "DidActivate", void, Il2CppObject* self, bool a1, bool a2, bool a3) {
    MainMenu(self, a1, a2, a3);
    // logHierarchy(GetDataPath() + "mainmenu.txt");
}

MAKE_HOOK_FIND_CLASS_INSTANCE(Update, "", "HMMainThreadDispatcher", "Update", void, Il2CppObject* self) {
    Update(self);
    if(numFunctions > 0) {
        std::lock_guard<std::mutex> lock(scheduleLock);
        numFunctions = 0;
        for(auto& function : scheduledFunctions) {
            LOG_INFO("Running scheduled function on main thread");
            function();
        }
        scheduledFunctions.clear();
    }
}

extern "C" void setup(ModInfo& info) {
    info.id = MOD_ID;
    info.version = VERSION;
    modInfo = info;
    
    auto dataPath = GetDataPath();
    if(!direxists(dataPath))
        mkpath(dataPath);
	
    LOG_INFO("Completed setup!");
}

extern "C" void load() {
    LOG_INFO("Installing hooks...");
    il2cpp_functions::Init();
    
    LOG_INFO("Initializing connection manager");
    Manager::Instance = new Manager();
    Manager::Instance->Init();

    auto logger = getLogger().WithContext("load");
    // Install hooks
    INSTALL_HOOK(logger, Update);
    // INSTALL_HOOK(logger, MainMenu);
    getLogger().info("Installed all hooks!");
}