


import { getEvents } from "./events";
import { PacketWrapper, FindGameObjects } from "./proto/qrue";

var socket : WebSocket;

export function connect(ip: string, port: number) {
    socket = new WebSocket("ws://" + ip + ":" + port);
    socket.binaryType = "arraybuffer";
    socket.onopen = (event) => {
        getEvents().CONNECTED_EVENT.invoke();
    };
    socket.onmessage = (event) => {
        const bytes: Uint8Array = event.data;
        const wrapper = PacketWrapper.deserialize(bytes);
        if(wrapper.findGameObjectResult != undefined) {
            getEvents().GAMEOBJECTS_LIST_EVENT.invoke(wrapper.findGameObjectResult.toObject().foundObjects);
        }
    };
}

export function isConnected() {
    return socket.readyState == WebSocket.OPEN;
}

export function requestGameObjects() {
    socket.send(PacketWrapper.fromObject({ findGameObject: {queryId: 1}}).serializeBinary());
}