import { Message } from "google-protobuf";
import { sendPacket } from "./commands";
import { PacketWrapper } from "./proto/qrue";
import { ProtoGameObject } from "./proto/unity";
import { uniqueNumber } from "./utils";
import {
    Accessor,
    batch,
    createEffect,
    createResource,
    createSignal,
    onCleanup,
    untrack,
} from "solid-js";
import { deprecate } from "util";

export type GameObjectJSON = PacketJSON<ProtoGameObject>;

export type PacketWrapperCustomJSON = PacketJSON<PacketWrapper> & {
    packetType: typeof PacketWrapper.prototype.Packet;
};

// Singleton for all events
// Lazily initialized
let Events: ReturnType<typeof buildEvents> | undefined = undefined;

export function initializeEvents() {
    Events ??= buildEvents();
}

export function getEvents() {
    return Events!;
}

function buildEvents() {
    return {
        // PACKET EVENTS
        ALL_PACKETS: new EventListener<PacketWrapperCustomJSON>(),
        CONNECTED_EVENT: new EventListener<void>(),
        DISCONNECTED_EVENT: new EventListener<CloseEvent>(),
        ERROR_EVENT: new EventListener<Event>(),
    } as const;
}

export type PacketTypes = Parameters<typeof PacketWrapper.fromObject>;
export type PacketJSON<T extends Message> = ReturnType<T["toObject"]>;

/**
 * A hook that returns the value of a packet with a response
 * Essentially, it gives both the current state and a function to send a packet
 * When the packet is sent, it is given a unique id
 * When a packet with the same query ID is received, it updates the state
 *
 * @param once Only run once and then unsubscribe
 * @param allowConcurrent Allow multiple requests to run asynchronously
 * @param allowUnexpectedPackets Listen to packets with any id without having to initiate a request
 */
export function useRequestAndResponsePacket<
    TTResponse extends Message,
    TRequest extends PacketTypes[0] = PacketTypes[0],
    TResponse extends PacketJSON<TTResponse> = PacketJSON<TTResponse>
>(
    once = false,
    allowConcurrent = false,
    allowUnexpectedPackets = false
): [Accessor<TResponse | undefined>, Accessor<boolean>, (p: TRequest) => void] {
    const [val, setValue] = createSignal<TResponse | undefined>(undefined);
    const [loading, setLoading] = createSignal<boolean>(false);

    // We use reference here since it's not necessary to call it "state", that is handled by `val`
    const expectedQueryID: { value: number | undefined } = {
        value: undefined,
    };

    // Create the listener
    // onMount is likely not necessary
    const listener = getEvents().ALL_PACKETS;
    const callback = listener.addListener((union) => {
        if (
            allowUnexpectedPackets ||
            (expectedQueryID.value &&
                union.queryResultId === expectedQueryID.value)
        ) {
            // it's guaranteed to exist ok
            const packet = (union as Record<string, unknown>)[union.packetType];

            if (!packet) throw "Packet is undefined why!";

            batch(() => {
                setValue(() => packet as TResponse);
                setLoading(false);
            });

            expectedQueryID.value = undefined;
        }
    }, once);

    onCleanup(() => {
        listener.removeListener(callback);
    });

    // Return the state and a callback for invoking reads

    const refetch = (p: TRequest) => {
        if (!untrack(loading) || allowConcurrent) {
            const randomId = uniqueNumber();
            expectedQueryID.value = randomId;
            setLoading(true);
            sendPacket(
                PacketWrapper.fromObject({ queryResultId: randomId, ...p })
            );
        }
    };

    return [val, loading, refetch];
}

// TODO: An experiment, didn't work out. Maybe retry at a later date.
// export function createResourcePacket<
//     TTResponse extends Message,
//     TRequest extends PacketTypes[0] = PacketTypes[0],
//     TResponse extends PacketJSON<TTResponse> = PacketJSON<TTResponse>
// >(
//     input: Accessor<TRequest | undefined> | TRequest | undefined,
//     { once = false, allowConcurrent = false }
// ) {
//     // We use reference here since it's not necessary to call it "state", that is handled by `val`
//     const expectedQueryID: { value: number | undefined } = {
//         value: undefined,
//     };

//     const fetch = (p: TRequest) => {
//         const randomId = uniqueNumber();
//         expectedQueryID.value = randomId;

//         return new Promise((resolve, reject) => {

//         })
//     };

//     const [data, rest] = createResource<TResponse, TRequest, TRequest>(
//         input,
//         fetch
//     );

//     // Create the listener
//     // onMount is likely not necessary
//     const listener = getEvents().ALL_PACKETS;
//     const callback = listener.addListener((union) => {
//         if (
//             expectedQueryID.value &&
//             union.queryResultId === expectedQueryID.value
//         ) {
//             const packet = (union as Record<string, unknown>)[union.packetType];

//             if (!packet) throw "Packet is undefined why!";

//             expectedQueryID.value = undefined;
//         }
//     }, once);

//     onCleanup(() => {
//         listener.removeListener(callback);
//     });

//     return [
//         data,
//         {
//             ...rest,
//             // refetch: newRefetch,
//         },
//     ];
// }

/**
 * Hook that listens to a packet and updates the state based on it
 *
 * @param listener The event to listen to
 * @param once only update once when a packet is received
 * @returns The current state value
 */
export function createSignalEvent<T>(
    listener: EventListener<T>,
    once = false
): Accessor<T | undefined> {
    const [val, setValue] = createSignal<T | undefined>(undefined);

    const callback = listener.addListener((v) => {
        setValue(() => v);
    }, once);

    onCleanup(() => {
        listener.removeListener(callback);
    });

    return val;
}

export function createOnEventCallback<T, R>(
    listener: EventListener<T>,
    callback: (value: T) => R,
    once = false
) {
    const id = listener.addListener(callback, once);

    onCleanup(() => {
        listener.removeListener(id);
    });
}

export type ListenerCallbackFunction<T> = (value: T) => void;

export class EventListener<T> {
    // callback/wrapper, callback id
    private otherListeners: (
        | [ListenerCallbackFunction<T>, ListenerCallbackFunction<T> | undefined]
        | undefined
    )[] = [];

    addListener(
        callback: ListenerCallbackFunction<T>,
        once = false
    ): ListenerCallbackFunction<T> {
        const index = this.otherListeners.length++;
        if (once) {
            const onceWrapper = (v: T) => {
                callback(v);
                this.removeListener(callback);
            };

            this.otherListeners[index] = [onceWrapper, callback];
            return onceWrapper;
        }

        this.otherListeners[index] = [callback, undefined];
        return callback;
    }

    removeListener(callback: ListenerCallbackFunction<T>) {
        const index = this.otherListeners.findIndex(
            (e) => e && (e[0] === callback || (e[1] && e[1] === callback))
        );
        if (index >= 0) this.otherListeners[index] = undefined;
    }

    invoke(value: T) {
        this.otherListeners.forEach((callback) => {
            if (!callback) return;

            callback[0](value);
        });
    }
}
