import { useNavigate } from "@solidjs/router";

import styles from "./ConnectMenu.module.css";
import { createEventEffect, getEvents } from "../misc/events";

import { createAsyncMemo, createPersistentSignal } from "../misc/utils";
import { socket } from "../misc/commands";
import { adb_devices, adb_forward, has_adb } from "../misc/adb";
import {
  createEffect,
  createRenderEffect,
  createSignal,
  For,
  Show,
} from "solid-js";
import { star } from "solid-heroicons/outline";
import { star as starFilled } from "solid-heroicons/solid";
import { ActionButton } from "../components/SceneViewer/InputCell";

export default function ConnectMenu() {
  const navigate = useNavigate();

  // redirect on login
  createEventEffect(getEvents().CONNECTED_EVENT, () => {
    navigate("/scene/");
  });

  const [ip, setIp] = createPersistentSignal(
    "connect.address",
    () => "192.168.0.1",
  );
  const [port, setPort] = createPersistentSignal("connect.port", () => "3306");

  const [defaultAdbDevice, setDefaultAdbDevice] = createPersistentSignal(
    "adb.default",
    () => "",
  );

  const [adb, setAdb] = createSignal<string>();

  const [devices, devicesLoading, updateDevices] = createAsyncMemo(async () => {
    if (!adb()) return undefined;
    return await adb_devices();
  });

  // run immediately
  createRenderEffect(() => has_adb().then(setAdb));

  // remember if adb should reconnect on forced disconnect
  const [adbConnection, setAdbConnection] = createSignal(false);

  const connect = (ip: string, port: string, display = "") => {
    if (socket.connecting()) return;
    if (display.length === 0) display = `${ip}:${port}`;
    socket.connect(ip, Number.parseInt(port), display);
  };

  const submit = (e: Event) => {
    // Stop refresh
    e.preventDefault();
    setAdbConnection(false);
    connect(ip(), port());
  };

  const selectDevice = (id: string, name: string) => {
    setAdbConnection(true);
    adb_forward(id, port()).then(() => connect("localhost", port(), name));
  };

  const cancel = () => {
    socket.disconnect();
  };

  createEffect(() => {
    if (socket.manualDisconnect || !adbConnection()) return;
    const defInfo = devices()?.find(([id]) => defaultAdbDevice() === id);
    if (defInfo) selectDevice(...defInfo);
  });

  return (
    <div class={`${styles.wrapper} absolute-centered`}>
      <Show
        when={!socket.connecting()}
        // when={false}
        fallback={<button onClick={cancel}>Cancel connection</button>}
      >
        <form onSubmit={submit} class={`${styles.form}`}>
          <text class="text-center">Enter your Device IP Address</text>
          <input
            placeholder="IP"
            value={ip()}
            onInput={(e) => {
              setIp(e.currentTarget.value);
            }}
          />
          <input
            type="number"
            min={0}
            max={65535}
            placeholder="Port"
            value={port()}
            onInput={(e) => {
              setPort(e.currentTarget.value);
            }}
          />
          <button type="submit">Connect</button>
        </form>
        <Show when={adb()}>
          <div class={`${styles.form}`}>
            <text class="text-center">Select ADB Device</text>
            <div class={`${styles.devlist}`}>
              <For each={devices()}>
                {([id, name]) => (
                  <span class="flex">
                    <button
                      title={id}
                      class="grow rounded-tr-none rounded-br-none"
                      onClick={() => {
                        selectDevice(id, name);
                      }}
                    >
                      {name}
                    </button>
                    <ActionButton
                      img={defaultAdbDevice() === id ? starFilled : star}
                      onClick={() => {
                        // always connect when favoriting something, even after cancel/disconnect
                        if (socket.manualDisconnect)
                          socket.manualDisconnect = false;
                        setDefaultAdbDevice((old) => (id === old ? "" : id));
                      }}
                      class="pl-2 pr-2 rounded-tl-none rounded-bl-none"
                      tooltip="Set as favorite"
                    />
                  </span>
                )}
              </For>
              <span class="grow -mb-3" />
              <ActionButton
                img="refresh"
                class="small-button self-start"
                loading={devicesLoading()}
                onClick={updateDevices}
              />
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
