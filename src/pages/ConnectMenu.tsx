import { useNavigate, useRouteData } from "@solidjs/router"
import { createEffect, createSignal } from "solid-js";

import styles from "./ConnectMenu.module.css"
import { getEvents } from "../misc/events";
import { connect } from "../misc/commands";

export default function ConnectMenu() {
    const redirect = useRouteData<boolean>();

    const [connected, setConnected] = createSignal<boolean>(false);
    if (redirect)
        createEffect(() => { if (connected()) useNavigate()("/scene/") });

    const [ip, setIp] = createSignal<string>(import.meta.env.VITE_QUEST_IP ?? "");
    const [port, setPort] = createSignal<string>(import.meta.env.VITE_QUEST_PORT ?? "");

    getEvents().CONNECTED_EVENT.addListener(() => setConnected(true));

    return (
        <div class={`${styles.wrapper} absolute-centered`}>
            <text class="text-center">Enter your Quest IP Address</text>
            <input
                placeholder="IP"
                value={ip()}
                onInput={(e) => {setIp(e.currentTarget.value)}}
            />
            <input
                type="number"
                min={0} max={65535}
                placeholder="Port"
                value={port()}
                onInput={(e) => {setPort(e.currentTarget.value)}}
            />
            <button onClick={() => {connect(ip(), Number(port()))}}>Connect</button>
        </div>
    );
}
