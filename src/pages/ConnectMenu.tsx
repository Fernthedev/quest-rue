import { useNavigate } from "@solidjs/router";

import styles from "./ConnectMenu.module.css";
import { createEventEffect, getEvents } from "../misc/events";
import { connect } from "../misc/commands";

import toast from "solid-toast";
import { createPersistentSignal } from "../misc/utils";

export default function ConnectMenu() {
  const navigate = useNavigate();

  // redirect on login
  createEventEffect(getEvents().CONNECTED_EVENT, () => {
    navigate("/scene/");
  });

  const [ip, setIp] = createPersistentSignal(
    "connect.address",
    () => "192.168.0.1"
  );
  const [port, setPort] = createPersistentSignal("connect.port", () => "3306");

  const submit = async (e: Event) => {
    // Stop refresh
    e.preventDefault();

    const promise = connect(ip(), Number.parseInt(port()));
    toast.promise(promise, {
      loading: `Connecting to ${ip()}:${port()}`,
      success: "Connected successfully!",
      error: "Failed to connect",
    });
  };

  return (
    <form
      onSubmit={(e) => submit(e)}
      class={`${styles.wrapper} absolute-centered`}
    >
      <text class="text-center">Enter your Quest IP Address</text>
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
  );
}
