#pragma once

#include "main.hpp"

struct RetWrapper {
    private:
    void* val = nullptr;
    size_t valSize = sizeof(void*);

    public:
    RetWrapper() = default;
    RetWrapper(void* value, size_t size = sizeof(void*))
        : val(value), valSize(size) {}
    ~RetWrapper() { if(val) free(val); }

    RetWrapper(const RetWrapper&) = delete;
    RetWrapper& operator=(const RetWrapper&) = delete;

    bool HasValue() const { return val != nullptr; }
    std::span<std::byte> GetAsBytes() const { return {(std::byte*) val, valSize}; }
    std::string GetAsString() const { return {(char*) val, valSize}; }
};

namespace MethodUtils {
    RetWrapper Run(MethodInfo* method, Il2CppObject* object, void** args, std::string& error, bool derefReferences = true);

    ProtoPropertyInfo GetPropertyInfo(PropertyInfo* property);
    ProtoMethodInfo GetMethodInfo(MethodInfo* method);
};

namespace FieldUtils {
    RetWrapper Get(FieldInfo* field, Il2CppObject* object);
    void Set(FieldInfo* field, Il2CppObject* object, void** args, bool derefReferences = true);

    ProtoFieldInfo GetFieldInfo(FieldInfo* field);
}
