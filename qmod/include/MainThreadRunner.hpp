#include "custom-types/shared/macros.hpp"

#include "UnityEngine/MonoBehaviour.hpp"

DECLARE_CLASS_CODEGEN(QRUE, MainThreadRunner, UnityEngine::MonoBehaviour,

                      DECLARE_INSTANCE_METHOD(void, Update);

)