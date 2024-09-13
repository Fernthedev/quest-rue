#pragma once

#include "beatsaber-hook/shared/utils/logging.hpp"

#ifdef UNITY_2021
#define klassIsValuetype(type) il2cpp_functions::class_is_valuetype(type)
#define typeIsValuetype(type) klassIsValuetype(il2cpp_functions::class_from_il2cpp_type(type))
#else
#define typeIsValuetype(type) il2cpp_functions::class_from_il2cpp_type(type)->valuetype
#define klassIsValuetype(type) type->valuetype
#endif

#define asInt(p) reinterpret_cast<std::uintptr_t>(p)
#define asPtr(type, p) reinterpret_cast<type*>(p)

static inline auto logger = Paper::ConstLoggerContext(MOD_ID);

#define LOG_INFO(...) logger.info(__VA_ARGS__)
#define LOG_DEBUG(...) logger.debug(__VA_ARGS__)
// #define LOG_DEBUG(...)

std::string_view GetDataPath();

extern std::thread::id mainThreadId;

#ifdef BEAT_SABER
void EnableFPFC();
#endif
