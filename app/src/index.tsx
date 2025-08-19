import { render } from "solid-js/web";

import "@thisbeyond/solid-select/style.css";
// higher priority
import "./styles.css";
import App from "./App";
import { initializeEvents } from "./misc/events";
import { devSetup } from "./misc/dev";
import "solid-devtools";
import { initSocket } from "./misc/commands";
import { cleanup_forward } from "./misc/adb";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { SettingsProvider } from "./components/Settings";
const appWindow = getCurrentWebviewWindow()

initSocket();
initializeEvents();

devSetup();

appWindow.onCloseRequested(async () => {
  await cleanup_forward();
});

render(
  () => (
    <SettingsProvider>
      <App />
    </SettingsProvider>
  ),
  document.getElementById("root") as HTMLElement,
);
