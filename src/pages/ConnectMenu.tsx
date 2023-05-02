import { useNavigate, useRouteData } from "@solidjs/router";
import { createSignal } from "solid-js";

import styles from "./ConnectMenu.module.css";
import {
    createEventEffect,
    getEvents,
} from "../misc/events";
import { connect } from "../misc/commands";

export default function ConnectMenu() {
    const redirect = useRouteData<boolean>();

    if (redirect) {
        createEventEffect(getEvents().CONNECTED_EVENT, () => {
            useNavigate()("/scene/");
        });
    }

    const [ip, setIp] = createSignal<string>(
        import.meta.env.VITE_QUEST_IP ?? ""
    );
    const [port, setPort] = createSignal<string>(
        import.meta.env.VITE_QUEST_PORT ?? ""
    );

    return (
        <div class={`${styles.wrapper} absolute-centered`}>
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
            <button
                onClick={() => {
                    connect(ip(), Number(port()));
                }}
            >
                Connect
            </button>
        </div>
    );
}
