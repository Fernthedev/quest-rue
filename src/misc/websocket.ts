import { handleGlobalPacketWrapper } from "./commands";
import { getEvents } from "./events";
import { PacketWrapper } from "./proto/qrue";
import toast from "solid-toast";
import { Accessor, createSignal } from "solid-js";

export abstract class QuestRUESocket {
  abstract connectImpl(
    address: string,
    port: number,
    id: number,
  ): Promise<boolean>;
  abstract disconnectImpl(): void;
  abstract send(data: Uint8Array): void;

  connect(address: string, port: number, toastDisplay: string | undefined) {
    if (this.connected()) console.warn("called connect on connected socket");
    this.setConnecting(true);
    this.setConnected(false);
    this.manualDisconnect = false;

    if (this.loadingToast) toast.dismiss(this.loadingToast);
    this.loadingToast = undefined;
    const id = ++this.connectionId;

    const promise = this.connectImpl(address, port, id);
    if (toastDisplay)
      this.loadingToast = toast.loading(`Connecting to ${toastDisplay}`);
    return promise.catch((e) => {
      console.log(`connection failed: ${e}`);
      if (this.connectionId === id) this.onError();
      return false;
    });
  }

  disconnect() {
    if (this.loadingToast) {
      toast.dismiss(this.loadingToast);
      this.loadingToast = undefined;
    }
    this.setConnecting(false);
    this.manualDisconnect = true;
    this.disconnectImpl();
  }

  onConnect() {
    if (this.manualDisconnect) {
      this.disconnectImpl();
      return;
    }
    if (this.loadingToast) {
      toast.success("Connected successfully", { id: this.loadingToast });
      this.loadingToast = undefined;
    }
    this.setConnecting(false);
    this.setConnected(true);
    getEvents().CONNECTED_EVENT.invoke();
  }

  onError() {
    if (this.manualDisconnect) return;
    if (this.loadingToast) {
      toast.error("Failed to connect", { id: this.loadingToast });
      this.loadingToast = undefined;
    }
    this.setConnecting(false);
    this.setConnected(false);
  }

  onDisconnect() {
    if (this.loadingToast) {
      toast.success("Disconnected", { id: this.loadingToast });
      this.loadingToast = undefined;
    }
    const wasConnected = this.connected();
    this.setConnecting(false);
    this.setConnected(false);
    getEvents().DISCONNECTED_EVENT.invoke([
      wasConnected,
      this.manualDisconnect,
    ]);
  }

  onMessage(bytes: Uint8Array) {
    const packetWrapper = PacketWrapper.decode(bytes);
    // console.log(JSON.stringify(packetWrapper));
    handleGlobalPacketWrapper(packetWrapper);
  }

  connecting: Accessor<boolean>;
  setConnecting: (v: boolean) => void;
  connected: Accessor<boolean>;
  setConnected: (v: boolean) => void;
  manualDisconnect = false;
  connectionId = 0;
  loadingToast: string | undefined = undefined;

  constructor() {
    // eslint-disable-next-line solid/reactivity
    [this.connecting, this.setConnecting] = createSignal(false);
    // eslint-disable-next-line solid/reactivity
    [this.connected, this.setConnected] = createSignal(false);
  }
}

export class NodeWebSocket extends QuestRUESocket {
  socket: WebSocket | undefined;

  connectImpl(ip: string, port: number, id: number): Promise<boolean> {
    // TODO: Disable requirement for secure websocket
    const url = `ws://${ip}:${port}`;

    return new Promise((res, err) => {
      const socket = new WebSocket(url);

      this.socket = socket;
      this.socket.binaryType = "arraybuffer";
      this.socket.onopen = () => {
        if (this.connectionId === id) {
          this.onConnect();
          res(true);
        } else {
          socket.close();
          res(false);
        }
      };
      this.socket.onclose = () => {
        if (this.connectionId === id) this.onDisconnect();
      };
      this.socket.onerror = (event) => {
        console.log("socket error:", event);
        err(event);
      };
      this.socket.onmessage = (event) => {
        if (this.connectionId === id)
          this.onMessage(new Uint8Array(event.data));
      };
    });
  }

  disconnectImpl() {
    this.socket?.close();
  }

  send(data: Uint8Array) {
    this.socket?.send(data);
  }
}

export class MockWebSocket extends QuestRUESocket {
  connectImpl(): Promise<boolean> {
    this.onConnect();
    return Promise.resolve(true);
  }

  disconnectImpl(): void {
    this.onDisconnect();
  }

  send() {}
}
