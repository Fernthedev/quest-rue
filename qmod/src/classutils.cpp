#include "main.hpp"
#include "classutils.hpp"
#include "methods.hpp"

#include <span>

using namespace ClassUtils;
using namespace il2cpp_utils;

// field_get_value, field_set_value
std::vector<FieldInfo*> ClassUtils::GetFields(Il2CppClass const* klass) {
    std::vector<FieldInfo*> ret;
    // only a single pointer since fields are stored as values
    FieldInfo* iter = nullptr; // needs to be explicitly set to nullptr
    while(il2cpp_functions::class_get_fields(const_cast<Il2CppClass*>(klass), (void**)(&iter))) {
        if(iter && (iter->type->attrs & FIELD_ATTRIBUTE_STATIC) == 0)
            ret.push_back(iter);
    }
    return ret;
}

std::vector<const MethodInfo*> ClassUtils::GetPropMethods(PropertyInfo const* prop) {
    std::vector<const MethodInfo*> ret{};
    if(auto m = il2cpp_functions::property_get_get_method(prop))
        ret.push_back(m);
    if(auto m = il2cpp_functions::property_get_set_method(prop))
        ret.push_back(m);
    return ret;
}

std::vector<PropertyInfo*> ClassUtils::GetProperties(Il2CppClass const* klass) {
    std::vector<PropertyInfo*> ret;
    // only a single pointer since properties are stored as values
    PropertyInfo* iter = nullptr;
    while(il2cpp_functions::class_get_properties(const_cast<Il2CppClass*>(klass), (void**)(&iter))) {
        if(iter)
            ret.push_back(iter);
    }
    return ret;
}

std::vector<MethodInfo*> ClassUtils::GetMethods(Il2CppClass const* klass) {
    std::vector<MethodInfo*> ret;
    // double pointer because methods are stored as pointers
    MethodInfo** iter = nullptr;
    while(il2cpp_functions::class_get_methods(const_cast<Il2CppClass*>(klass), (void**)(&iter))) {
        if(*iter)
            ret.push_back(*iter);
    }
    return ret;
}

std::vector<Il2CppClass*> ClassUtils::GetInterfaces(Il2CppClass const* klass) {
    std::vector<Il2CppClass*> ret;
    // double pointer because classes are stored as pointers
    Il2CppClass** iter = nullptr;
    while(il2cpp_functions::class_get_interfaces(const_cast<Il2CppClass*>(klass), (void**)(&iter))) {
        if(*iter)
            ret.push_back(*iter);
    }
    return ret;
}

// TODO: genericcontext->genericinst->argv = generic type array (argc count)
// requires generally switching to type instead of class, which should be done anyway

Il2CppClass* ClassUtils::GetParent(Il2CppClass const* klass) {
    return il2cpp_functions::class_get_parent(const_cast<Il2CppClass*>(klass));
}

ProtoTypeInfo ClassUtils::GetTypeInfo(Il2CppType const* type) {
    ProtoTypeInfo info;
    LOG_INFO("Getting type info {}::{}", il2cpp_functions::class_get_namespace(classoftype(type)), il2cpp_functions::class_get_name(classoftype(type)));
    LOG_INFO("Type enum {}", type->type);

    if (!typeIsValuetype(type))
        *info.mutable_classinfo() = GetClassInfo(classoftype(type));
    else {
        // TODO: make some of these more correct
        switch (type->type) {
        case IL2CPP_TYPE_BOOLEAN:
            info.set_primitiveinfo(ProtoTypeInfo::BOOLEAN);
            break;
        case IL2CPP_TYPE_CHAR:
            info.set_primitiveinfo(ProtoTypeInfo::CHAR);
            break;
        case IL2CPP_TYPE_I4:
        case IL2CPP_TYPE_U4:
            info.set_primitiveinfo(ProtoTypeInfo::INT);
            break;
        case IL2CPP_TYPE_I:
        case IL2CPP_TYPE_U:
        case IL2CPP_TYPE_I8:
        case IL2CPP_TYPE_U8:
            info.set_primitiveinfo(ProtoTypeInfo::LONG);
            break;
        case IL2CPP_TYPE_R4:
            info.set_primitiveinfo(ProtoTypeInfo::FLOAT);
            break;
        case IL2CPP_TYPE_R8:
            info.set_primitiveinfo(ProtoTypeInfo::DOUBLE);
            break;
        case IL2CPP_TYPE_STRING:
            info.set_primitiveinfo(ProtoTypeInfo::STRING);
            break;
        case IL2CPP_TYPE_VOID:
            info.set_primitiveinfo(ProtoTypeInfo::VOID);
            break;
        case IL2CPP_TYPE_PTR:
            info.set_primitiveinfo(ProtoTypeInfo::PTR);
            break;
        case IL2CPP_TYPE_VALUETYPE:
            if(classoftype(type)->enumtype)
                return GetTypeInfo(&classoftype(type)->element_class->byval_arg);
            // don't break for non enums
        default:
            *info.mutable_structinfo() = GetStructInfo(classoftype(type));
            break;
        }
    }
    return info;
}

ProtoClassInfo ClassUtils::GetClassInfo(const Il2CppClass* klass) {
    ProtoClassInfo classInfo;
    LOG_INFO("Getting class info");

    classInfo.set_namespaze(il2cpp_functions::class_get_namespace(const_cast<Il2CppClass*>(klass)));
    classInfo.set_clazz(il2cpp_functions::class_get_name(const_cast<Il2CppClass*>(klass)));
    // TODO: generics
    return classInfo;
}

ProtoStructInfo ClassUtils::GetStructInfo(Il2CppClass const* klass) {
    ProtoStructInfo structInfo;
    LOG_INFO("Getting struct info");

    *structInfo.mutable_clazz() = GetClassInfo(klass);
    for(auto const& field : GetFields(klass)) {
        structInfo.mutable_fieldoffsets()->insert({field->offset, FieldUtils::GetFieldInfo(field)});
    }
    LOG_INFO("Got struct info");
    return structInfo;
}
