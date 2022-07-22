#pragma once

#include "main.hpp"

namespace ClassUtils
{

    std::vector<FieldInfo *> GetFields(Il2CppClass const*klass);

    std::vector<const MethodInfo *> GetPropMethods(PropertyInfo const*prop);
    std::vector<PropertyInfo *> GetProperties(Il2CppClass const*klass);

    std::vector<MethodInfo *> GetMethods(Il2CppClass const*klass);

    std::vector<Il2CppClass *> GetInterfaces(Il2CppClass const*klass);
    std::span<ParameterInfo const> GetMethodParameters(MethodInfo const *method);

    Il2CppClass *GetParent(Il2CppClass const*klass);

    ProtoTypeInfo GetTypeInfo(Il2CppClass const*type);
    ProtoClassInfo GetClassInfo(Il2CppClass const*classType);
    ProtoStructInfo GetStructInfo(Il2CppClass const*structType);
}

#define classofinst(instance) il2cpp_functions::object_get_class(instance)