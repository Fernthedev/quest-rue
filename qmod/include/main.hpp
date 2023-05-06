#pragma once

#include <cstdint>

#include "beatsaber-hook/shared/utils/logging.hpp"
#include "beatsaber-hook/shared/utils/il2cpp-utils.hpp"
#include "beatsaber-hook/shared/utils/typedefs.h"
#include "beatsaber-hook/shared/utils/typedefs-string.hpp"

#include "protobuf/qrue.pb.h"

#include "paper/shared/logger.hpp"

#include "fmt/format.h"

#define typeIsValuetype(type) il2cpp_functions::class_from_il2cpp_type(type)->valuetype
#define klassIsValuetype(type) type->valuetype

#define VALIDATE_PTR(p)                                                        \
  if (asInt(p) < 0 || asInt(p) > UINTPTR_MAX)                                                \
    PaperQLogger.fmtThrowError(                                                \
        "Pointer address for variable {} {} ({}) is larger than maximum {} or smaller than 0", \
        #p, \
        fmt::ptr(p), asInt(p), UINTPTR_MAX);

#define asInt(p) reinterpret_cast<std::uintptr_t>(p)
#define asPtr(type, p) reinterpret_cast<type *>(p)

static inline auto PaperQLogger = Paper::Logger::WithContext<"QuestEditor", false>();

Logger& getLogger();

#define LOG_INFO(...) PaperQLogger.fmtLog<Paper::LogLevel::INF>(__VA_ARGS__);

std::string_view GetDataPath();

extern std::thread::id mainThreadId;
void scheduleFunction(std::function<void()> const& func);
