include(ExternalProject)

# Save and unset toolchain if cross-compiling
if(CMAKE_TOOLCHAIN_FILE)
    set(_SAVED_TOOLCHAIN_FILE "${CMAKE_TOOLCHAIN_FILE}")
    unset(CMAKE_TOOLCHAIN_FILE CACHE)
endif()

# Build host `protoc` with native compiler and optional launchers
include(ExternalProject)

set(PROTOBUF_HOST_ARGS -DCMAKE_BUILD_TYPE=Release -Dprotobuf_BUILD_TESTS=OFF -Dprotobuf_INSTALL=OFF
                       -Dprotobuf_BUILD_PROTOC_BINARIES=ON
)

if(CMAKE_C_COMPILER_LAUNCHER)
    list(APPEND PROTOBUF_HOST_ARGS -DCMAKE_C_COMPILER_LAUNCHER:STRING=${CMAKE_C_COMPILER_LAUNCHER})
endif()

if(CMAKE_CXX_COMPILER_LAUNCHER)
    list(APPEND PROTOBUF_HOST_ARGS
         -DCMAKE_CXX_COMPILER_LAUNCHER:STRING=${CMAKE_CXX_COMPILER_LAUNCHER}
    )
endif()

ExternalProject_Add(
    protobuf_host
    GIT_REPOSITORY https://github.com/protocolbuffers/protobuf.git
    GIT_TAG v31.1
    LOG_CONFIGURE 1
    LOG_BUILD 1
    LOG_INSTALL 1
    LOG_OUTPUT_ON_FAILURE 1
    SOURCE_DIR "${CMAKE_BINARY_DIR}/_deps/protobuf-host-src"
    BINARY_DIR "${CMAKE_BINARY_DIR}/_deps/protobuf-host-build"
    CMAKE_ARGS ${PROTOBUF_HOST_ARGS}
    BUILD_COMMAND ${CMAKE_COMMAND} --build . --target protoc --verbose
    INSTALL_COMMAND ""
    STEP_TARGETS build
)

set(HOST_PROTOC "${CMAKE_BINARY_DIR}/_deps/protobuf-host-build/protoc")

# Restore toolchain
if(_SAVED_TOOLCHAIN_FILE)
    set(CMAKE_TOOLCHAIN_FILE
        "${_SAVED_TOOLCHAIN_FILE}"
        CACHE FILEPATH "Restored toolchain file" FORCE
    )
endif()

cpmaddpackage(
    NAME
    protobuf
    GITHUB_REPOSITORY
    protocolbuffers/protobuf
    VERSION
    31.1
    OPTIONS
    "protobuf_BUILD_TESTS OFF"
    "protobuf_INSTALL OFF"
    "protobuf_BUILD_PROTOC_BINARIES OFF"
)

include("${protobuf_SOURCE_DIR}/cmake/protobuf-generate.cmake")

add_library(protos STATIC)
add_dependencies(protos protobuf_host-build)

set(PROTO_FILES_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../protos")
file(GLOB_RECURSE PROTO_FILES "${PROTO_FILES_DIR}/*.proto")
message(STATUS "Detected proto files: ${PROTO_FILES}")

set(PROTOC_OUT_DIR "${CMAKE_CURRENT_BINARY_DIR}")
protobuf_generate(
    TARGET
    protos
    PROTOC_OUT_DIR
    ${PROTOC_OUT_DIR}
    PROTOS
    ${PROTO_FILES}
    PROTOC_EXE
    ${HOST_PROTOC}
    IMPORT_DIRS
    ${PROTO_FILES_DIR}
)

target_include_directories(protos PUBLIC "${PROTOC_OUT_DIR}")
target_link_libraries(protos PUBLIC protobuf::libprotobuf)

set(APP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../src")
set(TS_PROTO_PLUGIN "${APP_DIR}/node_modules/.bin/protoc-gen-ts_proto.CMD")
if(EXISTS ${TS_PROTO_PLUGIN})
    set(PROTOC_OUT_DIR "${APP_DIR}/src/misc/proto/")
    protobuf_generate(
        TARGET
        protos
        LANGUAGE
        "ts_proto"
        GENERATE_EXTENSIONS
        ".ts"
        PLUGIN
        "protoc-gen-ts_proto=${TS_PROTO_PLUGIN}"
        PROTOC_OPTIONS
        "--ts_proto_opt=forceLong=bigint"
        "--ts_proto_opt=oneof=unions"
        "--ts_proto_opt=esModuleInterop=true"
        PROTOC_OUT_DIR
        ${PROTOC_OUT_DIR}
        PROTOS
        ${PROTO_FILES}
        PROTOC_EXE
        ${HOST_PROTOC}
        IMPORT_DIRS
        ${PROTO_FILES_DIR}
    )
endif()
