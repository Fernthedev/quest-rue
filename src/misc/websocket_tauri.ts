import WebSocket from "tauri-plugin-websocket-api";
import { QuestRUESocket } from "./websocket";
import { handleGlobalPacketWrapper } from "./commands";
import { getEvents } from "./events";
import { PacketWrapper } from "./proto/qrue";

export class TauriWebSocket implements QuestRUESocket {
  socket: WebSocket | undefined;
  connected?: boolean | undefined;

  async connect(ip: string, port: number): Promise<boolean> {
    if (this.socket && this.connected) {
      console.warn("Web socket is already connected! Call disconnect first!");
      return true;
    }
    this.connected = false;
    if (import.meta.env.VITE_USE_QUEST_MOCK == "true") {
      getEvents().CONNECTED_EVENT.invoke();
      this.connected = true;
      return Promise.resolve(true);
    }

    const url = `ws://${ip}:${port}`;

    const ws = (this.socket = await WebSocket.connect(url));
    this.connected = true;
    getEvents().CONNECTED_EVENT.invoke();
    ws.addListener((arg) => {
      switch (arg.type) {
        case "Close": {
          console.warn(
            "Sending disconnect event with undefined! This is just me being lazy, ignore the following error if any",
          );
          getEvents().DISCONNECTED_EVENT.invoke(undefined!);
          break;
        }
        case "Binary": {
          const bytes = arg.data;
          const packetWrapper = PacketWrapper.decode(new Uint8Array(bytes));
          // console.log(JSON.stringify(packetWrapper));
          handleGlobalPacketWrapper(packetWrapper);
          break;
        }
      }
    });

    return true;
  }

  isConnected(): boolean {
    if (import.meta.env.VITE_USE_QUEST_MOCK == "true") return true;

    return this.connected ?? false;
  }

  async send(
    data: Uint8Array,
  ): Promise<void> {
      if (typeof data === "string") {
          return
      }
      
    this.socket?.send(Array.from<number>(data));
  }
}
