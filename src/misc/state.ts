import { createSignal } from "solid-js"
import { ProtoObject } from "./proto/unity";
import { GameObjectJSON, PacketJSON } from "./events";

export type ObjectJSON = PacketJSON<ProtoObject>;

export const [selectedObject, setSelectedObject] = createSignal<ObjectJSON | undefined>(undefined);

function gameObjectToObject(gameObject: GameObjectJSON) {
    const info = {namespaze: "UnityEngine", clazz: "GameObject", generics: []};
    const object = {address: gameObject.address, name: gameObject.name, classInfo: info};
    return object as ObjectJSON;
}

export function selectGameObject(gameObject: GameObjectJSON) {
    setSelectedObject(gameObjectToObject(gameObject));
}
