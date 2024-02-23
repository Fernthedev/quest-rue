#ifdef BEAT_SABER
#include "main.hpp"
#include "CameraController.hpp"

DEFINE_TYPE(QRUE, CameraController);

bool enabled = true;

bool click = false;
HMUI::UIKeyboard* keyboardOpen = nullptr;

float rotateSensitivity = 1;
float moveSensitivity = 1;
float clickTime = 0.2;
float movementThreshold = 1;
float backspaceTime = 0.5;

#include "VRUIControls/VRInputModule.hpp"
#include "UnityEngine/EventSystems/PointerEventData.hpp"

SafePtrUnity<VRUIControls::VRInputModule> latestInputModule;

UnityEngine::GameObject* GetHovered() {
    if(!latestInputModule)
        return nullptr;
    auto eventData = latestInputModule->GetLastPointerEventData(-1);
    if(eventData)
        return eventData->pointerEnter;
    return nullptr;
}

UnityEngine::GameObject* GetPauseMenu() {
    if(auto ret = UnityEngine::GameObject::Find("PauseMenu"))
        return ret;
    else if(auto ret = UnityEngine::GameObject::Find("TutorialPauseMenu"))
        return ret;
    else if(auto ret = UnityEngine::GameObject::Find("MultiplayerLocalActivePlayerInGameMenuViewController"))
        return ret;
    else
        return nullptr;
}

using namespace QRUE;
using namespace UnityEngine;
using namespace GlobalNamespace;

#include "GlobalNamespace/FirstPersonFlyingController.hpp"
#include "VRUIControls/VRPointer.hpp"
#include "VRUIControls/VRLaserPointer.hpp"
#include "GlobalNamespace/VRCenterAdjust.hpp"

void CameraController::OnEnable() {
    if(!enabled)
        return;
    LOG_INFO("CameraController enable");

    childTransform = get_transform();
    parentTransform = childTransform->GetParent();

    if(!parentTransform) {
        set_enabled(false);
        return;
    }

    static auto disablePositionalTracking = il2cpp_utils::resolve_icall<void, bool>
        ("UnityEngine.XR.InputTracking::set_disablePositionalTracking");
    disablePositionalTracking(true);

    parentTransform->set_position({0, 1.5, 0});
    parentTransform->set_eulerAngles({0, 0, 0});
    childTransform->set_localPosition({0, 0, 0});
    childTransform->set_localEulerAngles({0, 0, 0});

    // in level
    if(auto pauseMenu = GetPauseMenu()) {
        // can't just search for "MenuControllers" because there are two, we need the one that's a child of the pause menu
        auto transform = pauseMenu->get_transform()->Find("MenuControllers");
        controller0 = transform->Find("ControllerLeft")->GetComponent<VRController*>();
        controller1 = transform->Find("ControllerRight")->GetComponent<VRController*>();
        if(auto vrInputModule = Object::FindObjectOfType<VRUIControls::VRInputModule*>()) {
            latestInputModule = vrInputModule;
            vrInputModule->set_useMouseForPressInput(true);
            vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(false);
        }
    // in main menu
    } else if(auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>()) {
        latestInputModule = objectsSource->vrInputModule;
        objectsSource->vrInputModule->set_useMouseForPressInput(true);
        objectsSource->vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(false);
        objectsSource->centerAdjust->ResetRoom();
        objectsSource->centerAdjust->set_enabled(false);
        for(auto gameObject : objectsSource->controllerModels) {
            if(gameObject)
                gameObject->SetActive(false);
        }
        controller0 = objectsSource->controller0;
        controller1 = objectsSource->controller1;
    }

    if(controller0 && controller1) {
        controller0->set_enabled(false);
        controller1->set_enabled(false);
        if(auto pointer = controller1->get_transform()->Find("VRLaserPointer(Clone)"))
            pointer->get_gameObject()->SetActive(false);
    }
}

void CameraController::OnDisable() {
    if(enabled)
        return;
    LOG_INFO("CameraController disable");

    if(!parentTransform)
        return;

    // reverse of enable
    static auto disablePositionalTracking = il2cpp_utils::resolve_icall<void, bool>
        ("UnityEngine.XR.InputTracking::set_disablePositionalTracking");
    disablePositionalTracking(false);

    parentTransform->set_position({0, 0, 0});
    parentTransform->set_eulerAngles({0, 0, 0});

    if(auto pauseMenu = GetPauseMenu()) {
        LOG_DEBUG("Using controllers from pause menu");
        auto transform = pauseMenu->get_transform()->Find("MenuControllers");
        controller0 = transform->Find("ControllerLeft")->GetComponent<VRController*>();
        controller1 = transform->Find("ControllerRight")->GetComponent<VRController*>();
        if(auto vrInputModule = Object::FindObjectOfType<VRUIControls::VRInputModule*>()) {
            vrInputModule->set_useMouseForPressInput(false);
            vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(true);
        }
    } else if(auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>()) {
        LOG_DEBUG("Using controllers from original fpfc");
        objectsSource->vrInputModule->set_useMouseForPressInput(false);
        objectsSource->vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(true);
        objectsSource->centerAdjust->set_enabled(true);
        for(auto gameObject : objectsSource->controllerModels) {
            if(gameObject)
                gameObject->SetActive(true);
        }
        controller0 = objectsSource->controller0;
        controller1 = objectsSource->controller1;
    }

    latestInputModule = nullptr;

    if(controller0 && controller1) {
        controller0->set_enabled(true);
        controller1->set_enabled(true);
        if(auto pointer = controller1->get_transform()->Find("VRLaserPointer(Clone)"))
            pointer->get_gameObject()->SetActive(true);
    } else
        LOG_INFO("Failed to find menu controllers for FPFC");
}

#include "UnityEngine/Touch.hpp"
#include "UnityEngine/Input.hpp"
#include "UnityEngine/Time.hpp"
#include "UnityEngine/KeyCode.hpp"
#include "GlobalNamespace/PauseController.hpp"
#include "GlobalNamespace/PauseMenuManager.hpp"
#include "GlobalNamespace/UIKeyboardManager.hpp"
#include "System/Action_1.hpp"
#include "System/Action.hpp"

void CameraController::Update() {
    if(Input::GetKeyDown(KeyCode::X)) {
        LOG_INFO("Disabling FPFC due to X press (reenable with Z)");

        enabled = false;
        set_enabled(false);
        return;
    }

    float time = UnityEngine::Time::get_time();

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
                (time - lastTime) < clickTime
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

    if(!keyboardOpen) {
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

        if(Input::GetKeyDown(KeyCode::Escape)) {
            if(auto pauser = Object::FindObjectOfType<PauseController*>())
                pauser->Pause();
        }
        else if(Input::GetKeyDown(KeyCode::Return)) {
            if(auto pauser = Object::FindObjectOfType<PauseMenuManager*>())
                pauser->ContinueButtonPressed();
        }
        else if(Input::GetKeyDown(KeyCode::Q)) {
            if(auto pauser = Object::FindObjectOfType<PauseMenuManager*>())
                pauser->MenuButtonPressed();
        }
    } else {
        if(Input::GetKey(KeyCode::Escape)) {
            if(auto manager = Object::FindObjectOfType<UIKeyboardManager*>())
                manager->CloseKeyboard();
            return;
        }

        static auto getInputString = il2cpp_utils::resolve_icall<StringW>("UnityEngine.Input::get_inputString");
        if(Input::get_anyKeyDown()) {
            for(auto& c : getInputString()) {
                if(c != u'\n' && c != u'\b')
                    keyboardOpen->keyWasPressedEvent->Invoke(c);
            }
        }
        if(Input::GetKey(KeyCode::Backspace)) {
            if(backspaceHold || time - lastBackspace > backspaceTime) {
                if(backspaceHoldStart)
                    backspaceHold = true;
                backspaceHoldStart = true;
                lastBackspace = time;
                keyboardOpen->deleteButtonWasPressedEvent->Invoke();
            }
        } else
            backspaceHold = backspaceHoldStart = false;

        if(Input::GetKeyDown(KeyCode::Return))
            keyboardOpen->okButtonWasPressedEvent->Invoke();
    }

    if(controller0 && controller1) {
        controller0->get_transform()->SetPositionAndRotation(childTransform->get_position(), childTransform->get_rotation());
        controller1->get_transform()->SetPositionAndRotation(childTransform->get_position(), childTransform->get_rotation());
    }
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
#endif
