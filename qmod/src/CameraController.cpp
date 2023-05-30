#include "main.hpp"
#include "CameraController.hpp"

DEFINE_TYPE(QRUE, CameraController);

bool click = false;

using namespace QRUE;
using namespace UnityEngine;
using namespace GlobalNamespace;

#include "GlobalNamespace/FirstPersonFlyingController.hpp"
#include "VRUIControls/VRInputModule.hpp"
#include "GlobalNamespace/VRCenterAdjust.hpp"
#include "UnityEngine/GameObject.hpp"

void CameraController::Start() {
    LOG_INFO("CameraController start");

    rotateSensitivity = moveSensitivity = 1;
    clickTime = 0.2;
    movementThreshold = 1;

    auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>();

    objectsSource->vrInputModule->set_useMouseForPressInput(true);
    objectsSource->centerAdjust->ResetRoom();
    objectsSource->centerAdjust->set_enabled(false);
    for(auto gameObject : objectsSource->controllerModels) {
        if(gameObject)
            gameObject->SetActive(false);
    }
    controller0 = objectsSource->controller0;
    controller1 = objectsSource->controller1;
    parentTransform = objectsSource->transform;
    childTransform = get_transform();
    controller0->set_enabled(false);
    controller1->set_enabled(false);
    if(auto pointer = controller1->get_transform()->Find("VRLaserPointer(Clone)"))
        pointer->get_gameObject()->SetActive(false);
    parentTransform->set_position({0, 1.7, 0});
}

#include "UnityEngine/Touch.hpp"
#include "UnityEngine/Input.hpp"
#include "UnityEngine/Time.hpp"
#include "UnityEngine/KeyCode.hpp"

void CameraController::Update() {
    if (Input::get_touchCount() > 0) {
        auto touch = Input::GetTouch(0);
        auto& pos = touch.m_Position;
        auto phase = touch.m_Phase;
        switch(phase) {
        case TouchPhase::Began:
            lastTime = UnityEngine::Time::get_time();
            lastMovement = 0;
            lastPos = pos;
            break;
        case TouchPhase::Ended:
        case TouchPhase::Canceled:
            Rotate(pos - lastPos);
            if(
                (UnityEngine::Time::get_time() - lastTime) < clickTime
                && lastMovement < movementThreshold
            )
                click = true;
            break;
        default:
            Rotate(pos - lastPos);
            lastPos = pos;
            break;
        }
    }

    Vector3 movement = {0};
    if(Input::GetKey(KeyCode::W))
        movement = movement + childTransform->get_forward();
    if(Input::GetKey(KeyCode::S))
        movement = movement - childTransform->get_forward();
    if(Input::GetKey(KeyCode::D))
        movement = movement + childTransform->get_right();
    if(Input::GetKey(KeyCode::A))
        movement = movement - childTransform->get_right();
    if(Input::GetKey(KeyCode::Space))
        movement = movement + childTransform->get_up();
    if(Input::GetKey(KeyCode::LeftControl) || Input::GetKey(KeyCode::RightControl))
        movement = movement - childTransform->get_up();
    if(movement != Vector3{0})
        Move(movement);

    controller0->get_transform()->SetPositionAndRotation(childTransform->get_position(), childTransform->get_rotation());
    controller1->get_transform()->SetPositionAndRotation(childTransform->get_position(), childTransform->get_rotation());
}

void CameraController::Rotate(Vector2 delta) {
    delta = delta * rotateSensitivity * 20;
    lastMovement += delta.get_magnitude();
    auto prev = parentTransform->get_eulerAngles();
    parentTransform->set_eulerAngles(prev + Vector3{-delta.y, delta.x, 0});
}

void CameraController::Move(Vector3 delta) {
    delta = delta * moveSensitivity / 50;
    auto prev = parentTransform->get_position();
    parentTransform->set_position(prev + delta);
}
