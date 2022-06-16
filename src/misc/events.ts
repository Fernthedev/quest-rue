import { DependencyList, useEffect, useState } from "react";
import { sendPacket } from "./commands";
import { GameObject, PacketWrapper } from "./proto/qrue";
import { uniqueNumber } from "./utils";

// Singleton for all events
// Lazily initialized
let Events: ReturnType<typeof buildEvents> | undefined = undefined

export function initializeEvents() {
    Events ??= buildEvents();
}

export function getEvents() {
    return Events!
}

function buildEvents() {
    return {
        // PACKET EVENTS
        ALL_PACKETS: new EventListener<ReturnType<typeof PacketWrapper.prototype.toObject>>(),
        CONNECTED_EVENT: new EventListener<void>(),
        GAMEOBJECTS_LIST_EVENT: new EventListener<ReturnType<typeof GameObject.prototype.toObject>[]>(),

        // INTERNAL EVENTS
        SELECTED_GAME_OBJECT: new EventListener<ReturnType<typeof GameObject.prototype.toObject> | undefined>()
    } as const;
}

export type PacketTypes = Parameters<typeof PacketWrapper.fromObject>;

export function useRequestAndResponsePacket<T, P extends PacketTypes[0] = PacketTypes[0]>(deps?: DependencyList, once = false): [T | undefined, (p: P) => void] {
    const [val, setValue] = useState<T | undefined>(undefined)
    const [expectedQueryID, setExpectedQueryID] = useState<number | undefined>(undefined)

    const fixedDeps = deps ? [expectedQueryID, ...deps] : undefined;

    useEffect(() => {
        const listener = getEvents().ALL_PACKETS;
        const callback = listener.addListener((v) => {
            if (expectedQueryID && v.queryResultId === expectedQueryID) {
                const packet = Object.values(v).find(e => e !== expectedQueryID)!

                if (!packet) throw "Packet is undefined why!"

                setValue(packet as T)
                setExpectedQueryID(undefined)
            }
        }, once)

        return () => {
            listener.removeListener(callback)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, fixedDeps)

    return [val, (p: P) => {
        const randomId = uniqueNumber();
        setExpectedQueryID(randomId)
        sendPacket(PacketWrapper.fromObject({queryResultId: randomId, ...p}));
    }];
}

export function useListenToEvent<T>(listener: EventListener<T>, deps?: DependencyList, once = false) : T | undefined {
    const [val, setValue] = useState<T | undefined>(undefined)

    useEffect(() => {
        const callback = listener.addListener((v) => {
            setValue(v)
        }, once)

        return () => {
            listener.removeListener(callback)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return val;
}

export type ListenerCallbackFunction<T> = (value: T) => void;

export class EventListener<T> {
    // callback/wrapper, callback id
    private otherListeners: ([ListenerCallbackFunction<T>, (ListenerCallbackFunction<T> | undefined)] | undefined)[] = []

    addListener(callback: ListenerCallbackFunction<T>, once = false): ListenerCallbackFunction<T> {
        let index = this.otherListeners.findIndex(e => !e)
        if (!index || index < 0) index = this.otherListeners.length;
        if (once) {
            const onceWrapper = (v: T) => {
                callback(v)
                this.removeListener(callback)
            };

            this.otherListeners[index] = [onceWrapper, callback] 
            return onceWrapper;
        } else {
            this.otherListeners[index] = [callback, undefined]
            return callback;
        }
    }

    removeListener(callback: ListenerCallbackFunction<T>) {
        const index = this.otherListeners.findIndex(e => e && (e[0] === callback || (e[1] && e[1] === callback)))
        if (index >= 0) this.otherListeners[index] = undefined;
    }
    
    invoke(value: T) { 
        this.otherListeners.forEach(callback => {
            if (!callback) return;

            callback[0](value)
        });
    }
}