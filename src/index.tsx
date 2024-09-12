/* @refresh reload */
import { render } from "solid-js/web";

import "@thisbeyond/solid-select/style.css";
// higher priority
import "./styles.css";
import App from "./App";
import { initializeEvents } from "./misc/events";
import { devSetup } from "./misc/dev";
import "solid-devtools";
import { initSocket } from "./misc/commands";
import { window } from "@tauri-apps/api"
import { cleanup_forward } from "./misc/adb";
import { TauriEvent } from "@tauri-apps/api/event";

initSocket();
initializeEvents();

devSetup();

window.getCurrent().listen(TauriEvent.WINDOW_CLOSE_REQUESTED, cleanup_forward);

render(() => <App />, document.getElementById("root") as HTMLElement);
