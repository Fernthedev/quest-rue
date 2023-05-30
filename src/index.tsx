/* @refresh reload */
import { render } from "solid-js/web";

import "./styles.css";
import App from "./App";
import { initializeEvents } from "./misc/events";

initializeEvents();

render(() => <App />, document.getElementById("root") as HTMLElement);
