import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Constants } from "./constants";
import { PacketReceivePayload } from "./packets";

export function listenToGameOjects(onGameObjectReceive: (objects: string[]) => void): UnlistenFn {
    let unlisten: UnlistenFn | undefined;

    // You can await here
    listen<PacketReceivePayload>(Constants.GAMEOBJECTS_LIST_EVENT, event => {
        onGameObjectReceive(event.payload.general_packet_data as string[]);
    }).then((l) => unlisten = l); // assign unlisten callback

    // Unsubcribe 
    return () => {
        if (unlisten) {
            unlisten()
        }
    };
}