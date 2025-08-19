#include "CameraController.hpp"

#include "UnityEngine/GameObject.hpp"
#include "UnityEngine/Time.hpp"
#include "UnityEngine/Transform.hpp"
#include "main.hpp"
#include "sombrero/shared/FastVector2.hpp"
#include "sombrero/shared/FastVector3.hpp"

DEFINE_TYPE(QRUE, CameraController);

using namespace QRUE;
using namespace UnityEngine;

float rotateSensitivity = 1;
float moveSensitivity = 1;

#ifdef BEAT_SABER
#include "UnityEngine/EventSystems/PointerEventData.hpp"
#include "VRUIControls/VRInputModule.hpp"

SafePtrUnity<VRUIControls::VRInputModule> latestInputModule;

GameObject* GetHovered() {
    if (!latestInputModule)
        return nullptr;
    auto eventData = latestInputModule->GetLastPointerEventData(-1);
    if (eventData)
        return eventData->pointerEnter;
    return nullptr;
}
#endif

void CameraController::OnEnable() {
    LOG_INFO("CameraController enable");

    movementF = {0, 0, 0};
    movementB = {0, 0, 0};

#ifdef BEAT_SABER
    latestInputModule = Object::FindObjectOfType<VRUIControls::VRInputModule*>();
#endif
}

void CameraController::OnDisable() {
    LOG_INFO("CameraController disable");

#ifdef BEAT_SABER
    latestInputModule = nullptr;
#endif
}

void CameraController::Update() {
    auto transform = get_transform();
    Sombrero::FastVector3 pos = transform->get_position();

    auto movement = Sombrero::FastVector3(transform->TransformDirection(movementF)) - transform->TransformDirection(movementB);
    movement = movement * moveSensitivity * Time::get_deltaTime() * 2;
    transform->set_position(pos + movement);
}

void CameraController::Rotate(UnityEngine::Vector2 delta) {
    delta = Sombrero::FastVector2(delta) * rotateSensitivity / 4;
    Sombrero::FastVector3 prev = get_transform()->get_eulerAngles();
    get_transform()->set_eulerAngles(prev + Vector3(-delta.y, delta.x, 0));
}

void CameraController::KeyDown(StringW key) {
    auto upper = toupper(key[0]);
    float* val = nullptr;
    if (upper == 'W')
        val = &movementF.z;
    else if (upper == 'D')
        val = &movementF.x;
    else if (upper == 'E' || upper == ' ')
        val = &movementF.y;
    else if (upper == 'S')
        val = &movementB.z;
    else if (upper == 'A')
        val = &movementB.x;
    else if (upper == 'Q' || key == "Shift")
        val = &movementB.y;
    if (val)
        *val = 1;
}

void CameraController::KeyUp(StringW key) {
    auto upper = toupper(key[0]);
    if (key->get_Length() != 1)
        upper = '-';
    float* val = nullptr;
    if (upper == 'W')
        val = &movementF.z;
    else if (upper == 'D')
        val = &movementF.x;
    else if (upper == 'E' || upper == ' ')
        val = &movementF.y;
    else if (upper == 'S')
        val = &movementB.z;
    else if (upper == 'A')
        val = &movementB.x;
    else if (upper == 'Q' || key == "Shift")
        val = &movementB.y;
    if (val)
        *val = 0;
}
