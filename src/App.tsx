import { Route, Router, Navigator } from "@solidjs/router";
import { lazy } from "solid-js";

import toast, { Toaster } from "solid-toast";

const SceneViewer = lazy(() => import("./pages/SceneViewer"));
import ConnectMenu from "./pages/ConnectMenu";
import { createEventEffect, getEvents } from "./misc/events";
import { SettingsProvider } from "./components/Settings";
import { ProtoDataPayload } from "./misc/proto/il2cpp";
import { sendPacketResult } from "./misc/commands";
import { GetInstanceClassResult } from "./misc/proto/qrue";

export function selectData(navigate: Navigator, data: ProtoDataPayload) {
  const selected = encodeURIComponent(
    JSON.stringify(ProtoDataPayload.toJSON(data))
  );
  navigate(`/scene/${selected}`);
}

export function selectClass(navigate: Navigator, address?: bigint) {
  if (address == undefined || address == 0n) navigate("/scene/");
  else
    sendPacketResult<GetInstanceClassResult>({
      $case: "getInstanceClass",
      getInstanceClass: {
        address: address,
      },
    })[0].then((result) => {
      const data = ProtoDataPayload.create({
        typeInfo: {
          Info: {
            $case: "classInfo",
            classInfo: result.classInfo,
          },
        },
        data: {
          Data: {
            $case: "classData",
            classData: address,
          },
        },
      });
      selectData(navigate, data);
    });
}

export default function App() {
  createEventEffect(getEvents().DISCONNECTED_EVENT, () => {
    toast.error("Disconnected from Quest");
  });
  createEventEffect(getEvents().ERROR_EVENT, (e) => {
    toast.error(`Suffered error: ${e}`);
  });

  return (
    <div class="w-screen h-screen overflow-hidden">
      <SettingsProvider>
        <Router>
            <Route path="/scene/:selectedData?" component={SceneViewer} />
            <Route path={"/"} component={ConnectMenu} />{" "}
            {/* redirect */}
        </Router>
        <div>
          <Toaster />
        </div>
      </SettingsProvider>
    </div>
  );
}
