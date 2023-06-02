/* @refresh reload */
import { render } from "solid-js/web";

import "./styles.css";
import App from "./App";
import { initializeEvents } from "./misc/events";
import { devSetup } from "./misc/dev";

initializeEvents();

if (import.meta.env.VITE_USE_QUEST_MOCK == "true") {
    devSetup();
}

render(() => <App />, document.getElementById("root") as HTMLElement);
