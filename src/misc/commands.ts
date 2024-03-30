import { devPacketResponse, isTauri } from "./dev";
import { PacketTypes, getEvents, ListenerCallbackFunction } from "./events";
import { handleGameObjects } from "./handlers/gameobject";
import { handleSafePtrAddresses } from "./handlers/variable_list";
import { PacketWrapper } from "./proto/qrue";
import { uniqueBigNumber } from "./utils";
import { NodeWebSocket, QuestRUESocket } from "./websocket";
import { TauriWebSocket } from "./websocket_tauri";


// late init!
export let socket: QuestRUESocket = undefined!;


export function initSocket() {
  if (isTauri()) {
    socket = new TauriWebSocket();
    console.log("Using tauri web socket")
  } else {
    socket = new NodeWebSocket();
    console.log("Using node web socket")
  }

  socket = Object.freeze(socket);
}

export function handleGlobalPacketWrapper(packet: PacketWrapper) {
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

export async function writePacket<P extends PacketWrapper = PacketWrapper>(
  p: P,
): Promise<void> {
  if (import.meta.env.VITE_USE_QUEST_MOCK == "true") {
    devPacketResponse(p as PacketWrapper, handleGlobalPacketWrapper);
    return;
  }

  if (socket && socket.isConnected()) {
    socket.send(PacketWrapper.encode(p).finish());
  } else {
    // queue send for when connection starts
    getEvents().CONNECTED_EVENT.addListener(
      () => PacketWrapper.encode(p).finish(),
      true,
    );
  }
}

/// Asynchronous function useful for getting results
export function sendPacketResult<
  TResponse,
  TRequest extends PacketTypes = PacketTypes,
>(
  packet: TRequest,
  options?: {
    timeout?: number;
    allowUnexpectedPackets?: boolean;
    once?: boolean;
  },
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
