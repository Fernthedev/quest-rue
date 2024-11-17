#include "CameraController.hpp"

#include "UnityEngine/GameObject.hpp"
#include "UnityEngine/Transform.hpp"
#include "assets.hpp"
#include "main.hpp"
#include "sombrero/shared/FastVector2.hpp"
#include "sombrero/shared/FastVector3.hpp"

DEFINE_TYPE(QRUE, CameraController);

using namespace QRUE;
using namespace UnityEngine;

bool fpfcEnabled = true;

float rotateSensitivity = 1;
float moveSensitivity = 1;

#ifdef BEAT_SABER
bool click = false;
HMUI::UIKeyboard* keyboardOpen = nullptr;

#include "GlobalNamespace/FirstPersonFlyingController.hpp"
#include "GlobalNamespace/PauseController.hpp"
#include "GlobalNamespace/PauseMenuManager.hpp"
#include "GlobalNamespace/UIKeyboardManager.hpp"
#include "GlobalNamespace/VRCenterAdjust.hpp"
#include "UnityEngine/EventSystems/PointerEventData.hpp"
#include "VRUIControls/VRInputModule.hpp"
#include "VRUIControls/VRLaserPointer.hpp"
#include "VRUIControls/VRPointer.hpp"

using namespace GlobalNamespace;

SafePtrUnity<VRUIControls::VRInputModule> latestInputModule;

GameObject* GetHovered() {
    if (!latestInputModule)
        return nullptr;
    auto eventData = latestInputModule->GetLastPointerEventData(-1);
    if (eventData)
        return eventData->pointerEnter;
    return nullptr;
}

GameObject* GetPauseMenu() {
    if (auto ret = GameObject::Find("PauseMenu"))
        return ret;
    else if (auto ret = GameObject::Find("TutorialPauseMenu"))
        return ret;
    else if (auto ret = GameObject::Find("MultiplayerLocalActivePlayerInGameMenuViewController"))
        return ret;
    else
        return nullptr;
}
#endif

void CameraController::OnEnable() {
    fpfcEnabled = true;
    LOG_INFO("CameraController enable");

    movementF = {0, 0, 0};
    movementB = {0, 0, 0};

#ifdef BEAT_SABER
    GetControllers();
#endif
}

void CameraController::OnDisable() {
    fpfcEnabled = false;
    LOG_INFO("CameraController disable");

    click = false;

#ifdef BEAT_SABER
    ReleaseControllers();
#endif
}

#include "System/Action.hpp"
#include "System/Action_1.hpp"
#include "UnityEngine/Input.hpp"
#include "UnityEngine/KeyCode.hpp"
#include "UnityEngine/Time.hpp"
#include "UnityEngine/Touch.hpp"

void CameraController::Update() {
    auto transform = get_transform();
    Sombrero::FastVector3 pos = transform->get_position();

    auto movement = Sombrero::FastVector3(transform->TransformDirection(movementF)) - transform->TransformDirection(movementB);
    movement = movement * moveSensitivity * Time::get_deltaTime() * 2;
    transform->set_position(pos + movement);

    if (UnityW<VRController>(controller0) && UnityW<VRController>(controller1)) {
        controller0->get_transform()->SetPositionAndRotation(pos, transform->get_rotation());
        controller1->get_transform()->SetPositionAndRotation(pos, transform->get_rotation());
    }
}

void CameraController::Rotate(UnityEngine::Vector2 delta) {
    delta = Sombrero::FastVector2(delta) * rotateSensitivity / 4;
    Sombrero::FastVector3 prev = get_transform()->get_eulerAngles();
    get_transform()->set_eulerAngles(prev + Vector3(-delta.y, delta.x, 0));
}

void CameraController::KeyDown(StringW key) {
#ifdef BEAT_SABER
    if (keyboardOpen) {
        if (key == "Backspace" || key == "Delete")
            keyboardOpen->deleteButtonWasPressedEvent->Invoke();
        else if (key == "Enter")
            keyboardOpen->okButtonWasPressedEvent->Invoke();
        else
            keyboardOpen->keyWasPressedEvent->Invoke(key[0]);
        return;
    }
    if (key == "F2") {
        ReleaseControllers();
        GetControllers();
        return;
    }
    auto upper = toupper(key[0]);
    if (key->get_Length() != 1)
        upper = '-';
    if (upper == 'P') {
        if (auto pauser = Object::FindObjectOfType<PauseController*>())
            pauser->Pause();
    } else if (upper == 'R') {
        if (auto pauser = Object::FindObjectOfType<PauseMenuManager*>())
            pauser->RestartButtonPressed();
    } else if (upper == 'M') {
        if (auto pauser = Object::FindObjectOfType<PauseMenuManager*>())
            pauser->MenuButtonPressed();
    } else if (upper == 'C') {
        if (auto pauser = Object::FindObjectOfType<PauseMenuManager*>())
            pauser->ContinueButtonPressed();
    }
#else
    auto upper = toupper(key[0]);
#endif
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
#ifdef BEAT_SABER
    if (keyboardOpen)
        return;
#endif
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

void CameraController::MouseDown() {
#ifdef BEAT_SABER
    click = true;
#endif
}

void CameraController::MouseUp() {
#ifdef BEAT_SABER
    click = false;
#endif
}

#ifdef BEAT_SABER
void CameraController::GetControllers() {
    controller0 = nullptr;
    controller1 = nullptr;

#ifdef UNITY_2021
    // in level
    if (auto pauseMenu = GetPauseMenu()) {
        // can't just search for "MenuControllers" because there are two, we need
        // the one that's a child of the pause menu
        auto transform = pauseMenu->transform->Find("MenuControllers");
        controller0 = transform->Find("ControllerLeft")->GetComponent<VRController*>();
        controller1 = transform->Find("ControllerRight")->GetComponent<VRController*>();
        // in main menu
    } else if (auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>()) {
        objectsSource->_centerAdjust->ResetRoom();
        objectsSource->_centerAdjust->enabled = false;
        for (auto gameObject : objectsSource->_controllerModels) {
            if (gameObject)
                gameObject->SetActive(false);
        }
        controller0 = objectsSource->_controller0;
        controller1 = objectsSource->_controller1;
    }
    if (controller0 && controller1) {
        controller0->mouseMode = true;
        controller1->mouseMode = true;
        latestInputModule = Object::FindObjectOfType<VRUIControls::VRInputModule*>();
    }
#else
    // in level
    if (auto pauseMenu = GetPauseMenu()) {
        // can't just search for "MenuControllers" because there are two, we need
        // the one that's a child of the pause menu
        auto transform = pauseMenu->get_transform()->Find("MenuControllers");
        controller0 = transform->Find("ControllerLeft")->GetComponent<VRController*>();
        controller1 = transform->Find("ControllerRight")->GetComponent<VRController*>();
        if (auto vrInputModule = Object::FindObjectOfType<VRUIControls::VRInputModule*>()) {
            latestInputModule = vrInputModule;
            vrInputModule->set_useMouseForPressInput(true);
            vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(false);
        }
        // in main menu
    } else if (auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>()) {
        latestInputModule = objectsSource->vrInputModule;
        objectsSource->vrInputModule->set_useMouseForPressInput(true);
        objectsSource->vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(false);
        objectsSource->centerAdjust->ResetRoom();
        objectsSource->centerAdjust->set_enabled(false);
        for (auto gameObject : objectsSource->controllerModels) {
            if (gameObject)
                gameObject->SetActive(false);
        }
        controller0 = objectsSource->controller0;
        controller1 = objectsSource->controller1;
    }
#endif

    if (controller0 && controller1) {
        controller0->set_enabled(false);
        controller1->set_enabled(false);
        if (auto pointer = controller1->get_transform()->Find("VRLaserPointer(Clone)"))
            pointer->get_gameObject()->SetActive(false);
        if (auto pointer = controller1->get_transform()->Find("MenuHandle"))
            pointer->get_gameObject()->SetActive(false);
    } else
        LOG_INFO("Failed to find menu controllers for FPFC");
}

void CameraController::ReleaseControllers() {
    controller0 = nullptr;
    controller1 = nullptr;

#ifdef UNITY_2021
    if (auto pauseMenu = GetPauseMenu()) {
        LOG_DEBUG("Using controllers from pause menu");
        auto transform = pauseMenu->get_transform()->Find("MenuControllers");
        controller0 = transform->Find("ControllerLeft")->GetComponent<VRController*>();
        controller1 = transform->Find("ControllerRight")->GetComponent<VRController*>();
    } else if (auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>()) {
        LOG_DEBUG("Using controllers from original fpfc");
        objectsSource->_centerAdjust->set_enabled(true);
        for (auto gameObject : objectsSource->_controllerModels) {
            if (gameObject)
                gameObject->SetActive(true);
        }
        controller0 = objectsSource->_controller0;
        controller1 = objectsSource->_controller1;
    }
    if (controller0 && controller1) {
        controller0->mouseMode = false;
        controller1->mouseMode = false;
    }

    latestInputModule = nullptr;
#else
    if (auto pauseMenu = GetPauseMenu()) {
        LOG_DEBUG("Using controllers from pause menu");
        auto transform = pauseMenu->get_transform()->Find("MenuControllers");
        controller0 = transform->Find("ControllerLeft")->GetComponent<VRController*>();
        controller1 = transform->Find("ControllerRight")->GetComponent<VRController*>();
        if (auto vrInputModule = Object::FindObjectOfType<VRUIControls::VRInputModule*>()) {
            vrInputModule->set_useMouseForPressInput(false);
            vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(true);
        }
    } else if (auto objectsSource = Object::FindObjectOfType<FirstPersonFlyingController*>()) {
        LOG_DEBUG("Using controllers from original fpfc");
        objectsSource->vrInputModule->set_useMouseForPressInput(false);
        objectsSource->vrInputModule->vrPointer->laserPointerPrefab->get_gameObject()->SetActive(true);
        objectsSource->centerAdjust->set_enabled(true);
        for (auto gameObject : objectsSource->controllerModels) {
            if (gameObject)
                gameObject->SetActive(true);
        }
        controller0 = objectsSource->controller0;
        controller1 = objectsSource->controller1;
    }

    latestInputModule = nullptr;
#endif

    if (controller0 && controller1) {
        controller0->set_enabled(true);
        controller1->set_enabled(true);
        if (auto pointer = controller1->get_transform()->Find("VRLaserPointer(Clone)"))
            pointer->get_gameObject()->SetActive(true);
        if (auto pointer = controller1->get_transform()->Find("MenuHandle"))
            pointer->get_gameObject()->SetActive(true);
    }
}
#endif
