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

class Method {
    private:
    const Il2CppType* returnType;
    std::vector<const Il2CppType*> paramTypes;

    std::string name;
    std::vector<std::string> paramNames;
    
    Il2CppObject* object = nullptr;
    MethodInfo* method = nullptr;
    FieldInfo* field = nullptr;
    bool set; // set or get for field

    public:
    Method(Il2CppObject* obj, MethodInfo* method);
    Method(Il2CppObject* obj, FieldInfo* field, bool set);
    RetWrapper Run(void** args, std::string& error, bool derefReferences = true) const;

    ProtoTypeInfo ReturnTypeInfo() const;

    ProtoFieldInfo GetFieldInfo(uint64_t id) const;
    ProtoPropertyInfo GetPropertyInfo(uint64_t id, bool get, bool set) const;
    ProtoMethodInfo GetMethodInfo(uint64_t id) const;
};
