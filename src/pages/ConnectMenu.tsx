import { useNavigate, useRouteData } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";

import styles from "./ConnectMenu.module.css";
import { createEventEffect, getEvents } from "../misc/events";
import { connect } from "../misc/commands";

import toast from "solid-toast";

export default function ConnectMenu() {
    const redirect = useRouteData<boolean>();
    const navigate = useNavigate();

    // Utility for dismissing existing toasts
    // There might be a smarter way to do this
    const [connectingToast, setConnectingToast] = createSignal<string | undefined>()

    if (redirect) {
        createEventEffect(getEvents().CONNECTED_EVENT, () => {
            navigate("/scene/");
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
                onClick={async () => {
                    const promise = connect(ip(), Number.parseInt(port()));
                    const id = toast.loading(`Connecting to ${ip()}:${port()}`);
                    // Dismiss existing toast
                    setConnectingToast((prev) => {
                        if (!prev) return
                        toast.dismiss(prev)

                        return id
                    })

                    // Ignore error, toast is created in App.tsx
                    try {
                        const val = await promise;
                        console.log("Finished waiting")
                        toast.success("Finished connecting " + val)
                    } catch (e) { /* ignore */ }

                    // Dismiss toast
                    toast.dismiss(id);
                }}
            >
                Connect
            </button>
        </div>
    );
}