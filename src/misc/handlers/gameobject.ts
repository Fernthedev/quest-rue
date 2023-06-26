import { batch } from "solid-js";
import { GameObjectJSON, PacketJSON } from "../events";
import { GetAllGameObjectsResult, PacketWrapper } from "../proto/qrue";
import { createStore, reconcile } from "solid-js/store";
import { writePacket } from "../commands";
import { uniqueBigNumber } from "../utils";

// type is based on Transform's address
export type GameObjectIndex = Exclude<
  GameObjectJSON["transform"],
  undefined
>["address"];

interface GameObjectStore {
  objects: GameObjectJSON[] | null;
  objectsMap: Map<GameObjectIndex, [obj: GameObjectJSON, id: symbol]> | null;
  // parent -> children[]
  childrenMap: Map<GameObjectIndex, GameObjectIndex[]> | null;
}

export const [gameObjectsStore, setGameObjectsStore] =
  createStore<GameObjectStore>({
    objects: null,
    objectsMap: null,
    childrenMap: null,
  });

export function handleGameObjects(packet: PacketJSON<GetAllGameObjectsResult>) {
  batch(() => {
    setGameObjectsStore("objects", reconcile(packet.objects ?? null));

    const objectsMap: GameObjectStore["objectsMap"] | null =
      packet.objects && new Map();
    const childrenMap: GameObjectStore["childrenMap"] | null =
      packet.objects && new Map();

    if (objectsMap) {
      packet.objects?.forEach((o) =>
        objectsMap.set(o.transform!.address!, [
          o,
          Symbol(o.transform!.address.toString()),
        ])
      );

      if (childrenMap) {
        objectsMap.forEach((pair) => {
          const o = pair[0];
          // ignore the error messages!
          const address = o.transform?.address;

          if (!address) return;

          if (!childrenMap.has(address)) childrenMap.set(address, []);

          const parent = o.transform?.parent;

          if (parent) {
            if (!childrenMap.has(parent)) childrenMap.set(parent, []);

            childrenMap.get(parent)?.push(address);
          }
        });
      }
    }
    setGameObjectsStore("objectsMap", reconcile(objectsMap));
    setGameObjectsStore("childrenMap", reconcile(childrenMap));
  });
}
export function requestGameObjects() {
  writePacket(
    PacketWrapper.create({
      queryResultId: uniqueBigNumber(),
      Packet: {
        $case: "getAllGameObjects",
        getAllGameObjects: {},
      },
    })
  );
}
