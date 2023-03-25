/* @refresh reload */
import { render } from "solid-js/web";

import "./styles.css";
import App from "./App";
import { initializeEvents } from "./misc/events";
import { setupDev } from "./misc/dev";

initializeEvents();
setupDev();

render(() => <App />, document.getElementById("root") as HTMLElement);
