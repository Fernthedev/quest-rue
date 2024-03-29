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

initSocket();
initializeEvents();

devSetup();

render(() => <App />, document.getElementById("root") as HTMLElement);
