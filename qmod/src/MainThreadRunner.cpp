#include "main.hpp"
#include "MainThreadRunner.hpp"

#include <functional>
#include <thread>

DEFINE_TYPE(QRUE, MainThreadRunner);

using namespace QRUE;

std::thread::id mainThreadId;

static std::vector<std::function<void()>> scheduledFunctions{};
static std::mutex scheduleLock;

void scheduleFunction(std::function<void()> const &func) {
    if (mainThreadId == std::this_thread::get_id())
        func();

    std::unique_lock<std::mutex> lock(scheduleLock);
    scheduledFunctions.emplace_back(func);
}

void MainThreadRunner::Update() {
    if (!scheduledFunctions.empty()) {
        LOG_INFO("Running scheduled functions on main thread");
        std::unique_lock<std::mutex> lock(scheduleLock);
        std::vector<std::function<void()>> functions(std::move(scheduledFunctions));
        scheduledFunctions.clear();
        lock.unlock();

        for (auto const &function : functions) {
            function();
        }
    }
}