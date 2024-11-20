import { render } from "solid-js/web";
import "./styles.css";
import "solid-devtools";
import { createEffect, createSignal, onMount } from "solid-js";
import WebSocketRS from "tauri-plugin-websocket-api";
import { isTauri } from "./misc/dev";
import { createPersistentSignal } from "./misc/utils";

// todo: refactor websocket.ts
async function connect(
  url: string,
  worker: Worker,
): Promise<WebSocketRS | WebSocket> {
  if (isTauri()) {
    const socket = await WebSocketRS.connect(url);
    console.log("rust socket connected");
    socket.addListener((arg) => {
      switch (arg.type) {
        case undefined: // error: close without handshake
        case "Close": {
          console.log("socket closed");
          break;
        }
        case "Binary": {
          worker.postMessage({
            type: "data",
            val: new Uint8Array(arg.data),
          });
          break;
        }
      }
    });
    return socket;
  } else {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      socket.binaryType = "arraybuffer";
      socket.onopen = () => {
        console.log("browser socket connected");
        resolve(socket);
      };
      socket.onerror = reject;
      socket.onmessage = (event) => {
        worker.postMessage({
          type: "data",
          val: new Uint8Array(event.data),
        });
      };
    });
  }
}

// todo: replace these with protobuf or at least json
function format(n: number, len: number) {
  n = Math.min(Math.round(n), Math.pow(10, len) - 1);
  const s = n.toString();
  if (s.startsWith("-")) return "-" + s.slice(1).padStart(len - 1, "0");
  return s.padStart(len, "0");
}

function fformat(n: number, len: number) {
  n = Math.min(n, 10 - Math.pow(10, 2 - len));
  return n.toFixed(len - 2);
}

function NumberInput(props: {
  value: () => number;
  setValue: (val: number) => void;
  isInt?: boolean;
}) {
  // eslint-disable-next-line solid/reactivity
  const [input, setInput] = createSignal(props.value().toString());
  createEffect(() => {
    const n = props.isInt
      ? Number.parseInt(input())
      : Number.parseFloat(input());
    if (!Number.isNaN(n)) props.setValue(n);
  });

  return (
    <input
      class="small-input mr-5 w-24"
      value={input()}
      onInput={(event) => setInput(event.target.value)}
    />
  );
}

function Stream() {
  const decoder = new Worker(
    new URL("misc/decoder_worker.ts", import.meta.url),
  );

  let canvas: HTMLCanvasElement | undefined;
  let socket: WebSocketRS | WebSocket | undefined;

  const [speed, setSpeed] = createPersistentSignal(
    "fpfcMoveSpeed",
    () => 1,
    Number.parseFloat,
  );
  const [sensitivity, setSensitivity] = createPersistentSignal(
    "fpfcRotSensitivity",
    () => 1,
    Number.parseFloat,
  );
  const [fps, setFps] = createPersistentSignal(
    "fpfcFps",
    () => 30,
    Number.parseInt,
  );
  const [fov, setFov] = createPersistentSignal(
    "fpfcFov",
    () => 80,
    Number.parseFloat,
  );

  onMount(() => {
    const offscreen = canvas!.transferControlToOffscreen();
    decoder.postMessage({ type: "context", val: offscreen }, [offscreen]);
  });

  const doConnect = () => {
    connect("ws://localhost:3307", decoder)
      .then((connected) => {
        socket = connected;
        socket.send(
          "start" +
            fformat(speed(), 5) +
            fformat(sensitivity(), 5) +
            format(fps(), 3) +
            fformat(fov() / 20, 5),
        );
      })
      .catch((e) => {
        console.error("error connecting socket", e);
      });
  };
  doConnect();

  const refresh = () => {
    if (socket instanceof WebSocketRS) socket.disconnect();
    else socket?.close();
    doConnect();
  };

  const [pointerLocked, setPointerLocked] = createSignal(false);

  const onMouseMove = (event: MouseEvent) => {
    // console.log("mouse move", event.movementX, event.movementY);
    socket?.send(
      "mse" + format(event.movementX, 4) + format(-event.movementY, 4),
    );
  };

  const onMouseDown = (event: MouseEvent) => {
    // console.log("mouse down", event.button, event.button === 0);
    if (event.button === 0) socket?.send("msed");
  };

  const onMouseUp = (event: MouseEvent) => {
    // console.log("mouse up", event.button, event.button === 0);
    if (event.button === 0) socket?.send("mseu");
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // console.log("key down", event.key);
    socket?.send("keyd" + event.key);
  };

  const onKeyUp = (event: KeyboardEvent) => {
    // console.log("key up", event.key);
    socket?.send("keyu" + event.key);
  };

  document.addEventListener("pointerlockchange", () => {
    setPointerLocked(
      canvas !== undefined && document.pointerLockElement === canvas,
    );
  });

  createEffect(() => {
    if (pointerLocked()) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mousedown", onMouseDown);
      document.addEventListener("mouseup", onMouseUp);
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);
    } else {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    }
  });

  return (
    <div class="w-screen h-screen dark">
      <div class="p-2">
        <canvas
          width={1080}
          height={720}
          style={{
            border: "2px solid black",
            width: "min(100%, calc(100vh - 60px) * 1080 / 720)",
            "max-width": "1080px",
            "max-height": "720px",
          }}
          ref={canvas}
          onClick={() => {
            canvas?.requestPointerLock();
          }}
        />
        <div class="flex items-baseline pt-2 gap-2">
          Speed
          <NumberInput value={speed} setValue={setSpeed} />
          Sensitivity
          <NumberInput value={sensitivity} setValue={setSensitivity} />
          FPS
          <NumberInput value={fps} setValue={setFps} isInt />
          FOV
          <NumberInput value={fov} setValue={setFov} />
          <button class="small-button" onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

render(() => <Stream />, document.getElementById("root") as HTMLElement);
