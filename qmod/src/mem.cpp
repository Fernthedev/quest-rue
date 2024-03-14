#include "mem.hpp"
#include <sys/mman.h>
#include <errno.h>
#include <unistd.h>

namespace {
auto pageSize = sysconf(_SC_PAGESIZE);
}

int mem::operator&(protection a, protection b) noexcept {
    return static_cast<int>(a) & static_cast<int>(b);
}

int mem::protect(void* data, std::size_t size, protection prot) noexcept {
    int mprot = PROT_NONE;
    if (prot & protection::read)
        mprot |= PROT_READ;
    if (prot & protection::write)
        mprot |= PROT_WRITE;
    if (prot & protection::execute)
        mprot |= PROT_EXEC;

    auto ptrs = reinterpret_cast<size_t>(data);
    auto diff = ptrs % pageSize;
    ptrs -= diff;

    auto ret = mprotect(reinterpret_cast<void*>(ptrs), size + diff, mprot);
    if (ret != 0)
        return errno;
    else
        return 0;
}

void* operator new(std::size_t size, mem::aligned_t, std::size_t align) noexcept {
    return ::operator new(size, static_cast<std::align_val_t>(align));
}
void* operator new[](std::size_t size, mem::aligned_t, std::size_t align) noexcept {
    return ::operator new[](size, static_cast<std::align_val_t>(align));
}
