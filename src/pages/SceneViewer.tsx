import { Show, createMemo, onMount } from "solid-js";
import GameObjectList from "../components/GameObjectList";
import ObjectView from "../components/ObjectView/ObjectView";

import styles from "./SceneViewer.module.css";
import { isConnected } from "../misc/commands";
import { useNavigate, useParams } from "@solidjs/router";
import { getEvents } from "../misc/events";
import { Resizable } from "../components/Resizable";

export default function SceneViewer() {
    const navigate = useNavigate();

    // TODO: Reconnect if possible
    onMount(() => {
        if (isConnected()) return;

        navigate("/");
    });
    getEvents().DISCONNECTED_EVENT.addListener(() => navigate("/"));
    ///

    const routeParams = useParams<{ address?: string }>();
    const address = createMemo(() =>
        routeParams.address ? BigInt(routeParams.address) : undefined
    );
    return (
        <div class="flex w-full h-full">
            <div class="flex-1 overflow-auto">
                <ObjectView selectedAddress={address()} />
            </div>

            <Resizable direction="left" size={350} minSize={250} maxSize={750}>
                <div class={`${styles.gameObjectList}`}>
                    <GameObjectList />
                </div>
            </Resizable>
        </div>
    );
}
