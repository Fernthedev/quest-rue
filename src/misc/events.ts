import { listen, UnlistenFn, once as onceListen } from "@tauri-apps/api/event";
import { Constants } from "./constants";
import { PacketReceivePayload } from "./packets";

export function listenToConnect(receiveCallback: ReceiveCallback<void>, once = false) {
    return listenToEvent<void>(Constants.CONNECTED_EVENT, receiveCallback, once)
}

export function listenToGameObjects(receiveCallback: ReceiveCallback<string[]>, once = false) {
    return listenToPacketEvent<string[]>(Constants.GAMEOBJECTS_LIST_EVENT, receiveCallback, once)
}

export type ReceiveCallback<T> = (r: T) => void;

export function listenToPacketEvent<T, P extends PacketReceivePayload = PacketReceivePayload>(eventName: string, receiveCallback: ReceiveCallback<T>, once = false): UnlistenFn {
    return listenToEvent<P>(eventName, (r: P) => receiveCallback(r.general_packet_data as T))
}

export function listenToEvent<T>(eventName: string, receiveCallback: ReceiveCallback<T>, once = false): UnlistenFn {
    let unlisten: UnlistenFn | undefined;

    // You can await here
    if (!once) {
        listen<T>(eventName, event => {
            receiveCallback(event.payload as T);
        }).then((l) => unlisten = l); // assign unlisten callback
    } else {
        onceListen<T>(eventName, event => {
            receiveCallback(event.payload as T);
        }).then((l) => unlisten = l); // assign unlisten callback
    }

    // Unsubcribe 
    return () => {
        if (unlisten) {
            unlisten()
        }
    };
}

// export type CheckCallback<T> = (result: T) => (boolean) | undefined;

// export function useListenToEffect<T>(eventName: string, callback?: CheckCallback<T>, deps: DependencyList = []) {
//     callback ??= () => true;

//     const [value, setValue] = useState<T | undefined>(undefined)

//     useEffect(() => {
//         listenToEvent<T>(eventName, (r) => {
//             if (callback && !callback(r)) return;
            
//             setValue(r);
//         })
//     }, deps)


//     return [value, setValue];
// }