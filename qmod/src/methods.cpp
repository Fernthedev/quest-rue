#include "methods.hpp"
#include "classutils.hpp"

#include <sstream>
#include <iomanip>

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
        case IL2CPP_TYPE_STRING:
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
        default:
            LOG_INFO("Error: unknown type size");
            return 8;
    }
}

// array of arguments:
// pointers to whatever data is stored, whether it be value or reference
// so int*, Vector3*, Il2CppObject**
// alternatively can send single pointers to everything with derefReferences set to false
// in which case the handling of value / reference types needs to be done before the call
// so int*, Vector3*, Il2CppObject*

namespace MethodUtils {
    RetWrapper Run(MethodInfo* method, Il2CppObject* object, void** args, std::string& error, bool derefReferences) {
        LOG_INFO("Running method {}", method->name);

        // deref reference types when running a method as it expects direct pointers to them
        if(derefReferences) {
            for(int i = 0; i < method->parameters_count; i++) {
                if(!typeIsValuetype(method->parameters[i].parameter_type))
                    args[i] = *(void**) args[i];
            }
        }
        
        Il2CppException* ex = nullptr;
        auto ret = il2cpp_functions::runtime_invoke(method, object, args, &ex);
        
        if(ex) {
            LOG_INFO("{}: Failed with exception: {}", method->name, il2cpp_utils::ExceptionToString(ex));
            error = il2cpp_utils::ExceptionToString(ex);
            return {};
        }
        if(method->return_type->type == IL2CPP_TYPE_VOID) {
            LOG_INFO("void return");
            return {};
        }

        LOG_INFO("Returning");
        size_t size = fieldTypeSize(method->return_type);
        void* ownedRet = malloc(size);
        // ret is a boxed value type, so a pointer to the data with a bit of metatada or something
        // so we unbox it to get the raw pointer to the data, and copy that data so it is the value we return
        if(ret && typeIsValuetype(method->return_type)) {
            memcpy(ownedRet, il2cpp_functions::object_unbox(ret), size);
            il2cpp_functions::GC_free(ret);
        // ret is a pointer to a reference type, so we want to have that pointer as the value we return
        } else
            memcpy(ownedRet, &ret, size);
        return RetWrapper(ownedRet, size);
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
            auto param = method->parameters[i];
            info.mutable_args()->insert({param.name, ClassUtils::GetTypeInfo(param.parameter_type)});
        }
        *info.mutable_returntype() = ClassUtils::GetTypeInfo(method->return_type);
        return info;
    }
}

namespace FieldUtils {
    RetWrapper Get(FieldInfo* field, Il2CppObject* object, std::string& error) {
        LOG_INFO("Getting field {}", field->name);
        LOG_INFO("Field type: {} = {}", field->type->type, typeName(field->type));

        // in the case of either a value type or not, the value we want will be copied to what we return
        size_t size = fieldTypeSize(field->type);
        void* ret = malloc(size);
        il2cpp_functions::field_get_value(object, field, ret);
        return RetWrapper(ret, size);
    }

    void Set(FieldInfo* field, Il2CppObject* object, void** args, std::string& error, bool derefReferences) {
        LOG_INFO("Setting field {}", field->name);
        LOG_INFO("Field type: {} = {}", field->type->type, typeName(field->type));

        // deref reference types here as well since it expects the same as if it were running a method
        if(typeIsValuetype(field->type) || !derefReferences)
            il2cpp_functions::field_set_value(object, field, *args);
        else
            il2cpp_functions::field_set_value(object, field, *(void**) *args);
    }

    ProtoFieldInfo GetFieldInfo(FieldInfo* field) {
        ProtoFieldInfo info;
        info.set_name(field->name);
        info.set_id(asInt(field));
        *info.mutable_type() = ClassUtils::GetTypeInfo(field->type);
        return info;
    }
}
