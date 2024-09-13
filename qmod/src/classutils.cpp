#include "classutils.hpp"

#include "System/RuntimeType.hpp"
#include "main.hpp"
#include "methods.hpp"

using namespace ClassUtils;
using namespace il2cpp_utils;

std::unordered_map<Il2CppType const*, ProtoTypeInfo> typeInfoCache;

// basically copied from il2cpp (field setting). what could go wrong?
// (so blame them for the gotos)
size_t fieldTypeSize(Il2CppType const* type) {
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
        case IL2CPP_TYPE_STRING:  // note that this is overridden sometimes but should still return the size of an Il2CppString*
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
            // t =
            // GenericClass::GetTypeDefinition(type->data.generic_class)->byval_arg.type;
#ifdef UNITY_2021
            t = il2cpp_functions::MetadataCache_GetTypeInfoFromHandle(type->data.generic_class->type->data.typeHandle)->byval_arg.type;
#else
            t = il2cpp_functions::MetadataCache_GetTypeInfoFromTypeDefinitionIndex(type->data.generic_class->typeDefinitionIndex)->byval_arg.type;
#endif
            goto handle_enum;
        case IL2CPP_TYPE_VOID:
            // added myself but I mean it makes sense, probably doesn't actually matter for functionality though
            return 0;
        default:
            LOG_INFO("Error: unknown type size");
            return 8;
    }
}

// field_get_value, field_set_value
std::vector<FieldInfo const*> ClassUtils::GetFields(Il2CppClass const* klass) {
    std::vector<FieldInfo const*> ret;
    ret.reserve(klass->field_count);

    for (auto const& field : std::span(klass->fields, klass->field_count)) {
        if (GetIsStatic(&field))
            continue;

        ret.emplace_back(&field);
    }
    return ret;
}

std::pair<MethodInfo const*, MethodInfo const*> ClassUtils::GetPropMethods(PropertyInfo const* prop) {
    std::pair<MethodInfo const*, MethodInfo const*> ret;

    if (auto m = il2cpp_functions::property_get_get_method(prop))
        ret.first = m;
    if (auto m = il2cpp_functions::property_get_set_method(prop))
        ret.second = m;
    return ret;
}

std::vector<PropertyInfo const*> ClassUtils::GetProperties(Il2CppClass const* klass) {
    std::vector<PropertyInfo const*> ret;
    ret.reserve(klass->property_count);

    for (auto const& property : std::span(klass->properties, klass->property_count)) {
        bool normal = !property.get || property.get->parameters_count == 0;
        normal = normal && !property.set || property.set->parameters_count == 1;
        if (!normal)
            continue;

        ret.emplace_back(&property);
    }
    return ret;
}

std::vector<MethodInfo const*> ClassUtils::GetMethods(Il2CppClass const* klass) {
    std::vector<MethodInfo const*> ret;
    ret.reserve(klass->method_count);

    for (auto const& method : std::span(klass->methods, klass->method_count)) {
        if (!method)
            continue;
        ret.emplace_back(method);
    }
    return ret;
}

std::vector<Il2CppClass const*> ClassUtils::GetInterfaces(Il2CppClass const* klass) {
    std::vector<Il2CppClass const*> ret;
    ret.reserve(klass->interfaces_count);

    for (auto const& interface : std::span(klass->implementedInterfaces, klass->interfaces_count)) {
        if (!interface)
            continue;
        ret.push_back(interface);
    }
    return ret;
}

Il2CppClass const* ClassUtils::GetParent(Il2CppClass const* klass) {
    return klass->parent;
}

bool ClassUtils::GetIsLiteral(FieldInfo const* field) {
    return (field->type->attrs & FIELD_ATTRIBUTE_LITERAL) != 0;
}

bool ClassUtils::GetIsStatic(FieldInfo const* field) {
    return (field->type->attrs & FIELD_ATTRIBUTE_STATIC) != 0;
}

bool ClassUtils::GetIsStatic(PropertyInfo const* prop) {
    if (prop->get)
        return (prop->get->flags & METHOD_ATTRIBUTE_STATIC) != 0;
    if (prop->set)
        return (prop->set->flags & METHOD_ATTRIBUTE_STATIC) != 0;
    return false;
}

bool ClassUtils::GetIsStatic(MethodInfo const* method) {
    return (method->flags & METHOD_ATTRIBUTE_STATIC) != 0;
}

#ifdef UNITY_2021
// from custom-types
// checks whether the ty->data could be a pointer. technically could be UB if the address is low enough
static bool MetadataHandleSet(Il2CppType const* type) {
    return ((uint64_t) type->data.typeHandle >> 32);
}

bool ClassUtils::GetIsCustom(Il2CppType const* type) {
    if (MetadataHandleSet(type))
        return false;
    return type->data.__klassIndex <= kTypeDefinitionIndexInvalid;
}
#else
bool ClassUtils::GetIsCustom(Il2CppType const* type) {
    // shouldn't be needed anywhere on old unity
    return false;
}
#endif

// from here, use type instead of class, as it is slightly more specific in cases such as byrefs

ProtoTypeInfo ClassUtils::GetTypeInfo(Il2CppType const* type) {
    LOG_DEBUG("Getting type info {}", il2cpp_functions::type_get_name(type));
    LOG_DEBUG("Type enum {}", (int) type->type);

    auto cached = typeInfoCache.find(type);
    if (cached != typeInfoCache.end()) {
        LOG_DEBUG("Returning cached type info");
        return cached->second;
    }

    ProtoTypeInfo info;
    info.set_size(fieldTypeSize(type));
    LOG_DEBUG("Found size {}", info.size());

    static std::set<Il2CppTypeEnum> const nonClassReferences = {IL2CPP_TYPE_STRING, IL2CPP_TYPE_SZARRAY, IL2CPP_TYPE_VAR, IL2CPP_TYPE_MVAR};

    if (!typeIsValuetype(type) && !nonClassReferences.contains(type->type)) {
        if (classoftype(type) == il2cpp_functions::defaults->systemtype_class)
            info.set_primitiveinfo(ProtoTypeInfo::TYPE);
        else
            *info.mutable_classinfo() = GetClassInfo(type);
        // szarray means regular array, array means some fancy multidimensional never used c# thing I think
    } else if (type->type == IL2CPP_TYPE_SZARRAY)
        *info.mutable_arrayinfo() = GetArrayInfo(type);
    else if (type->type == IL2CPP_TYPE_VAR || type->type == IL2CPP_TYPE_MVAR)
        *info.mutable_genericinfo() = GetGenericInfo(type);
    else {
        // TODO: make some of these more correct
        switch (type->type) {
            case IL2CPP_TYPE_BOOLEAN:
                info.set_primitiveinfo(ProtoTypeInfo::BOOLEAN);
                break;
            case IL2CPP_TYPE_CHAR:
                info.set_primitiveinfo(ProtoTypeInfo::CHAR);
                break;
            case IL2CPP_TYPE_I1:
            case IL2CPP_TYPE_U1:
                info.set_primitiveinfo(ProtoTypeInfo::BYTE);
                break;
            case IL2CPP_TYPE_I2:
            case IL2CPP_TYPE_U2:
                info.set_primitiveinfo(ProtoTypeInfo::SHORT);
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
            case IL2CPP_TYPE_VALUETYPE: {
                auto klass = classoftype(type);
                if (klass->enumtype)
                    return GetTypeInfo(klass->element_class);
                // don't break for non enums
            }
            default:
                *info.mutable_structinfo() = GetStructInfo(type);
                break;
        }
    }
    info.set_isbyref(type->byref);

    typeInfoCache[type] = info;

    return info;
}

ProtoClassInfo ClassUtils::GetClassInfo(Il2CppType const* type) {
    ProtoClassInfo classInfo;
    LOG_DEBUG("Getting class info");

    auto declaring = il2cpp_functions::class_get_declaring_type(classoftype(type));

    auto namespaze = il2cpp_functions::class_get_namespace(classoftype(type));
    std::string name = il2cpp_functions::class_get_name(classoftype(type));

    while (declaring) {
        namespaze = il2cpp_functions::class_get_namespace(declaring);
        name = il2cpp_functions::class_get_name(declaring) + ("/" + name);
        declaring = il2cpp_functions::class_get_declaring_type(declaring);
    }

    classInfo.set_namespaze(namespaze);
    classInfo.set_clazz(name);

    if (type->type == IL2CPP_TYPE_GENERICINST) {
        auto genericInst = type->data.generic_class->context.class_inst;
        for (int i = 0; i < genericInst->type_argc; i++)
            *classInfo.add_generics() = GetTypeInfo(genericInst->type_argv[i]);
    }

    return classInfo;
}

ProtoArrayInfo ClassUtils::GetArrayInfo(Il2CppType const* type) {
    ProtoArrayInfo arrayInfo;
    LOG_DEBUG("Getting array info");

    *arrayInfo.mutable_membertype() = GetTypeInfo(type->data.type);
    return arrayInfo;
}

ProtoStructInfo ClassUtils::GetStructInfo(Il2CppType const* type) {
    ProtoStructInfo structInfo;
    LOG_DEBUG("Getting struct info");

    *structInfo.mutable_clazz() = GetClassInfo(type);
    for (auto const& field : GetFields(classoftype(type))) {
        LOG_DEBUG("Field {} ({}) at offset {}", field->name, il2cpp_functions::type_get_name(field->type), field->offset - sizeof(Il2CppObject));
        structInfo.mutable_fieldoffsets()->insert({(int) (field->offset - sizeof(Il2CppObject)), FieldUtils::GetFieldInfo(field)});
    }
    LOG_DEBUG("Got struct info");
    return structInfo;
}

ProtoGenericInfo ClassUtils::GetGenericInfo(Il2CppType const* type) {
    ProtoGenericInfo genericInfo;
    LOG_DEBUG("Getting generic info");

#ifdef UNITY_2021
    auto genericHandle = type->data.genericParameterHandle;
    auto name = il2cpp_functions::Type_GetName(type, Il2CppTypeNameFormat::IL2CPP_TYPE_NAME_FORMAT_FULL_NAME);
#else
    auto genericHandle = type->data.genericParameterIndex;
    auto parameter = il2cpp_functions::MetadataCache_GetGenericParameterFromIndex(genericHandle);
    auto name = il2cpp_functions::MetadataCache_GetStringFromIndex(parameter->nameIndex);
#endif

    genericInfo.set_generichandle((uint64_t) genericHandle);
    genericInfo.set_name(name);
    return genericInfo;
}

Il2CppClass* ClassUtils::GetClass(ProtoClassInfo const& classInfo) {
    LOG_DEBUG("Getting class from class info {}::{}", classInfo.namespaze(), classInfo.clazz());

    auto klass = il2cpp_utils::GetClassFromName(classInfo.namespaze(), classInfo.clazz());
    if (!klass || classInfo.generics_size() <= 0)
        return klass;
    // no MakeGenericMethod for classes in bshook
    auto runtimeClass = il2cpp_utils::GetSystemType(klass);
    ArrayW<System::Type*> genericArgs(classInfo.generics_size());
    for (int i = 0; i < genericArgs.size(); i++) {
        auto genericType = GetType(classInfo.generics(i));
        if (!genericType)
            return nullptr;
        genericArgs[i] = reinterpret_cast<System::Type*>(il2cpp_utils::GetSystemType(genericType));
    }

    auto inflated = System::RuntimeType::MakeGenericType(reinterpret_cast<System::Type*>(runtimeClass), genericArgs);
    return il2cpp_functions::class_from_system_type((Il2CppReflectionType*) inflated);
}

Il2CppClass* ClassUtils::GetClass(ProtoTypeInfo const& typeInfo) {
    if (typeInfo.has_classinfo())
        return GetClass(typeInfo.classinfo());
    else if (typeInfo.has_arrayinfo()) {
        auto& arrayInfo = typeInfo.arrayinfo();
        LOG_DEBUG("Getting class from array info");

        auto memberType = GetType(arrayInfo.membertype());
        if (!memberType)
            return nullptr;

        return il2cpp_functions::bounded_array_class_get(classoftype(memberType), 1, false);  // szarray
    } else if (typeInfo.has_structinfo()) {
        LOG_DEBUG("Getting class from struct info");

        return GetClass(typeInfo.structinfo().clazz());
    } else if (typeInfo.has_genericinfo()) {
        LOG_DEBUG("Getting class from generic info");
        // I don't think this should even come up
        Il2CppType type = {};
#ifdef UNITY_2021
        type.data.genericParameterHandle = (Il2CppMetadataGenericParameterHandle) typeInfo.genericinfo().generichandle();
#else
        type.data.genericParameterIndex = (int32_t) typeInfo.genericinfo().generichandle();
#endif
        type.type = IL2CPP_TYPE_VAR;  // hmm, mvar?
        return classoftype(&type);  // only uses the above two fields for var/mvar
    } else if (typeInfo.has_primitiveinfo()) {
        LOG_DEBUG("Getting class from primitive info");

        switch (typeInfo.primitiveinfo()) {
            case ProtoTypeInfo::BOOLEAN:
                return il2cpp_functions::defaults->boolean_class;
            case ProtoTypeInfo::CHAR:
                return il2cpp_functions::defaults->char_class;
            case ProtoTypeInfo::BYTE:
                return il2cpp_functions::defaults->byte_class;
            case ProtoTypeInfo::SHORT:
                return il2cpp_functions::defaults->int16_class;
            case ProtoTypeInfo::INT:
                return il2cpp_functions::defaults->int32_class;
            case ProtoTypeInfo::LONG:
                return il2cpp_functions::defaults->int64_class;
            case ProtoTypeInfo::FLOAT:
                return il2cpp_functions::defaults->single_class;
            case ProtoTypeInfo::DOUBLE:
                return il2cpp_functions::defaults->double_class;
            case ProtoTypeInfo::STRING:
                return il2cpp_functions::defaults->string_class;
            case ProtoTypeInfo::TYPE:
                return il2cpp_functions::defaults->systemtype_class;

            case ProtoTypeInfo::PTR:
#ifdef UNITY_2021
                // TODO: Is this right?
                return il2cpp_functions::defaults->void_class;

#else
                return il2cpp_functions::defaults->pointer_class;
#endif
            case ProtoTypeInfo::VOID:
                return il2cpp_functions::defaults->void_class;
            case ProtoTypeInfo::UNKNOWN:
            default:
                return nullptr;
        }
    }
    return nullptr;
}

Il2CppType* ClassUtils::GetType(ProtoTypeInfo const& typeInfo) {
    auto klass = GetClass(typeInfo);
    if (!klass)
        return nullptr;

    // this probably handles byref
    if (typeInfo.isbyref())
        return &klass->this_arg;
    return &klass->byval_arg;
}
