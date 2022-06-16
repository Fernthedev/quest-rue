


import { getEvents } from "./events";
import { PacketWrapper, FindGameObjects } from "./proto/qrue";

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
        console.log(wrapper.toObject());
        const packetWrapper = wrapper.toObject();

        if(wrapper.findGameObjectResult !== undefined) {
            getEvents().GAMEOBJECTS_LIST_EVENT.invoke(packetWrapper.findGameObjectResult!.foundObjects!);
        }

        getEvents().ALL_PACKETS.invoke(packetWrapper);
    };
}

export function isConnected() {
    return socket.readyState == WebSocket.OPEN;
}

export function requestGameObjects() {
    socket.send(PacketWrapper.fromObject({ findGameObject: {queryId: 1}}).serializeBinary());
}

export function sendPacket<P extends PacketWrapper = PacketWrapper>(p: P) {
    socket.send(p.serializeBinary())
}