#include "main.hpp"
#include "classutils.hpp"
#include "methods.hpp"

#include <span>

using namespace ClassUtils;
using namespace il2cpp_utils;

#define CASE(il2cpptypename, ret) case IL2CPP_TYPE_##il2cpptypename: return ret;
#define BASIC_CASE(il2cpptypename) CASE(il2cpptypename, #il2cpptypename)
std::string typeName(const Il2CppType* type) {
    auto typeEnum = type->type;
    switch (typeEnum) {
        BASIC_CASE(END)
        BASIC_CASE(BYREF)
        BASIC_CASE(VAR)
        BASIC_CASE(GENERICINST)
        BASIC_CASE(TYPEDBYREF)
        BASIC_CASE(FNPTR)
        BASIC_CASE(MVAR)
        BASIC_CASE(INTERNAL)
        CASE(VOID, "void")
        CASE(BOOLEAN, "bool")
        CASE(CHAR, "char")
        CASE(I1, "int8")
        CASE(U1, "uint8")
        CASE(I2, "int16")
        CASE(U2, "uint16")
        CASE(I4, "int32")
        CASE(U4, "uint32")
        CASE(I8, "int64")
        CASE(U8, "uint64")
        CASE(R4, "float")
        CASE(R8, "double")
        CASE(STRING, "string")
        CASE(PTR, "pointer")
        CASE(ARRAY, "array (unbounded)")
        CASE(SZARRAY, "array (bounded)")
        CASE(I, "\"int\" pointer")
        CASE(U, "\"uint\" pointer")
        case IL2CPP_TYPE_VALUETYPE: return il2cpp_functions::type_get_name(type);
        case IL2CPP_TYPE_OBJECT: return il2cpp_functions::type_get_name(type);
        case IL2CPP_TYPE_CLASS: return il2cpp_functions::type_get_name(type);
        default: return "Other Type " + std::to_string(typeEnum);
    }
}

// basically copied from il2cpp (field setting). what could go wrong?
// (so blame them for the gotos)
size_t fieldTypeSize(const Il2CppType* type) {
    int t;
    if (type->byref) {
        // never does gc allocation, notably ig
        return sizeof(void*);
    }
    t = type->type;
    handle_enum:
    switch (t) {
        case IL2CPP_TYPE_BOOLEAN:
        case IL2CPP_TYPE_I1:
        case IL2CPP_TYPE_U1:
            return sizeof(uint8_t);
        case IL2CPP_TYPE_I2:
        case IL2CPP_TYPE_U2:
            return sizeof(uint16_t);
        case IL2CPP_TYPE_CHAR:
            return sizeof(Il2CppChar);
        case IL2CPP_TYPE_I4:
        case IL2CPP_TYPE_U4:
            return sizeof(int32_t);
        case IL2CPP_TYPE_I:
        case IL2CPP_TYPE_U:
        case IL2CPP_TYPE_I8:
        case IL2CPP_TYPE_U8:
            return sizeof(int64_t);
        case IL2CPP_TYPE_R4:
            return sizeof(float);
        case IL2CPP_TYPE_R8:
            return sizeof(double);
        case IL2CPP_TYPE_STRING: // TODO: this is wrong, does it matter
        case IL2CPP_TYPE_SZARRAY:
        case IL2CPP_TYPE_CLASS:
        case IL2CPP_TYPE_OBJECT:
        case IL2CPP_TYPE_ARRAY:
            return 8;
            // aaaaaaahhhhh what do I do with this deref_pointer thing
            // gc::WriteBarrier::GenericStore(dest, (deref_pointer ? *(void**)value : value));
            // return;
        case IL2CPP_TYPE_FNPTR:
        case IL2CPP_TYPE_PTR:
            return 8;
            // void* *p = (void**)dest;
            // *p = deref_pointer ? *(void**)value : value;
            // return;
        case IL2CPP_TYPE_VALUETYPE:
            // their comment: /* note that 't' and 'type->type' can be different */
            if (type->type == IL2CPP_TYPE_VALUETYPE && il2cpp_functions::class_from_il2cpp_type(type)->enumtype) {
                t = il2cpp_functions::class_from_il2cpp_type(type)->element_class->byval_arg.type;
                goto handle_enum;
            } else {
                auto klass = il2cpp_functions::class_from_il2cpp_type(type);
                return il2cpp_functions::class_instance_size(klass) - sizeof(Il2CppObject);
            }
        case IL2CPP_TYPE_GENERICINST:
            LOG_INFO("Error: tried to find size of generic instance, not implemented yet");
            return 8;
            // t = GenericClass::GetTypeDefinition(type->data.generic_class)->byval_arg.type;
            // goto handle_enum;
        case IL2CPP_TYPE_VOID:
            // added myself but I mean it makes sense, probably doesn't actually matter for functionality though
            return 0;
        default:
            LOG_INFO("Error: unknown type size");
            return 8;
    }
}

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
    LOG_INFO("Type enum {} = {}", type->type, typeName(type));

    info.set_size(fieldTypeSize(type));
    LOG_INFO("Found size {}", info.size());

    if (!typeIsValuetype(type) && type->type != IL2CPP_TYPE_STRING)
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
        LOG_INFO("Field {} ({}) at offset {}", field->name, typeName(field->type), field->offset - 16);
        // TODO: is -16 correct and if so why
        structInfo.mutable_fieldoffsets()->insert({field->offset - 16, FieldUtils::GetFieldInfo(field)});
    }
    LOG_INFO("Got struct info");
    return structInfo;
}
