#pragma once

#include "main.hpp"

namespace MethodUtils {
    ProtoDataPayload Run(MethodInfo const* method, ProtoDataPayload const& object, std::vector<ProtoDataPayload> const& args, std::string& error);
    ProtoDataPayload Run(MethodInfo const* method, void* object, std::vector<ProtoDataPayload> const& args, std::string& error);

    ProtoPropertyInfo GetPropertyInfo(PropertyInfo* property);
    ProtoMethodInfo GetMethodInfo(MethodInfo* method);
};

namespace FieldUtils {
    ProtoDataPayload Get(FieldInfo* field, ProtoDataPayload const& object);
    ProtoDataPayload Get(FieldInfo* field, void* object, bool isObject = true);
    void Set(FieldInfo* field, ProtoDataPayload const& object, ProtoDataPayload const& arg);
    void Set(FieldInfo* field, void* object, ProtoDataPayload const& arg, bool isObject = true);

    ProtoFieldInfo GetFieldInfo(FieldInfo* field);
}
