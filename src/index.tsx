/* @refresh reload */
import { render } from "solid-js/web";

import "./styles.css";
import App from "./App";
import { initializeEvents } from "./misc/events";
import { devSetup } from "./misc/dev";
import "solid-devtools";

initializeEvents();

devSetup();


render(() => <App />, document.getElementById("root") as HTMLElement);
