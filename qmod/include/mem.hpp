#pragma once

#include <new>
#include <span>

namespace mem {
    enum class protection {
        none = 0,
        read = 0b001,
        write = 0b010,
        execute = 0b100,
        read_write = read | write,
        read_execute = read | execute,
        write_execute = write | execute,  // usually disallowed by the system
        read_write_execute = read | write | execute
    };

    int operator&(protection, protection) noexcept;

    // returns 0 or errno
    // WARNING: THIS WILL ALIGN THE POINTER TO THE NEXT PAGE BOUNDARY BEFORE AND CHANGE **ALL** OF IT
    int protect(void*, std::size_t, protection) noexcept;
    template <typename T>
    int protect(T* data, std::size_t count, protection prot) noexcept { return protect(reinterpret_cast<void*>(data), count * sizeof(T), prot); }
    template <typename T, std::size_t N>
    int protect(T (&data)[N], protection prot) noexcept { return protect(data, N, prot); }
    template <typename T>
    int protect(std::span<T> data, protection prot) noexcept { return protect(data.data(), data.size(), prot); }
    template <typename T, std::ptrdiff_t N>
    int protect(std::span<T, N> data, protection prot) noexcept { return protect(data, N, prot); }

    struct aligned_t {};
    constexpr aligned_t aligned = {};
}

void* operator new(std::size_t, mem::aligned_t, std::size_t) noexcept;
void* operator new[](std::size_t, mem::aligned_t, std::size_t) noexcept;
