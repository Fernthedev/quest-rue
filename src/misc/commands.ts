


import { getEvents } from "./events";
import { PacketWrapper } from "./proto/qrue";
import { uniqueNumber } from "./utils";

let socket : WebSocket;

export function connect(ip: string, port: number) {
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

        getEvents().ALL_PACKETS.invoke(packetWrapper);
    };
}

export function isConnected() {
    return socket.readyState == WebSocket.OPEN;
}

export function requestGameObjects() {
    socket.send(PacketWrapper.fromObject({ queryResultId: uniqueNumber(),  getAllGameObjects: {}}).serializeBinary());
}

export function sendPacket<P extends PacketWrapper = PacketWrapper>(p: P) {
    socket.send(p.serializeBinary())
}