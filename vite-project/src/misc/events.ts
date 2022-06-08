import { DependencyList, useEffect, useState } from "react";
import { Constants } from "./constants";
import { PacketReceivePayload } from "./packets";

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
        CONNECTED_EVENT: createListener<void>(Constants.CONNECTED_EVENT),
        GAMEOBJECTS_LIST_EVENT: createPacketListener<string[]>(Constants.GAMEOBJECTS_LIST_EVENT)
    } as const;
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


function createPacketListener<T, P extends PacketReceivePayload = PacketReceivePayload>(eventName: Constants) {
    const listener = new EventListener<T>()

    return listener
}

function createListener<T>(eventName: Constants) {
    console.log(`Created listener for ${eventName}`)
    const listener = new EventListener<T>()

    return listener
}
