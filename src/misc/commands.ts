import { getEvents } from "./events";
import { PacketWrapper } from "./proto/qrue";
import { uniqueNumber } from "./utils";

let socket : WebSocket;

export function connect(ip: string, port: number) {
    if (import.meta.env.VITE_USE_QUEST_MOCK) return;

    socket = new WebSocket("ws://" + ip + ":" + port);
    socket.binaryType = "arraybuffer";
    socket.onopen = (event) => {
        getEvents().CONNECTED_EVENT.invoke();
    };
    socket.onmessage = (event) => {
        const bytes: Uint8Array = event.data;
        const wrapper = PacketWrapper.deserialize(bytes);
        const packetWrapper = wrapper.toObject();
        console.log(JSON.stringify(packetWrapper));

        if(wrapper.getAllGameObjectsResult !== undefined) {
            getEvents().GAMEOBJECTS_LIST_EVENT.invoke(packetWrapper.getAllGameObjectsResult!.objects!);
        }
        if(wrapper.readMemoryResult !== undefined) {
            console.log(wrapper.readMemoryResult);
        }

        getEvents().ALL_PACKETS.invoke({
            ...packetWrapper,
            packetType: wrapper.Packet
        });
    };
}

export function isConnected() {
    if (import.meta.env.VITE_USE_QUEST_MOCK) true;

    return socket.readyState == WebSocket.OPEN;
}

export function requestGameObjects() {
    sendPacket(PacketWrapper.fromObject({ queryResultId: uniqueNumber(),  getAllGameObjects: {}}));
}

export function sendPacket<P extends PacketWrapper = PacketWrapper>(p: P) {
    if (import.meta.env.VITE_USE_QUEST_MOCK) return;

    socket.send(p.serializeBinary())
}