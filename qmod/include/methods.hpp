#pragma once

#include "main.hpp"

namespace MethodUtils {
    ProtoDataPayload Run(MethodInfo const* method, Il2CppObject* object, std::vector<ProtoDataPayload> const& args, std::string& error, bool derefReferences = true);

    ProtoPropertyInfo GetPropertyInfo(PropertyInfo* property);
    ProtoMethodInfo GetMethodInfo(MethodInfo* method);
};

namespace FieldUtils {
    ProtoDataPayload Get(FieldInfo* field, Il2CppObject* object);
    void Set(FieldInfo* field, Il2CppObject* object, ProtoDataPayload const& arg, bool derefReferences = true);

    ProtoFieldInfo GetFieldInfo(FieldInfo* field);
}
