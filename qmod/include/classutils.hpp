#pragma once

#include "main.hpp"

size_t fieldTypeSize(const Il2CppType* type);

#define typeofclass(klass) &klass->byval_arg
#define classoftype(type) il2cpp_functions::class_from_il2cpp_type(type)
#define classofinst(instance) instance->klass
#define typeofinst(instance) typeofclass(classofinst(instance))

namespace ClassUtils {
    std::vector<FieldInfo*> GetFields(Il2CppClass const* klass);

    std::vector<const MethodInfo*> GetPropMethods(PropertyInfo const* prop);
    std::vector<PropertyInfo*> GetProperties(Il2CppClass const* klass);

    std::vector<MethodInfo*> GetMethods(Il2CppClass const* klass);

    std::vector<Il2CppClass*> GetInterfaces(Il2CppClass const* klass);

    Il2CppClass* GetParent(Il2CppClass const* klass);

    bool GetIsLiteral(FieldInfo const* field);

    bool GetIsStatic(FieldInfo const* field);
    bool GetIsStatic(PropertyInfo const* prop);
    bool GetIsStatic(MethodInfo const* method);

    ProtoTypeInfo GetTypeInfo(Il2CppType const* type);
    inline ProtoTypeInfo GetTypeInfo(Il2CppClass const* klass) {
        return GetTypeInfo(typeofclass(klass));
    }
    ProtoClassInfo GetClassInfo(Il2CppType const* classType);
    ProtoArrayInfo GetArrayInfo(Il2CppType const* arrayType);
    ProtoStructInfo GetStructInfo(Il2CppType const* structType);
    ProtoGenericInfo GetGenericInfo(Il2CppType const* genericType);

    Il2CppClass* GetClass(ProtoClassInfo const& classInfo);
    Il2CppClass* GetClass(ProtoTypeInfo const& typeInfo);
    Il2CppType* GetType(ProtoTypeInfo const& typeInfo);
}
