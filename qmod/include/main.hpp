#pragma once

#include "beatsaber-hook/shared/utils/logging.hpp"
#include "beatsaber-hook/shared/utils/il2cpp-utils.hpp"
#include "beatsaber-hook/shared/utils/typedefs.h"
#include "beatsaber-hook/shared/utils/typedefs-string.hpp"

#include "protobuf/qrue.pb.h"

#define typeIsValuetype(type) il2cpp_functions::class_from_il2cpp_type(type)->valuetype

Logger& getLogger();

#define LOG_INFO(...) getLogger().info(__VA_ARGS__)

std::string GetDataPath();

void scheduleFunction(std::function<void()> func);
