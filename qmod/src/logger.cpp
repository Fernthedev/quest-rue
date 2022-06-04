#include "main.hpp"
#include "paper/shared/logger.hpp"

static inline auto PaperLogger = Paper::Logger::WithContext<"QuestEditor", false>();

void QuestEditor::vInfofmtLog(fmt::string_view const str, QuestEditor::sl const &sourceLoc, std::string_view const tag, fmt::format_args const &args) noexcept
{
    Paper::Logger::vfmtLog<Paper::LogLevel::INF>(str, sourceLoc, tag, args);
}

void setupLog() {
    Paper::Logger::RegisterFileContextId("QuestEditor");
}