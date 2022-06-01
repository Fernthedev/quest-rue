#include "main.hpp"
#include "classutils.hpp"

using namespace ClassUtils;
using namespace il2cpp_utils;

// field_get_value, field_set_value
std::vector<FieldInfo*> ClassUtils::GetFields(Il2CppClass* klass) {
    std::vector<FieldInfo*> ret;
    // only a single pointer since fields are stored as values
    FieldInfo* iter = nullptr; // needs to be explicitly set to nullptr
    while(il2cpp_functions::class_get_fields(klass, (void**)(&iter))) {
        if(iter)
            ret.push_back(iter);
    }
    return ret;
}

std::vector<const MethodInfo*> ClassUtils::GetPropMethods(PropertyInfo* prop) {
    std::vector<const MethodInfo*> ret{};
    if(auto m = il2cpp_functions::property_get_get_method(prop))
        ret.push_back(m);
    if(auto m = il2cpp_functions::property_get_set_method(prop))
        ret.push_back(m);
    return ret;
}

std::vector<PropertyInfo*> ClassUtils::GetProperties(Il2CppClass* klass) {
    std::vector<PropertyInfo*> ret;
    // only a single pointer since properties are stored as values
    PropertyInfo* iter = nullptr;
    while(il2cpp_functions::class_get_properties(klass, (void**)(&iter))) {
        if(iter)
            ret.push_back(iter);
    }
    return ret;
}

std::vector<MethodInfo*> ClassUtils::GetMethods(Il2CppClass* klass) {
    std::vector<MethodInfo*> ret;
    // double pointer because methods are stored as pointers
    MethodInfo** iter = nullptr;
    while(il2cpp_functions::class_get_methods(klass, (void**)(&iter))) {
        if(*iter)
            ret.push_back(*iter);
    }
    return ret;
}

std::vector<Il2CppClass*> ClassUtils::GetInterfaces(Il2CppClass* klass) {
    std::vector<Il2CppClass*> ret;
    // double pointer because classes are stored as pointers
    Il2CppClass** iter = nullptr;
    while(il2cpp_functions::class_get_interfaces(klass, (void**)(&iter))) {
        if(*iter)
            ret.push_back(*iter);
    }
    return ret;
}

// TODO: genericcontext->genericinst->argv = generic type array (argc count)
// requires generally switching to type instead of class, which should be done anyway

Il2CppClass* ClassUtils::GetParent(Il2CppClass* klass) {
    return il2cpp_functions::class_get_parent(klass);
}

TypeInfoMsg ClassUtils::GetTypeInfo(const Il2CppType* type) {
    TypeInfoMsg info;
    auto* klass = il2cpp_functions::class_from_il2cpp_type(type);

    if(!typeIsValuetype(type)) {
        info.set_type(TypeInfoMsg::CLASS);
        *info.mutable_classinfo() = GetClassInfo(type);
    }
    else {
        // TODO: might want to expand the primitive types specified
        switch(type->type) {
        case IL2CPP_TYPE_BOOLEAN:
            info.set_type(TypeInfoMsg::PRIMITIVE);
            info.set_primitiveinfo(TypeInfoMsg::BOOLEAN);
            break;
        case IL2CPP_TYPE_CHAR:
            info.set_type(TypeInfoMsg::PRIMITIVE);
            info.set_primitiveinfo(TypeInfoMsg::CHAR);
            break;
        case IL2CPP_TYPE_I4:
            info.set_type(TypeInfoMsg::PRIMITIVE);
            info.set_primitiveinfo(TypeInfoMsg::INT);
            break;
        case IL2CPP_TYPE_I8:
            info.set_type(TypeInfoMsg::PRIMITIVE);
            info.set_primitiveinfo(TypeInfoMsg::LONG);
            break;
        case IL2CPP_TYPE_R4:
            info.set_type(TypeInfoMsg::PRIMITIVE);
            info.set_primitiveinfo(TypeInfoMsg::FLOAT);
            break;
        case IL2CPP_TYPE_R8:
            info.set_type(TypeInfoMsg::PRIMITIVE);
            info.set_primitiveinfo(TypeInfoMsg::DOUBLE);
            break;
        case IL2CPP_TYPE_STRING:
            info.set_type(TypeInfoMsg::PRIMITIVE);
            info.set_primitiveinfo(TypeInfoMsg::STRING);
            break;
        
        default:
            info.set_type(TypeInfoMsg::STRUCT);
            *info.mutable_structinfo() = GetStructInfo(type);
            break;
        }
    }
    return info;
}

ClassInfoMsg ClassUtils::GetClassInfo(const Il2CppType* classType) {
    ClassInfoMsg classInfo;
    auto* klass = il2cpp_functions::class_from_il2cpp_type(classType);

    classInfo.set_namespaze(il2cpp_functions::class_get_namespace(klass));
    classInfo.set_clazz(il2cpp_functions::class_get_name(klass));
    // TODO: generics
    return classInfo;
}

StructInfoMsg ClassUtils::GetStructInfo(const Il2CppType* structType) {
    StructInfoMsg structInfo;
    auto* klass = il2cpp_functions::class_from_il2cpp_type(structType);

    *structInfo.mutable_clazz() = GetClassInfo(structType);
    for(auto& field : GetFields(klass)) {
        structInfo.mutable_contents()->insert({field->offset, GetTypeInfo(field->type)});
    }
    return structInfo;
}
