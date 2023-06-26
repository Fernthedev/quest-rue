import { devPacketResponse } from "./dev";
import { getEvents } from "./events";
import { handleGameObjects } from "./handlers/gameobject";
import { handleSafePtrAddresses } from "./handlers/variable_list";
import { PacketWrapper } from "./proto/qrue";
import { uniqueBigNumber } from "./utils";

let socket: WebSocket | undefined;

function handleGlobalPacketWrapper(packet: PacketWrapper) {
  switch (packet.Packet?.$case) {
    case "getAllGameObjectsResult": {
      handleGameObjects(packet.Packet.getAllGameObjectsResult);
      break;
    }
    case "getSafePtrAddressesResult":
      handleSafePtrAddresses(packet.Packet.getSafePtrAddressesResult);
      break;
    case "readMemoryResult": {
      console.log(packet.Packet.readMemoryResult);
      break;
    }
  }
  getEvents().ALL_PACKETS.invoke(packet);
}

export function connect(ip: string, port: number): Promise<boolean> {
  if (import.meta.env.VITE_USE_QUEST_MOCK == "true") {
    getEvents().CONNECTED_EVENT.invoke();
    return Promise.resolve(true);
  }

  const url = `ws://${ip}:${port}`;

  return new Promise((res, err) => {
    socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";
    socket.onopen = () => {
      res(true);
      getEvents().CONNECTED_EVENT.invoke();
    };
    socket.onclose = (event) => {
      res(false);
      getEvents().DISCONNECTED_EVENT.invoke(event);
    };
    socket.onerror = (event) => {
      err(event);
      getEvents().ERROR_EVENT.invoke(event);
    };
    socket.onmessage = (event) => {
      const bytes: ArrayBuffer = event.data;
      const packetWrapper = PacketWrapper.decode(new Uint8Array(bytes));
      // console.log(JSON.stringify(packetWrapper));
      handleGlobalPacketWrapper(packetWrapper);
    };
  });
}

export function isConnected() {
  if (import.meta.env.VITE_USE_QUEST_MOCK == "true") return true;

  return socket?.readyState == WebSocket.OPEN;
}

export function requestGameObjects() {
  sendPacket(
    PacketWrapper.create({
      queryResultId: uniqueBigNumber(),
      Packet: {
        $case: "getAllGameObjects",
        getAllGameObjects: {},
      },
    })
  );
}

export function sendPacket<P extends PacketWrapper = PacketWrapper>(p: P) {
  if (import.meta.env.VITE_USE_QUEST_MOCK == "true") {
    devPacketResponse(p as PacketWrapper, handleGlobalPacketWrapper);
    return;
  }

  if (isConnected()) {
    socket?.send(PacketWrapper.encode(p).finish());
  } else {
    socket?.addEventListener("open", () =>
      socket?.send(PacketWrapper.encode(p).finish())
    );
  }
}
