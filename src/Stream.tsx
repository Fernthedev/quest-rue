import { render } from "solid-js/web";
import "./styles.css";
import "solid-devtools";
import { createEffect, createSignal } from "solid-js";
import WebSocketRS from "tauri-plugin-websocket-api";
import { isTauri } from "./misc/dev";

// todo: refactor websocket.ts
function connect(url: string, worker: Worker) {
  if (isTauri()) {
    WebSocketRS.connect(url)
      .then((connected) => {
        console.log("socket connected");
        connected.addListener((arg) => {
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
        connected.send("start");
      })
      .catch((err) => {
        console.log("failure connecting socket", err);
      });
  } else {
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";
    socket.onopen = () => {
      console.log("socket connected");
      socket.send("start");
    };
    socket.onmessage = (event) => {
      worker.postMessage({
        type: "data",
        val: new Uint8Array(event.data),
      });
    };
  }
}

function Stream() {
  const decoder = new Worker(
    new URL("misc/decoder_worker.ts", import.meta.url),
  );

  let canvas: HTMLCanvasElement | undefined;

  createEffect(() => {
    const offscreen = canvas!.transferControlToOffscreen();
    decoder.postMessage({ type: "context", val: offscreen }, [offscreen]);
  });

  connect("ws://localhost:3307", decoder);

  const [pointerLocked, setPointerLocked] = createSignal(false);

  const onMouseMove = (event: MouseEvent) => {
    console.log("mouse move", event.movementX, event.movementY);
  };

  const onMouseDown = (event: MouseEvent) => {
    console.log("mouse down", event.button, event.button === 0);
  };

  const onMouseUp = (event: MouseEvent) => {
    console.log("mouse up", event.button, event.button === 0);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    console.log("key down", event.key);
  };

  const onKeyUp = (event: KeyboardEvent) => {
    console.log("key up", event.key);
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
    <div class="w-screen h-screen overflow-hidden">
      <canvas
        width={1080}
        height={720}
        class="absolute-centered"
        style={{
          border: "1px solid white",
          "max-width": "100vw",
          "max-height": "100vh",
        }}
        ref={canvas}
        onClick={() => {
          canvas?.requestPointerLock();
        }}
      />
    </div>
  );
}

render(() => <Stream />, document.getElementById("root") as HTMLElement);
