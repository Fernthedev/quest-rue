#pragma once

#include <fstream>

void logChildren(class Il2CppObject* t, std::ofstream& stream, int maxDepth, int depth = 0);

void logHierarchy(std::string path);
