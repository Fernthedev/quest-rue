import { handleGlobalPacketWrapper } from "./commands";
import { getEvents } from "./events";
import { PacketWrapper } from "./proto/qrue";

export interface QuestRUESocket {
  connect(address: string, port: number): Promise<boolean>;

  isConnected(): boolean;

  send(data: Uint8Array): Promise<void>;
}

export class NodeWebSocket implements QuestRUESocket {
  socket: WebSocket | undefined;
  connected: boolean = false;

  connect(ip: string, port: number): Promise<boolean> {
    if (import.meta.env.VITE_USE_QUEST_MOCK == "true") {
      getEvents().CONNECTED_EVENT.invoke();
      return Promise.resolve(true);
    }

    // TODO: Disable requirement for secure websocket
    const url = `ws://${ip}:${port}`;

    return new Promise((res, err) => {
      this.socket = new WebSocket(url);
      this.socket.binaryType = "arraybuffer";
      this.socket.onopen = () => {
        this.connected = true;
        res(true);
        getEvents().CONNECTED_EVENT.invoke();
      };
      this.socket.onclose = () => {
        if (this.connected) getEvents().DISCONNECTED_EVENT.invoke();
        this.connected = false;
      };
      this.socket.onerror = (event) => {
        console.log("socket error:", event);
        err(event);
        getEvents().ERROR_EVENT.invoke(event);
      };
      this.socket.onmessage = (event) => {
        const bytes: ArrayBuffer = event.data;
        const packetWrapper = PacketWrapper.decode(new Uint8Array(bytes));
        // console.log(JSON.stringify(packetWrapper));
        handleGlobalPacketWrapper(packetWrapper);
      };
    });
  }

  isConnected() {
    if (import.meta.env.VITE_USE_QUEST_MOCK == "true") return true;

    return this.connected;
  }

  async send(data: Uint8Array): Promise<void> {
    this.socket?.send(data);
  }
}
