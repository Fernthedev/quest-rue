#include "methods.hpp"
#include "classutils.hpp"

#include <sstream>
#include <iomanip>

// array of arguments:
// pointers to whatever data is stored, whether it be value or reference
// so int*, Vector3*, Il2CppObject**
// alternatively can send single pointers to everything with derefReferences set to false
// in which case the handling of value / reference types needs to be done before the call
// so int*, Vector3*, Il2CppObject*

inline void** pointerOffset(void* ptr, int offset) {
    return (void**) (((char*) ptr) + offset);
}

void* HandleType(ProtoTypeInfo const& typeInfo, void* arg, int size);

void* HandleClass(ProtoClassInfo const& info, void* arg, int size) {
    return arg;
}

void* HandleArray(ProtoArrayInfo const& info, void* arg, int size) {
    int len = info.length();
    if(len < 0) // idk
        return arg;
    auto elemTypeProto = info.membertype();
    auto elemClass = ClassUtils::GetClass(elemTypeProto);
    if(!elemClass)
        return nullptr;
    auto ret = il2cpp_functions::array_new(elemClass, len);
    void* values = pointerOffset(ret, sizeof(Il2CppArray));
    // for arrays with variable length data... just set size to the largest and align based on that I guess
    // TODO: fix that
    int inputSize = elemTypeProto.size();
    int outputSize = fieldTypeSize(typeofclass(elemClass));
    for(int i = 0; i < len; i++) {
        void* value = HandleType(elemTypeProto, pointerOffset(arg, i * inputSize), inputSize);
        *pointerOffset(values, i * outputSize) = value;
    }
    return ret;
}

void* HandleStruct(ProtoStructInfo const& info, void* arg, int size) {
    // TODO: structs with fancy contents
    // for(auto& field : info.fieldoffsets())
    //     *pointerOffset(???, field.first) = HandleType(field.second.type(), pointerOffset(arg, ???), ???);
    return arg;
}

void* HandleGeneric(ProtoGenericInfo const& info, void* arg, int size) {
    // This shouldn't be called as it represents an unspecified generic
    LOG_INFO("Unspecified generic passed as a parameter!");
    return arg;
}

void* HandlePrimitive(ProtoTypeInfo::Primitive info, void* arg, int size) {
    switch(info) {
    case ProtoTypeInfo::STRING:
        // since StringW does an il2cpp string allocation, it should last long enough for the method
        // btw make sure the string is null terminated haha
        return StringW(std::u16string_view((Il2CppChar*) arg, size)).convert();
    case ProtoTypeInfo::TYPE: {
        ProtoTypeInfo typeInfo;
        typeInfo.ParseFromArray(arg, size);
        auto type = ClassUtils::GetType(typeInfo);
        if(!type)
            return nullptr;
        return il2cpp_utils::GetSystemType(type);
    } default:
        return arg;
    }
}

void* HandleType(ProtoTypeInfo const& typeInfo, void* arg, int size) {
    if(typeInfo.has_classinfo())
        return HandleClass(typeInfo.classinfo(), arg, size);
    else if(typeInfo.has_arrayinfo())
        return HandleArray(typeInfo.arrayinfo(), arg, size);
    else if(typeInfo.has_structinfo())
        return HandleStruct(typeInfo.structinfo(), arg, size);
    else if(typeInfo.has_genericinfo())
        return HandleGeneric(typeInfo.genericinfo(), arg, size);
    else if(typeInfo.has_primitiveinfo())
        return HandlePrimitive(typeInfo.primitiveinfo(), arg, size);
    return nullptr;
}

void FillList(std::vector<ProtoDataPayload> args, void** dest) {
    for(int i = 0; i < args.size(); i++)
        dest[i] = HandleType(args[i].typeinfo(), (void*) args[i].data().data(), args[i].data().length());
}

ProtoDataPayload VoidDataPayload(Il2CppType const* type = nullptr) {
    ProtoDataPayload ret;
    ProtoTypeInfo typeProto;
    if(!type) {
        typeProto.set_primitiveinfo(ProtoTypeInfo::VOID);
        typeProto.set_size(0);
        typeProto.set_isbyref(false);
    } else
        typeProto = ClassUtils::GetTypeInfo(type);
    *ret.mutable_typeinfo() = typeProto;
    return ret;
}

std::string OutputType(ProtoTypeInfo& typeInfo, void* value);

std::string OutputClass(ProtoClassInfo& info, void* value, int size) {
    return std::string((char*) value, size);
}

std::string OutputArray(ProtoArrayInfo& info, void* value, int size) {
    auto arr = *(Il2CppArray**) value;
    if(!arr || arr->max_length <= 0)
        return "";
    info.set_length(arr->max_length);

    // see comment in HandleArray
    std::vector<std::string> elementData{};
    void* values = pointerOffset(arr, sizeof(Il2CppArray));
    int memberSize = info.membertype().size();
    for(int i = 0; i < arr->max_length; i++)
        elementData.emplace_back(OutputType(*info.mutable_membertype(), pointerOffset(values, i * memberSize)));

    int maxSize = 0;
    for(auto& data : elementData) {
        if(maxSize < data.length())
            maxSize = data.length();
    }
    info.mutable_membertype()->set_size(maxSize);
    std::stringstream out;
    for(auto& data : elementData) {
        // pad endings of smaller elements with null
        data.append(maxSize - data.length(), '\0');
        out << data;
    }
    return out.str();
}

std::string OutputStruct(ProtoStructInfo& info, void* value, int size) {
    // TODO: structs with strings and stuff here too
    return std::string((char*) value, size);
}

std::string OutputGeneric(ProtoGenericInfo& info, void* value, int size) {
    // This also shouldn't be called
    LOG_INFO("Unspecified generic sent to be output!");
    return std::string((char*) value, size);
}

std::string OutputPrimitive(ProtoTypeInfo::Primitive info, void* value, int size) {
    switch(info) {
    case ProtoTypeInfo::STRING: {
        auto str = *(Il2CppString**) value;
        // while codegen says this is a char16, il2cpp says this is a char16[]
        // also ignore the error
        return std::string((char*) &str->m_firstChar, str->m_stringLength * sizeof(Il2CppChar));
    } case ProtoTypeInfo::TYPE:
        return ClassUtils::GetTypeInfo(il2cpp_functions::class_from_system_type(*(Il2CppReflectionType**) value)).SerializeAsString();
    default:
        return std::string((char*) value, size);
    }
}

std::string OutputType(ProtoTypeInfo& typeInfo, void* value) {
    if(!value)
        return "";
    if(typeInfo.has_classinfo())
        return OutputClass(*typeInfo.mutable_classinfo(), value, typeInfo.size());
    else if(typeInfo.has_arrayinfo())
        return OutputArray(*typeInfo.mutable_arrayinfo(), value, typeInfo.size());
    else if(typeInfo.has_structinfo())
        return OutputStruct(*typeInfo.mutable_structinfo(), value, typeInfo.size());
    else if(typeInfo.has_genericinfo())
        return OutputGeneric(*typeInfo.mutable_genericinfo(), value, typeInfo.size());
    else if(typeInfo.has_primitiveinfo())
        return OutputPrimitive(typeInfo.primitiveinfo(), value, typeInfo.size());
    return "";
}

ProtoDataPayload OutputData(ProtoTypeInfo& typeInfo, void* value) {
    ProtoDataPayload ret;
    ret.set_data(OutputType(typeInfo, value));
    typeInfo.set_size(ret.data().length());
    *ret.mutable_typeinfo() = typeInfo;
    return ret;
}

ProtoDataPayload HandleReturn(MethodInfo const* method, Il2CppObject* ret) {
    if(method->return_type->type == IL2CPP_TYPE_VOID) {
        LOG_DEBUG("void return");
        return VoidDataPayload();
    }
    size_t size = fieldTypeSize(method->return_type);
    char ownedValue[size];
    if(ret && typeIsValuetype(method->return_type)) {
        memcpy(ownedValue, il2cpp_functions::object_unbox(ret), size);
        il2cpp_functions::GC_free(ret);
    } else
    // boxedReturn is a pointer to a reference type, so we want to have that pointer as the value we return
        memcpy(ownedValue, &ret, size);
    auto typeInfo = ClassUtils::GetTypeInfo(method->return_type);
    return OutputData(typeInfo, ownedValue);
}

namespace MethodUtils {
    // payload and result
    std::pair<ProtoDataPayload,Il2CppObject*> Run(MethodInfo const* method, Il2CppObject* object, std::vector<ProtoDataPayload> const& args, std::string& error, bool derefReferences) {
        LOG_DEBUG("Running method {}", method->name);
        LOG_DEBUG("{} parameters", method->parameters_count);

        void* il2cppArgs[args.size()];
        // TODO: type checking?
        FillList(args, il2cppArgs);

        // deref reference types when running a method as it expects direct pointers to them
        for(int i = 0; i < args.size(); i++) {
            if(derefReferences && args[i].typeinfo().has_classinfo())
                il2cppArgs[i] = *(void**) il2cppArgs[i];
        }

        Il2CppException* ex = nullptr;
        auto ret = il2cpp_functions::runtime_invoke(method, object, (void**) il2cppArgs, &ex);

        if(ex) {
            error = il2cpp_utils::ExceptionToString(ex);
            LOG_INFO("{}: Failed with exception: {}", method->name, error);
            return {VoidDataPayload(method->return_type), nullptr};
        }

        LOG_DEBUG("Returning");
        if(!ret) {
            LOG_DEBUG("null pointer");
            return {VoidDataPayload(method->return_type), nullptr};
        }
        return {HandleReturn(method, ret), ret};
    }

    ProtoPropertyInfo GetPropertyInfo(PropertyInfo* property) {
        ProtoPropertyInfo info;
        info.set_name(property->name);
        if (auto getter = property->get) {
            info.set_getterid(asInt(getter));
            *info.mutable_type() = ClassUtils::GetTypeInfo(getter->return_type);
        }
        if (auto setter = property->set) {
            info.set_setterid(asInt(setter));
            *info.mutable_type() = ClassUtils::GetTypeInfo(setter->parameters->parameter_type);
        }
        return info;
    }

    ProtoMethodInfo GetMethodInfo(MethodInfo* method) {
        ProtoMethodInfo info;
        info.set_name(method->name);
        info.set_id(asInt(method));
        for(int i = 0; i < method->parameters_count; i++) {
            auto const& param = method->parameters[i];
            info.mutable_args()->insert({param.name, ClassUtils::GetTypeInfo(param.parameter_type)});
        }
        *info.mutable_returntype() = ClassUtils::GetTypeInfo(method->return_type);
        return info;
    }
}

namespace FieldUtils {
    ProtoDataPayload Get(FieldInfo* field, Il2CppObject* object) {
        LOG_DEBUG("Object {}", object ? object->klass->name : "null");
        LOG_DEBUG("Getting field {}", field->name);
        LOG_DEBUG("Field type: {} = {}", (int) field->type->type, il2cpp_functions::type_get_name(field->type));

        size_t size = fieldTypeSize(field->type);
        char ret[size];
        // in the case of either a value type or not, the value we want will be copied to what we return
        if(ClassUtils::GetIsStatic(field))
            il2cpp_functions::field_static_get_value(field, (void*) ret);
        else
            il2cpp_functions::field_get_value(object, field, (void*) ret);

        // handles copying of string data if necessary
        auto typeInfo = ClassUtils::GetTypeInfo(field->type);
        return OutputData(typeInfo, ret);
    }

    void Set(FieldInfo* field, Il2CppObject* object, ProtoDataPayload const& arg, bool derefReferences) {
        LOG_DEBUG("Setting field {}", field->name);
        LOG_DEBUG("Field type: {} = {}", (int) field->type->type, il2cpp_functions::type_get_name(field->type));

        void* value = HandleType(arg.typeinfo(), (void*) arg.data().data(), arg.data().length());

        // deref reference types here as well since it expects the same as if it were running a method
        if(derefReferences && arg.typeinfo().has_classinfo())
            value = *(void**) value;

        if(ClassUtils::GetIsStatic(field))
            il2cpp_functions::field_static_set_value(field, value);
        else
            il2cpp_functions::field_set_value(object, field, value);
    }

    ProtoFieldInfo GetFieldInfo(FieldInfo* field) {
        ProtoFieldInfo info;
        info.set_name(field->name);
        LOG_DEBUG("Field address: {} vs converted {} ({})", fmt::ptr(field),
                 asInt(field), fmt::ptr((void *)asInt(field)));
        info.set_id(asInt(field));
        *info.mutable_type() = ClassUtils::GetTypeInfo(field->type);
        info.set_literal(ClassUtils::GetIsLiteral(field));
        return info;
    }
}
