import { JSX, createMemo, createSignal, onMount } from "solid-js";
import GameObjectList from "../components/SceneViewer/GameObjectList";
import ObjectView from "../components/SceneViewer/ObjectView/ObjectView";

import styles from "./SceneViewer.module.css";
import { requestGameObjects } from "../misc/handlers/gameobject";
import { useNavigate, useParams } from "@solidjs/router";
import { getEvents } from "../misc/events";
import { Resizable } from "../components/utils/Resizable";
import { StaticsView } from "../components/SceneViewer/StaticsView";
import { SettingsMenu } from "../components/Settings";
import { createStore } from "solid-js/store";
import { ProtoClassDetails, ProtoDataPayload } from "../misc/proto/il2cpp";
import { VariablesList } from "../components/SceneViewer/VariablesList";
import { requestVariables } from "../misc/handlers/variable_list";
import { Tabs } from "../components/Tabs";
import { Logger } from "../components/SceneViewer/Logger";
import { socket } from "../misc/commands";

export default function SceneViewer() {
  const navigate = useNavigate();

  const [statics, setStatics] = createStore<{
    [key: string]: ProtoClassDetails;
  }>({});

  // TODO: Reconnect if possible
  onMount(() => {
    if (!socket.connected()) navigate("/");
  });
  getEvents().DISCONNECTED_EVENT.addListener(() => navigate("/"));

  // refresh store
  requestGameObjects();
  requestVariables();

  const routeParams = useParams<{ selectedData?: string }>();
  const selected = createMemo(() =>
    routeParams.selectedData
      ? ProtoDataPayload.fromJSON(
          JSON.parse(decodeURIComponent(routeParams.selectedData)),
        )
      : undefined,
  );

  const [leftPanel, setLeftPanel] = createSignal<JSX.Element | undefined>(
    undefined,
  );

  return (
    <div class="flex w-full h-full">
      <Resizable direction="right" size={275} minSize={150} maxSize={600}>
        <div class={`${styles.leftPanel}`}>
          <div class={`${styles.leftPanelScreen}`}>{leftPanel() ?? <></>}</div>
          <div class={`${styles.leftPanelTabs}`}>
            <Tabs
              onTabSelect={[leftPanel, setLeftPanel]}
              tabClass="bordered"
              size="md"
            >
              {[
                ["Variables", <VariablesList />],
                ["Logger", <Logger />],
              ]}
            </Tabs>
          </div>
        </div>
      </Resizable>

      <div class="flex flex-col flex-1">
        <div class="relative flex-1 overflow-auto">
          <ObjectView selected={selected()} setStatics={setStatics} />
        </div>
        <Resizable direction="up" size={300}>
          <div class="relative overflow-auto w-full h-full">
            <StaticsView statics={statics} setStatics={setStatics} />
          </div>
        </Resizable>
        <SettingsMenu />
      </div>

      <Resizable direction="left" size={350} minSize={250} maxSize={750}>
        <div class={`${styles.gameObjectList}`}>
          <GameObjectList />
        </div>
      </Resizable>
    </div>
  );
}
