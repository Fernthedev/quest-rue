#pragma once

#include "main.hpp"

namespace ClassUtils {
    std::vector<FieldInfo*> GetFields(Il2CppClass* klass);

    std::vector<const MethodInfo*> GetPropMethods(PropertyInfo* prop);
    std::vector<PropertyInfo*> GetProperties(Il2CppClass* klass);

    std::vector<MethodInfo*> GetMethods(Il2CppClass* klass);

    std::vector<Il2CppClass*> GetInterfaces(Il2CppClass* klass);

    Il2CppClass* GetParent(Il2CppClass* klass);

    TypeInfoMsg GetTypeInfo(const Il2CppType* type);
    ClassInfoMsg GetClassInfo(const Il2CppType* classType);
    StructInfoMsg GetStructInfo(const Il2CppType* structType);
}

#define classofinst(instance) il2cpp_functions::object_get_class(instance)