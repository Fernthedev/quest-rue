#include "methods.hpp"
#include "classutils.hpp"
#include "main.hpp"

#include "paper/shared/string_convert.hpp"

#include <sstream>
#include <iomanip>

// array of arguments:
// pointers to whatever data is stored, whether it be value or reference
// so int*, Vector3*, Il2CppObject**
// alternatively can send single pointers to everything with derefReferences set to false
// in which case the handling of value / reference types needs to be done before the call
// so int*, Vector3*, Il2CppObject*

inline void** pointerOffset(void* ptr, int offset) {
    return (void**)(((char*)ptr) + offset);
}

void* HandleType(ProtoTypeInfo const& typeInfo, ProtoDataSegment arg);

void* HandleClass(ProtoClassInfo const& info, ProtoDataSegment arg) {
    if (arg.Data_case() != ProtoDataSegment::DataCase::kClassData)
        return nullptr;
    return (void*)arg.classdata();
}

void* HandleArray(ProtoArrayInfo const& info, ProtoDataSegment arg) {
    if (arg.Data_case() != ProtoDataSegment::DataCase::kArrayData)
        return nullptr;
    auto& elements = arg.arraydata();
    int len = elements.data_size();
    if (len < 0)
        return nullptr;
    auto elemTypeProto = info.membertype();
    auto elemClass = ClassUtils::GetClass(elemTypeProto);
    if (!elemClass)
        return nullptr;

    auto ret = il2cpp_functions::array_new(elemClass, len);
    void* values = pointerOffset(ret, sizeof(Il2CppArray));

    int outputSize = fieldTypeSize(typeofclass(elemClass));
    for (int i = 0; i < len; i++) {
        void* val = HandleType(elemTypeProto, elements.data(i));
        // get the address if we want to copy the pointer as opposed to the value
        if (!elemTypeProto.has_primitiveinfo() && !elemTypeProto.has_structinfo())
            val = (void*) &val;
        memcpy(pointerOffset(values, i * outputSize), val, elemTypeProto.size());
    }
    return ret;
}

void* HandleStruct(ProtoStructInfo const& info, ProtoDataSegment arg) {
    if (arg.Data_case() != ProtoDataSegment::DataCase::kStructData)
        return nullptr;
    // get the size of the struct in a slightly janky way, just like how I allocate it too
    // TODO: allocate this differently if it breaks (empty bytes in ProtoDataSegment.StructData?)
    int last_offset = 0;
    int last_size = 0;
    for (auto field : info.fieldoffsets()) {
        if (field.first > last_offset) {
            last_offset = field.first;
            last_size = field.second.type().size();
        }
    }

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
    void* ret = il2cpp_utils::__AllocateUnsafe(last_offset + last_size);
#pragma GCC diagnostic pop

    for (auto& field : info.fieldoffsets()) {
        void* val = HandleType(field.second.type(), arg.structdata().data().at(field.first));
        // get the address if we want to copy the pointer as opposed to the value
        if (!field.second.type().has_primitiveinfo() && !field.second.type().has_structinfo())
            val = (void*) &val;
        memcpy(pointerOffset(ret, field.first), val, field.second.type().size());
    }

    return ret;
}

void* HandleGeneric(ProtoGenericInfo const& info, ProtoDataSegment arg) {
    if (arg.Data_case() != ProtoDataSegment::DataCase::kGenericData)
        return nullptr;
    // This shouldn't be called as it represents an unspecified generic
    LOG_INFO("Unspecified generic passed as a parameter!");
    return (void*)arg.genericdata().data();
}

void* HandlePrimitive(ProtoTypeInfo::Primitive info, ProtoDataSegment arg) {
    if (arg.Data_case() != ProtoDataSegment::DataCase::kPrimitiveData)
        return nullptr;
    std::string const& bytes = arg.primitivedata();

    switch (info) {
        case ProtoTypeInfo::STRING:
            // since StringW does an il2cpp string allocation, it should last long enough for the method
            // btw make sure the string is null terminated haha
            return StringW(std::u16string_view((Il2CppChar*) bytes.data())).convert();
        case ProtoTypeInfo::TYPE: {
            ProtoTypeInfo typeInfo;
            typeInfo.ParseFromString(bytes);
            auto type = ClassUtils::GetType(typeInfo);
            if (!type)
                return nullptr;
            return il2cpp_utils::GetSystemType(type);
        }
        default:
            return (void*) bytes.data();
    }
}

// converts the data in a ProtoDataPayload into an object of the correct type
void* HandleType(ProtoTypeInfo const& typeInfo, ProtoDataSegment arg) {
    if (typeInfo.has_classinfo())
        return HandleClass(typeInfo.classinfo(), arg);
    else if (typeInfo.has_arrayinfo())
        return HandleArray(typeInfo.arrayinfo(), arg);
    else if (typeInfo.has_structinfo())
        return HandleStruct(typeInfo.structinfo(), arg);
    else if (typeInfo.has_genericinfo())
        return HandleGeneric(typeInfo.genericinfo(), arg);
    else if (typeInfo.has_primitiveinfo())
        return HandlePrimitive(typeInfo.primitiveinfo(), arg);
    return nullptr;
}

void FillList(std::vector<ProtoDataPayload> args, void** dest) {
    for (int i = 0; i < args.size(); i++)
        dest[i] = HandleType(args[i].typeinfo(), args[i].data());
}

ProtoDataPayload VoidDataPayload(Il2CppType const* type = nullptr) {
    ProtoDataPayload ret;
    ProtoTypeInfo typeProto;
    if (!type) {
        typeProto.set_primitiveinfo(ProtoTypeInfo::VOID);
        typeProto.set_size(0);
        typeProto.set_isbyref(false);
    } else
        typeProto = ClassUtils::GetTypeInfo(type);
    *ret.mutable_typeinfo() = typeProto;
    return ret;
}

ProtoDataSegment OutputType(ProtoTypeInfo const& typeInfo, void* value);

ProtoDataSegment OutputClass(ProtoClassInfo const& info, void* value, int size) {
    ProtoDataSegment ret;
    LOG_DEBUG("Outputting class pointer {} {}", *(int64_t*)value, fmt::ptr(*(void**)value));
    ret.set_classdata(*(int64_t*)value);
    return ret;
}

ProtoDataSegment OutputArray(ProtoArrayInfo const& info, void* value, int size) {
    ProtoDataSegment ret;
    LOG_DEBUG("Outputting array {}", fmt::ptr(*(void**)value));
    auto arr = *(Il2CppArray**)value;
    if (!arr || arr->max_length <= 0)
        return ret;

    auto ret_arr = ret.mutable_arraydata();

    void* values = pointerOffset(arr, sizeof(Il2CppArray));
    int memberSize = info.membertype().size();
    LOG_DEBUG("Length {} member size {}", arr->max_length, memberSize);
    for (int i = 0; i < arr->max_length; i++)
        *ret_arr->add_data() = OutputType(info.membertype(), pointerOffset(values, i * memberSize));

    return ret;
}

ProtoDataSegment OutputStruct(ProtoStructInfo const& info, void* value, int size) {
    ProtoDataSegment ret;
    LOG_DEBUG("Outputting struct");
    auto retStruct = ret.mutable_structdata();

    for (auto& field : info.fieldoffsets()) {
        LOG_DEBUG("Adding field at offset {}", field.first);
        auto fieldData = OutputType(field.second.type(), pointerOffset(value, field.first));
        retStruct->mutable_data()->insert({field.first, fieldData});
    }
    return ret;
}

ProtoDataSegment OutputGeneric(ProtoGenericInfo const& info, void* value, int size) {
    ProtoDataSegment ret;
    // This also shouldn't be called
    LOG_INFO("Unspecified generic sent to be output!");
    ret.set_genericdata(std::string((char*) value, size));
    return ret;
}

ProtoDataSegment OutputPrimitive(ProtoTypeInfo::Primitive info, void* value, int size) {
    ProtoDataSegment ret;
    LOG_DEBUG("Outputting primitive {}", (int)info);
    switch (info) {
        case ProtoTypeInfo::STRING: {
            if (auto str = *(Il2CppString**) value) {
                LOG_DEBUG("String of length {}", str->length);
                // while codegen says this is just one char16, it's actually a char16[]
                std::string retStr((char*) &str->chars[0], str->length * sizeof(Il2CppChar));
                ret.set_primitivedata(retStr);
            } else {
                LOG_DEBUG("Null string");
                ret.set_primitivedata("");
            }
            break;
        }
        case ProtoTypeInfo::TYPE: {
            auto type = il2cpp_functions::class_from_system_type(*(Il2CppReflectionType**) value);
            // I could have a oneof in the primitive case instead of only bytes...
            // but that would mean *another* whole extra message when I can just do this
            std::string retStr = ClassUtils::GetTypeInfo(type).SerializeAsString();
            ret.set_primitivedata(retStr);
            break;
        }
        default:
            ret.set_primitivedata(std::string((char*) value, size));
            break;
    }
    return ret;
}

ProtoDataSegment OutputType(ProtoTypeInfo const& typeInfo, void* value) {
    if (!value)
        return {};
    if (typeInfo.has_classinfo())
        return OutputClass(typeInfo.classinfo(), value, typeInfo.size());
    else if (typeInfo.has_arrayinfo())
        return OutputArray(typeInfo.arrayinfo(), value, typeInfo.size());
    else if (typeInfo.has_structinfo())
        return OutputStruct(typeInfo.structinfo(), value, typeInfo.size());
    else if (typeInfo.has_genericinfo())
        return OutputGeneric(typeInfo.genericinfo(), value, typeInfo.size());
    else if (typeInfo.has_primitiveinfo())
        return OutputPrimitive(typeInfo.primitiveinfo(), value, typeInfo.size());
    return {};
}

ProtoDataPayload OutputData(ProtoTypeInfo const& typeInfo, void* value) {
    LOG_DEBUG("Outputting data");
    ProtoDataPayload ret;
    *ret.mutable_data() = OutputType(typeInfo, value);
    *ret.mutable_typeinfo() = typeInfo;
    return ret;
}

ProtoDataPayload HandleReturn(MethodInfo const* method, Il2CppObject* ret) {
    if (method->return_type->type == IL2CPP_TYPE_VOID) {
        LOG_DEBUG("void return");
        return VoidDataPayload();
    }
    size_t size = fieldTypeSize(method->return_type);
    char ownedValue[size];

    if (ret && typeIsValuetype(method->return_type)) {
        memcpy(ownedValue, il2cpp_functions::object_unbox(ret), size);
        il2cpp_functions::GC_free(ret);
    } else
        // boxedReturn is a pointer to a reference type, so we want to have that pointer as the value we return
        memcpy(ownedValue, &ret, size);
    auto typeInfo = ClassUtils::GetTypeInfo(method->return_type);
    return OutputData(typeInfo, ownedValue);
}

namespace MethodUtils {
    ProtoDataPayload Run(MethodInfo const* method, ProtoDataPayload const& object, std::vector<ProtoDataPayload> const& args, std::string& error) {
        void* inst = nullptr;
        if (!ClassUtils::GetIsStatic(method))
            inst = HandleType(object.typeinfo(), object.data());

        return Run(method, inst, args, error);
    }
    ProtoDataPayload Run(MethodInfo const* method, void* object, std::vector<ProtoDataPayload> const& args, std::string& error) {
        LOG_DEBUG("Running method {} {}", fmt::ptr(method), method->name);
        LOG_DEBUG("{} parameters", method->parameters_count);

        if (method->name == std::string("get_renderingDisplaySize")) {
            LOG_INFO("Skipping get_renderingDisplaySize due to crash");
            return VoidDataPayload(method->return_type);
        }

        void* il2cppArgs[args.size()];
        // TODO: type checking?
        FillList(args, il2cppArgs);

        Il2CppException* ex = nullptr;
        auto ret = il2cpp_functions::runtime_invoke(method, object, (void**) il2cppArgs, &ex);

        if (ex) {
            error = il2cpp_utils::ExceptionToString(ex);
            LOG_INFO("{}: Failed with exception: {}", method->name, error);
            LOG_DEBUG("{}", StringW(ex->stack_trace));
            return VoidDataPayload(method->return_type);
        }

        LOG_DEBUG("Returning");
        if (!ret) {
            LOG_DEBUG("null pointer");
            return VoidDataPayload(method->return_type);
        }
        return HandleReturn(method, ret);
    }

    ProtoPropertyInfo GetPropertyInfo(PropertyInfo const* property) {
        ProtoPropertyInfo info;
        info.set_name(property->name);
        if (auto getter = property->get) {
            info.set_getterid(asInt(getter));
            *info.mutable_type() = ClassUtils::GetTypeInfo(getter->return_type);
        }
        if (auto setter = property->set) {
            info.set_setterid(asInt(setter));
#ifdef UNITY_2021
            auto const& paramType = setter->parameters[0];
#else
            auto const& paramType =
                setter->parameters[0]->parameter_type;
#endif
            *info.mutable_type() = ClassUtils::GetTypeInfo(paramType);
        }
        return info;
    }

    ProtoMethodInfo GetMethodInfo(MethodInfo const* method) {
        ProtoMethodInfo info;
        info.set_name(method->name);
        info.set_id(asInt(method));
        for (int i = 0; i < method->parameters_count; i++) {
            auto const& param = method->parameters[i];

#ifdef UNITY_2021
            auto const& methodHandle = method->methodMetadataHandle;
            auto const& paramName =
                il2cpp_functions::method_get_param_name(method, i);
            auto const& paramType = param;
#else
            auto const& paramName = param->name;
            auto const& paramType = param->parameter_type;
#endif
            ProtoMethodInfo_Argument arg;
            arg.set_name(paramName);
            *arg.mutable_type() = ClassUtils::GetTypeInfo(paramType);
            *info.add_args() = arg;
        }
        *info.mutable_returntype() = ClassUtils::GetTypeInfo(method->return_type);
        return info;
    }
}

namespace FieldUtils {
    ProtoDataPayload Get(FieldInfo const* field, ProtoDataPayload const& object) {
        void* inst = nullptr;
        if (!ClassUtils::GetIsStatic(field))
            inst = HandleType(object.typeinfo(), object.data());

        return Get(field, inst, object.typeinfo().has_classinfo() | object.typeinfo().has_arrayinfo());
    }
    ProtoDataPayload Get(FieldInfo const* field, void* object, bool isObject) {
        LOG_DEBUG("Getting field {}", field->name);
        LOG_DEBUG("Field type: {} = {}", (int) field->type->type, il2cpp_functions::type_get_name(field->type));

        // since fields only use pointer math to find the offsets, we don't need to box things properly
        if (!isObject)
            object = (void*)((char*) object - sizeof(Il2CppObject));

        size_t size = fieldTypeSize(field->type);
        char ret[size];
        // in the case of either a value type or not, the value we want will be copied to what we return
        if (ClassUtils::GetIsStatic(field))
            il2cpp_functions::field_static_get_value(const_cast<FieldInfo*>(field), (void*) ret);
        else
            il2cpp_functions::field_get_value((Il2CppObject*) object,const_cast<FieldInfo*>(field), (void*)ret);

        // handles the transformation of the data if necessary
        auto typeInfo = ClassUtils::GetTypeInfo(field->type);
        return OutputData(typeInfo, ret);
    }

    void Set(FieldInfo const* field, ProtoDataPayload const& object, ProtoDataPayload const& arg) {
        void* inst = nullptr;
        if (!ClassUtils::GetIsStatic(field))
            inst = HandleType(object.typeinfo(), object.data());

        return Set(field, inst, arg, object.typeinfo().has_classinfo() | object.typeinfo().has_arrayinfo());
    }
    void Set(FieldInfo const* field, void* object, ProtoDataPayload const& arg, bool isObject) {
        LOG_DEBUG("Setting field {}", field->name);
        LOG_DEBUG("Field type: {} = {}", (int) field->type->type, il2cpp_functions::type_get_name(field->type));

        // since fields only use pointer math to find the offsets, we don't need to box things properly
        if (!isObject)
            object = (void*)((char*) object - sizeof(Il2CppObject));

        void* value = HandleType(arg.typeinfo(), arg.data());

        if (ClassUtils::GetIsStatic(field))
            il2cpp_functions::field_static_set_value(
                const_cast<FieldInfo*>(field), value);
        else
            il2cpp_functions::field_set_value((Il2CppObject*) object, const_cast<FieldInfo*>(field), value);
    }

    ProtoFieldInfo GetFieldInfo(FieldInfo const* field) {
        ProtoFieldInfo info;
        info.set_name(field->name);
        info.set_id(asInt(field));
        *info.mutable_type() = ClassUtils::GetTypeInfo(field->type);
        info.set_literal(ClassUtils::GetIsLiteral(field));
        return info;
    }
}
