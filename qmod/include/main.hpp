#pragma once

#include "beatsaber-hook/shared/utils/logging.hpp"
#include "beatsaber-hook/shared/utils/il2cpp-utils.hpp"
#include "beatsaber-hook/shared/utils/typedefs.h"
#include "beatsaber-hook/shared/utils/typedefs-string.hpp"

#include "protobuf/qrue.pb.h"

#include "paper/shared/source_location.hpp"

#include "fmt/format.h"

namespace QuestEditor {
    using sl = nostd::source_location;

    // TODO: Inherit when NDK fixes bug
    // https://github.com/android/ndk/issues/1677
    template <typename Char, typename... TArgs>
    struct BasicFmtStrSrcLoc
    {
        using ParentType = fmt::basic_format_string<Char, TArgs...>;
        ParentType parentType;

        explicit(false) inline operator ParentType &()
        {
            return parentType;
        }

        explicit(false) inline operator ParentType const &() const
        {
            return parentType;
        }

        explicit(false) inline operator fmt::string_view()
        {
            return parentType;
        }

        explicit(false) inline operator fmt::string_view const() const
        {
            return parentType;
        }

        sl sourceLocation;

        template <typename S>
        requires(std::is_convertible_v<const S &, fmt::basic_string_view<char>>) consteval inline BasicFmtStrSrcLoc(const S &s, sl const &sourceL = sl::current()) : parentType(s), sourceLocation(sourceL) {}

        BasicFmtStrSrcLoc(fmt::basic_runtime<char> r, sl const &sourceL = sl::current()) : parentType(r), sourceLocation(sourceL) {}
    };

    //    template <typename... Args>
    //    using FmtStrSrcLoc = BasicFmtStrSrcLoc<char, fmt::type_identity_t<Args>...>;
    template <typename... Args>
    using FmtStrSrcLoc = BasicFmtStrSrcLoc<char, fmt::type_identity_t<Args>...>;

    void vInfofmtLog(fmt::string_view const str, sl const &sourceLoc, std::string_view const tag, fmt::format_args const &args) noexcept;

    template <typename... TArgs>
    constexpr auto infoFmtLog(FmtStrSrcLoc<TArgs...> const &str, TArgs &&...args)
    {
        return vInfofmtLog(str, str.sourceLocation, "QuestEditor", fmt::make_format_args(std::forward<TArgs>(args)...));
    }
}

#define typeIsValuetype(type) il2cpp_functions::class_from_il2cpp_type(type)->valuetype

Logger& getLogger();

#define LOG_INFO(...) QuestEditor::infoFmtLog(__VA_ARGS__);

std::string_view GetDataPath();

void scheduleFunction(std::function<void()> const& func);
