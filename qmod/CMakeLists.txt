cmake_minimum_required(VERSION 3.21)

# include some defines automatically made by qpm
include(qpm_defines.cmake)

# override android platform for MediaCodec features
set(ANDROID_PLATFORM 28)

if(BEAT_SABER)
    message("Building for beat saber")
    add_compile_definitions(BEAT_SABER=\"\")
endif()

find_program(CCACHE_PROGRAM ccache)

# If found, configure CMake to use it as a compiler launcher
if(CCACHE_PROGRAM)
    message(STATUS "ccache found: ${CCACHE_PROGRAM}. Enabling compiler caching.")
    set(CMAKE_C_COMPILER_LAUNCHER "${CCACHE_PROGRAM}")
    set(CMAKE_CXX_COMPILER_LAUNCHER "${CCACHE_PROGRAM}")
else()
    message(STATUS "ccache not found—compiler caching is disabled.")
endif()

# download CPM.cmake
file(DOWNLOAD https://github.com/cpm-cmake/CPM.cmake/releases/download/v0.40.8/CPM.cmake
     ${CMAKE_CURRENT_BINARY_DIR}/cmake/CPM.cmake
     EXPECTED_HASH SHA256=78ba32abdf798bc616bab7c73aac32a17bbd7b06ad9e26a6add69de8f3ae4791
)
include(${CMAKE_CURRENT_BINARY_DIR}/cmake/CPM.cmake)

# Enable link time optimization
set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)

project(${COMPILE_ID})

# c++ standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED 20)

set(CMAKE_EXPORT_COMPILE_COMMANDS on)

# define that stores the actual source directory
set(SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src)
set(INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/include)

# compile options used
add_compile_options(-frtti -fexceptions)
add_compile_options(-DUNITY_2021)
add_compile_options(-O3)

include(deps/boost.cmake)
include(deps/protobuf.cmake)
include(deps/websocketpp.cmake)

# compile definitions used
add_compile_definitions(${COMPILE_ID} PRIVATE VERSION=\"${MOD_VERSION}\" MOD_ID=\"${MOD_ID}\")

string(LENGTH "${CMAKE_CURRENT_LIST_DIR}/" FOLDER_LENGTH)
add_compile_definitions(${COMPILE_ID} PRIVATE "PAPER_ROOT_FOLDER_LENGTH=${FOLDER_LENGTH}")

# recursively get all src files
recurse_files(cpp_file_list ${SOURCE_DIR}/*.cpp)
recurse_files(c_file_list ${SOURCE_DIR}/*.c)

recurse_files(inline_hook_c ${EXTERN_DIR}/includes/beatsaber-hook/shared/inline-hook/*.c)
recurse_files(inline_hook_cpp ${EXTERN_DIR}/includes/beatsaber-hook/shared/inline-hook/*.cpp)

# add all src files to compile
add_library(
    ${COMPILE_ID} SHARED ${cpp_file_list} ${c_file_list} ${inline_hook_c} ${inline_hook_cpp}
)

# add src dir as include dir
target_include_directories(${COMPILE_ID} PRIVATE ${SOURCE_DIR})

# add include dir as include dir
target_include_directories(${COMPILE_ID} PRIVATE ${INCLUDE_DIR})

target_link_libraries(${COMPILE_ID} PRIVATE -llog)

target_link_libraries(${COMPILE_ID} PRIVATE protos websocketpp_headers Boost::asio)

# add extern stuff like libs and other includes
include(extern.cmake)

add_custom_command(
    TARGET ${COMPILE_ID}
    POST_BUILD
    COMMAND ${CMAKE_STRIP} -d --strip-all "lib${COMPILE_ID}.so" -o "stripped_lib${COMPILE_ID}.so"
    COMMENT "Strip debug symbols done on final binary."
)

add_custom_command(
    TARGET ${COMPILE_ID}
    POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E make_directory debug
    COMMENT "Make directory for debug symbols"
)

add_custom_command(
    TARGET ${COMPILE_ID}
    POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E rename lib${COMPILE_ID}.so debug/lib${COMPILE_ID}.so
    COMMENT "Rename the lib to debug_ since it has debug symbols"
)

add_custom_command(
    TARGET ${COMPILE_ID}
    POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E rename stripped_lib${COMPILE_ID}.so lib${COMPILE_ID}.so
    COMMENT "Rename the stripped lib to regular"
)
