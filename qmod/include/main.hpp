#pragma once

#include "beatsaber-hook/shared/utils/logging.hpp"
#include "beatsaber-hook/shared/utils/il2cpp-utils.hpp"
#include "beatsaber-hook/shared/utils/typedefs.h"
#include "beatsaber-hook/shared/utils/typedefs-string.hpp"

#include "protobuf/qrue.pb.h"

#include "paper/shared/logger.hpp"

#include "fmt/format.h"

#define typeIsValuetype(type) il2cpp_functions::class_from_il2cpp_type(type)->valuetype
#define klassIsValuetype(type) type->valuetype

static inline auto PaperQLogger = Paper::Logger::WithContext<"QuestEditor", false>();

Logger& getLogger();

#define LOG_INFO(...) PaperQLogger.fmtLog<Paper::LogLevel::INF>(__VA_ARGS__);

std::string_view GetDataPath();

void scheduleFunction(std::function<void()> const& func);
