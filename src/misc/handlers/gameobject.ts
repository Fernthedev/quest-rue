import { GameObjectJSON, PacketJSON } from "../events";
import { GetAllGameObjectsResult } from "../proto/qrue";

import { proxy } from 'valtio'

interface GameObjectStore {
    objects: GameObjectJSON[] | null
    objectsMap: Record<number, [GameObjectJSON, symbol]> | null,
    // parent -> children[]
    childrenMap: Record<number, number[]> | null
}

export const gameObjectsStore = proxy<GameObjectStore>({
    objects: null,
    objectsMap: null,
    childrenMap: null
})

export function handleGameObjects(packet: PacketJSON<GetAllGameObjectsResult>) {

    gameObjectsStore.objects = packet.objects ?? null;

    
    const objectsMap: Record<number, [GameObjectJSON, symbol]> | null = packet.objects ? {} : null;
    const childrenMap: Record<number, number[]> | null = packet.objects ? {} : null;

    if (objectsMap) {
        packet.objects?.forEach(o => {
            objectsMap[o.transform!.address!] = [o, Symbol(o.transform!.address)];
        });

        if (childrenMap) {
            Object.values(objectsMap).forEach(pair => {
                const o = pair[0];
                // ignore the error messages!
                const address = o.transform?.address;

                if (!address) return;

                if (!childrenMap[address])
                    childrenMap[address] = []

                const parent = o.transform?.parent;

                if (parent) {
                    if (!childrenMap[parent])
                        childrenMap[parent] = []

                    childrenMap[parent].push(address)
                }
            });
        }
    }

  

    if (gameObjectsStore.objectsMap != objectsMap) {
        gameObjectsStore.objectsMap = objectsMap;
    }
    if (gameObjectsStore.childrenMap != childrenMap) {
        gameObjectsStore.childrenMap = childrenMap;
    }
}