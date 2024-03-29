#include "objectdump.hpp"

#include "beatsaber-hook/shared/utils/il2cpp-utils.hpp"
#include "main.hpp"

void logIndent(std::ofstream& stream, int length) {
    for (int i = 0; i < length; i++)
        stream << "  ";
}

void logChildren(Il2CppObject* t, std::ofstream& stream, int maxDepth, int depth) {
    if (depth > maxDepth || !t)
        return;
    static auto childCountMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Transform", "get_childCount", 0);
    int num = il2cpp_utils::RunMethodRethrow<int, false>(t, childCountMethod);
    logIndent(stream, depth);
    static auto goNameMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Transform", "get_name", 0);
    std::string name = il2cpp_utils::RunMethodRethrow<StringW, false>(t, goNameMethod);
    stream << name << " has " << num << " child" << (num == 1 ? "\n" : "ren\n");
    static auto getComponentsMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Transform", "GetComponents", 1);
    static auto monoBehaviorType = il2cpp_utils::GetSystemType(il2cpp_utils::GetClassFromName("UnityEngine", "MonoBehaviour"));
    auto arr = il2cpp_utils::RunMethodRethrow<ArrayW<Il2CppObject*>, false>(t, getComponentsMethod, monoBehaviorType);
    for (auto& cmpnt : arr) {
        static auto classNameMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "MonoBehaviour", "GetScriptClassName", 0);
        Il2CppString* name = il2cpp_utils::RunMethodRethrow<StringW, false>(cmpnt, classNameMethod);
        if (name) {
            logIndent(stream, depth + 1);
            stream << "Component: " << name << "\n";
        }
        // const MethodInfo* textMethod = il2cpp_utils::FindMethodUnsafe(cmpnt, "get_text", 0);
        // if(textMethod) {
        //     Il2CppString* text = unwrap_optionals(il2cpp_utils::RunMethod<Il2CppString*, false>(cmpnt, textMethod));
        //     if(text) {
        //         logIndent(stream, depth + 2);
        //         stream << "Has text: " << text << "\n";
        //     }
        // }
    }
    for (int i = 0; i < num; i++) {
        static auto getChildMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Transform", "GetChild", 1);
        auto child = il2cpp_utils::RunMethodRethrow<Il2CppObject*, false>(t, getChildMethod, i);
        logChildren(child, stream, maxDepth, depth + 1);
    }
}

void logHierarchy(std::string path) {
    std::ofstream stream(path);
    if (!stream) {
        LOG_INFO("Couldn't open path {} for writing", path);
        return;
    }
    // slooow
    static auto findAllObjectsMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Resources", "FindObjectsOfTypeAll", 1);
    static auto transformType = il2cpp_utils::GetSystemType(il2cpp_utils::GetClassFromName("UnityEngine", "Transform"));
    auto objects = il2cpp_utils::RunMethodRethrow<ArrayW<Il2CppObject*>, false>(nullptr, findAllObjectsMethod, transformType);
    for (auto& obj : objects) {
        static auto getParentMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Transform", "GetParent", 0);
        auto parent = il2cpp_utils::RunMethodRethrow<Il2CppObject*, false>(obj, getParentMethod);
        if (parent != nullptr)
            continue;
        static auto goNameMethod = il2cpp_utils::FindMethodUnsafe("UnityEngine", "Transform", "get_name", 0);
        std::string name = il2cpp_utils::RunMethodRethrow<StringW, false>(obj, goNameMethod);
        stream << "Root object: " << name << "\n";
        logChildren(obj, stream, 8);
    }
}
