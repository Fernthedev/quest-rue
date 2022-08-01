import { MutableRefObject, useEffect, useRef, useState } from "react";
import { sendPacket } from "./commands";
import { PacketWrapper } from "./proto/qrue";
import { ProtoGameObject } from "./proto/unity";
import { uniqueNumber } from "./utils";

export type GameObjectJSON = ReturnType<typeof ProtoGameObject.prototype.toObject>;

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
        GAMEOBJECTS_LIST_EVENT: new EventListener<GameObjectJSON[]>(),
    } as const;
}

export type PacketTypes = Parameters<typeof PacketWrapper.fromObject>;

/**
 * A hook that returns the value of a packet with a response
 * Essentially, it gives both the current state and a function to send a packet
 * When the packet is sent, it is given a unique id
 * When a packet with the same query ID is received, it updates the state
 */
export function useRequestAndResponsePacket<T, P extends PacketTypes[0] = PacketTypes[0]>(once = false): [T | undefined, (p: P) => void] {
    const [val, setValue] = useState<T | undefined>(undefined)

    // We use reference here since it's not necessary to call it "state", that is handled by `val`
    const expectedQueryID: MutableRefObject<number | undefined> = useRef<number | undefined>(undefined)

    // Create the listener 
    useEffect(() => {
        const listener = getEvents().ALL_PACKETS;
        const callback = listener.addListener((v) => {
            if (expectedQueryID && v.queryResultId === expectedQueryID.current) {
                const packet = Object.values(v).find(e => e !== expectedQueryID)!

                if (!packet) throw "Packet is undefined why!"

                setValue(packet as T)
                
                expectedQueryID.current = undefined;
            }
        }, once)

        return () => {
            listener.removeListener(callback)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Return the state and a callback for invoking reads
    return [val, (p: P) => {
        const randomId = uniqueNumber();
        expectedQueryID.current = randomId;
        sendPacket(PacketWrapper.fromObject({queryResultId: randomId, ...p}));
    }];
}

/**
 * Hook that listens to a packet and updates the state based on it
 * 
 * @param listener The event to listen to
 * @param once only update once when a packet is received
 * @returns The current state value
 */
export function useListenToEvent<T>(listener: EventListener<T>, once = false) : T | undefined {
    const [val, setValue] = useState<T | undefined>(undefined)

    useEffect(() => {
        const callback = listener.addListener((v) => {
            setValue(v)
        }, once)

        return () => {
            listener.removeListener(callback)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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