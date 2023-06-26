import { devPacketResponse } from "./dev";
import { PacketTypes, getEvents, ListenerCallbackFunction } from "./events";
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

export function writePacket<P extends PacketWrapper = PacketWrapper>(p: P) {
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

/// Asynchronous function useful for getting results
export function sendPacketResult<
  TResponse,
  TRequest extends PacketTypes = PacketTypes
>(
  packet: TRequest,
  options?: {
    timeout?: number;
    allowUnexpectedPackets?: boolean;
    once?: boolean;
  }
): [Promise<TResponse>, () => void] {
  const listener = getEvents().ALL_PACKETS;

  // We use reference here since it's not necessary to call it "state", that is handled by `val`
  const expectedQueryID = uniqueBigNumber();

  const callback: { value: ListenerCallbackFunction<PacketWrapper> } = {
    value: undefined!,
  };

  const cancelFn = () => listener.removeListener(callback.value);

  const promise = new Promise<TResponse>((res, err) => {
    callback.value = listener.addListener((union) => {
      if (
        options?.allowUnexpectedPackets ||
        (expectedQueryID && union.queryResultId === expectedQueryID)
      ) {
        // it's guaranteed to exist ok
        const packet: TResponse = (union.Packet as Record<string, unknown>)[
          union.Packet!.$case!
        ]! as unknown as TResponse;

        if (!packet) throw "Packet is undefined why!";

        if (union.Packet?.$case == "inputError") {
          err(union.Packet.inputError);
        } else {
          // Cancel the listener, we have our value now
          cancelFn();
          res(packet);
        }
      }
    }, options?.once ?? false);

    if (options && options.timeout) {
      listener.removeListener(callback.value);
    }
  });

  writePacket({
    queryResultId: expectedQueryID,
    Packet: packet,
  });

  return [promise, cancelFn];
}
