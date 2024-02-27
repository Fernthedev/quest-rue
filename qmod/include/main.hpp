#pragma once

#include <cstdint>

#include "beatsaber-hook/shared/utils/logging.hpp"
#include "beatsaber-hook/shared/utils/il2cpp-utils.hpp"
#include "beatsaber-hook/shared/utils/typedefs.h"
#include "beatsaber-hook/shared/utils/typedefs-string.hpp"

#include "protobuf/qrue.pb.h"

#include "paper/shared/logger.hpp"

#include "fmt/format.h"

#ifdef UNITY_2021
#define klassIsValuetype(type) il2cpp_functions::class_is_valuetype(type)
#define typeIsValuetype(type)                                                  \
  klassIsValuetype(il2cpp_functions::class_from_il2cpp_type(type))

#else
#define typeIsValuetype(type)                                                  \
  il2cpp_functions::class_from_il2cpp_type(type)->valuetype
#define klassIsValuetype(type) type->valuetype
#endif

#define asInt(p) reinterpret_cast<std::uintptr_t>(p)
#define asPtr(type, p) reinterpret_cast<type *>(p)

    static inline auto PaperQLogger =
        Paper::Logger::WithContext<"QuestEditor", false>();

Logger& getLogger();

#define LOG_INFO(...) PaperQLogger.fmtLog<Paper::LogLevel::INF>(__VA_ARGS__)
#define LOG_DEBUG(...) PaperQLogger.fmtLog<Paper::LogLevel::DBG>(__VA_ARGS__)
// #define LOG_DEBUG(...)

std::string_view GetDataPath();

extern std::thread::id mainThreadId;

#ifdef BEAT_SABER
void EnableFPFC();
#endif

