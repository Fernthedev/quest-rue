#pragma once

#include "beatsaber-hook/shared/utils/il2cpp-utils.hpp"
#include "protobuf/qrue.pb.h"

size_t fieldTypeSize(Il2CppType const* type);

#define typeofclass(klass) &klass->byval_arg
#define classoftype(type) il2cpp_functions::class_from_il2cpp_type(type)
#define classofinst(instance) instance->klass
#define typeofinst(instance) typeofclass(classofinst(instance))

namespace ClassUtils {
    std::vector<FieldInfo const*> GetFields(Il2CppClass const* klass);

    // [getter?, setter?]
    std::pair<MethodInfo const*, MethodInfo const*> GetPropMethods(PropertyInfo const* prop);
    std::vector<PropertyInfo const*> GetProperties(Il2CppClass const* klass);

    std::vector<MethodInfo const*> GetMethods(Il2CppClass const* klass);

    std::vector<Il2CppClass const*> GetInterfaces(Il2CppClass const* klass);

    Il2CppClass const* GetParent(Il2CppClass const* klass);

    bool GetIsLiteral(FieldInfo const* field);

    bool GetIsStatic(FieldInfo const* field);
    bool GetIsStatic(PropertyInfo const* prop);
    bool GetIsStatic(MethodInfo const* method);

    bool GetIsCustom(Il2CppType const* type);
    inline bool GetIsCustom(Il2CppClass const* klass) {
        return GetIsCustom(typeofclass(klass));
    }

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
