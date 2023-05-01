#pragma once

#include "main.hpp"

std::string typeName(const Il2CppType* type);

size_t fieldTypeSize(const Il2CppType* type);

namespace ClassUtils {
    std::vector<FieldInfo*> GetFields(Il2CppClass const* klass);

    std::vector<const MethodInfo*> GetPropMethods(PropertyInfo const* prop);
    std::vector<PropertyInfo*> GetProperties(Il2CppClass const* klass);

    std::vector<MethodInfo*> GetMethods(Il2CppClass const* klass);

    std::vector<Il2CppClass*> GetInterfaces(Il2CppClass const* klass);

    Il2CppClass* GetParent(Il2CppClass const* klass);

    ProtoTypeInfo GetTypeInfo(Il2CppType const* type);
    inline ProtoTypeInfo GetTypeInfo(Il2CppClass* klass) {
        return GetTypeInfo(il2cpp_functions::class_get_type(klass));
    }
    ProtoClassInfo GetClassInfo(Il2CppClass const* classType);
    ProtoStructInfo GetStructInfo(Il2CppClass const* structType);
}

#define classofinst(instance) il2cpp_functions::object_get_class(instance)
#define classoftype(instance) il2cpp_functions::class_from_il2cpp_type(instance)
