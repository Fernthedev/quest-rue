#include "MainThreadRunner.hpp"
#include "main.hpp"

#ifdef BEAT_SABER
#include "CameraController.hpp"
#include "UnityEngine/Input.hpp"
#include "UnityEngine/KeyCode.hpp"
#endif

#include <functional>
#include <thread>

DEFINE_TYPE(QRUE, MainThreadRunner);

using namespace QRUE;

std::thread::id mainThreadId;

static std::vector<std::function<void()>> scheduledFunctions{};
static std::mutex scheduleLock;
static MainThreadRunner *mainThreadRunnerInstance;

void scheduleFunction(std::function<void()> const &func) {
    if (mainThreadId == std::this_thread::get_id()) {
        func();
        return;
    }

    std::unique_lock<std::mutex> lock(scheduleLock);
    scheduledFunctions.emplace_back(func);
}

void MainThreadRunner::Awake() {
    this->keepAliveObjects = System::Collections::Generic::List_1<Il2CppObject*>::New_ctor();
    mainThreadRunnerInstance = this;
}

MainThreadRunner *getUnityHandle() { return mainThreadRunnerInstance; }

void MainThreadRunner::Update() {

#ifdef BEAT_SABER
    // listen for fpfc enable key (C)
    if(UnityEngine::Input::GetKey(UnityEngine::KeyCode::Z)) {
        enabled = true;
        EnableFPFC();
    }
#endif

    if(scheduledFunctions.empty())
        return;

    LOG_INFO("Running scheduled functions on main thread");
    std::unique_lock<std::mutex> lock(scheduleLock);
    std::vector<std::function<void()>> functions(std::move(scheduledFunctions));
    scheduledFunctions.clear();
    lock.unlock();

    for (auto const& function : functions)
        function();
}

void MainThreadRunner::addKeepAlive(Il2CppObject* obj) {
    if (this->keepAliveObjects->Contains(obj))
        return;

    this->keepAliveObjects->Add(obj);
}
void MainThreadRunner::removeKeepAlive(Il2CppObject *obj) {
    this->keepAliveObjects->Remove(obj);
}
