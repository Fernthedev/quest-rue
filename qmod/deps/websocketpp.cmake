cpmaddpackage(
    NAME
    websocketpp
    GITHUB_REPOSITORY
    zaphoyd/websocketpp
    GIT_TAG
    0.8.2
    OPTIONS
    "websocketpp_BUILD_EXAMPLES OFF"
)

set(WEBSOCKETPP_SRC_DIR "${websocketpp_SOURCE_DIR}/websocketpp")
set(WEBSOCKETPP_DST_DIR "${CMAKE_CURRENT_BINARY_DIR}/includes/websocketpp")

add_custom_command(
    OUTPUT "${WEBSOCKETPP_DST_DIR}"
    COMMAND ${CMAKE_COMMAND} -E copy_directory "${WEBSOCKETPP_SRC_DIR}" "${WEBSOCKETPP_DST_DIR}"
    COMMENT "Copy websocketpp headers to build includes directory"
    VERBATIM
)

add_custom_target(copy_websocketpp_headers DEPENDS "${WEBSOCKETPP_DST_DIR}")

# Create an interface library to expose the include dir
add_library(websocketpp_headers INTERFACE)
add_dependencies(websocketpp_headers copy_websocketpp_headers)

target_include_directories(websocketpp_headers INTERFACE "${CMAKE_CURRENT_BINARY_DIR}/includes")
