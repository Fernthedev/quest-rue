import WebSocket from "tauri-plugin-websocket-api";
import { QuestRUESocket } from "./websocket";

export class TauriWebSocket extends QuestRUESocket {
  socket: WebSocket | undefined;

  async connectImpl(ip: string, port: number, id: number): Promise<boolean> {
    const url = `ws://${ip}:${port}`;

    const socket = await WebSocket.connect(url);
    console.log("connection done");
    if (this.connectionId !== id) {
      console.log("disconnecting due to connection id");
      socket.disconnect();
      return false;
    }

    this.socket = socket;
    this.socket.addListener((arg) => {
      if (arg.type !== "Binary") console.log(arg, id, this.connectionId);
      if (this.connectionId !== id) return;
      switch (arg.type) {
        case undefined: // error: close without handshake
        case "Close": {
          this.onDisconnect();
          break;
        }
        case "Binary": {
          this.onMessage(new Uint8Array(arg.data));
          break;
        }
      }
    });

    this.onConnect();
    return true;
  }

  disconnectImpl() {
    this.socket?.disconnect();
  }

  async send(data: Uint8Array): Promise<void> {
    if (typeof data !== "string") this.socket?.send(Array.from<number>(data));
  }
}
