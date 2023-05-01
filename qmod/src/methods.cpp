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

namespace MethodUtils {
    RetWrapper Run(MethodInfo* method, Il2CppObject* object, void** args, std::string& error, bool derefReferences) {
        LOG_INFO("Running method {}", method->name);
        LOG_INFO("{} parameters", method->parameters_count);

        // let's not manage memory manually for strings
        std::vector<StringW> madeStrings = {};

        // deref reference types when running a method as it expects direct pointers to them
        for(int i = 0; i < method->parameters_count; i++) {
            // for strings, instead of an Il2CppString** (like for other objects), a char16_t* is sent in the args
            if(method->parameters[i].parameter_type->type == Il2CppTypeEnum::IL2CPP_TYPE_STRING)
                // make sure strings in your packets are null terminated lol
                args[i] = madeStrings.emplace_back((Il2CppChar*) args[i]).convert();
            else if(derefReferences) {
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
        if(!ret) {
            LOG_INFO("null pointer");
            size_t size = sizeof(nullptr);
            void* ownedRet = malloc(size);
            (*(void**) ownedRet) = nullptr;
            return RetWrapper(ownedRet, size);
        }
        size_t size = fieldTypeSize(method->return_type);
        bool isString = method->return_type->type == Il2CppTypeEnum::IL2CPP_TYPE_STRING;
        auto asStr = (Il2CppString*) ret;
        if(isString)
            size = (asStr->m_stringLength + 1) * sizeof(Il2CppChar); // null char
        if(isString) LOG_INFO("Returning string of length {}", size);
        void* ownedRet = malloc(size);
        // ret is a boxed value type, so a pointer to the data with a bit of metatada or something
        // so we unbox it to get the raw pointer to the data, and copy that data so it is the value we return
        if(ret && typeIsValuetype(method->return_type)) {
            memcpy(ownedRet, il2cpp_functions::object_unbox(ret), size);
            il2cpp_functions::GC_free(ret);
        } else if(ret && isString) {
        // while codegen says this is a char16, il2cpp says this is a char16[]
        // also the Il2CppString doesn't contain the null char
            memcpy(ownedRet, (void*) &asStr->m_firstChar, size - sizeof(Il2CppChar));
            memset((char*) ownedRet + size - sizeof(Il2CppChar), 0, sizeof(Il2CppChar));
            il2cpp_functions::GC_free(ret);
        } else
        // ret is a pointer to a reference type, so we want to have that pointer as the value we return
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
            auto const& param = method->parameters[i];
            info.mutable_args()->insert({param.name, ClassUtils::GetTypeInfo(param.parameter_type)});
        }
        *info.mutable_returntype() = ClassUtils::GetTypeInfo(method->return_type);
        return info;
    }
}

namespace FieldUtils {
    RetWrapper Get(FieldInfo* field, Il2CppObject* object) {
        LOG_INFO("Getting field {}", field->name);
        LOG_INFO("Field type: {} = {}", field->type->type, typeName(field->type));

        bool isString = field->type->type == Il2CppTypeEnum::IL2CPP_TYPE_STRING;
        Il2CppString* asStr;
        size_t size = fieldTypeSize(field->type);
        void* ret = nullptr;
        if(isString)
            ret = &asStr;
        else
            ret = malloc(size);
        // in the case of either a value type or not, the value we want will be copied to what we return
        // only strings are still a special case
        il2cpp_functions::field_get_value(object, field, ret);
        if(isString) {
            size = asStr->m_stringLength * sizeof(Il2CppChar);
            ret = malloc(size + sizeof(Il2CppChar));
            memcpy(ret, *(void**) &asStr->m_firstChar, size);
        }
        return RetWrapper(ret, size);
    }

    void Set(FieldInfo* field, Il2CppObject* object, void** args, bool derefReferences) {
        LOG_INFO("Setting field {}", field->name);
        LOG_INFO("Field type: {} = {}", field->type->type, typeName(field->type));

        void* value = *args;
        if(field->type->type == Il2CppTypeEnum::IL2CPP_TYPE_STRING)
            value = StringW((Il2CppChar*) value).convert();
        else if(derefReferences && !typeIsValuetype(field->type))
        // deref reference types here as well since it expects the same as if it were running a method
            value = *(void**) value;

        il2cpp_functions::field_set_value(object, field, value);
    }

    ProtoFieldInfo GetFieldInfo(FieldInfo* field) {
        ProtoFieldInfo info;
        info.set_name(field->name);
        info.set_id(asInt(field));
        *info.mutable_type() = ClassUtils::GetTypeInfo(field->type);
        return info;
    }
}
