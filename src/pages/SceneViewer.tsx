import { Show, onMount } from "solid-js";
import GameObjectList from "../components/GameObjectList";
import ObjectView from "../components/ObjectView/ObjectView";

import styles from "./SceneViewer.module.css";
import { isConnected } from "../misc/commands";
import { useNavigate, useParams } from "@solidjs/router";
import { getEvents } from "../misc/events";

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
    return (
        <div class="flex w-full h-full">
            <div class="flex-1 overflow-auto">
                <ObjectView
                    selectedAddress={
                        routeParams.address ? BigInt(routeParams.address) : undefined
                    }
                />
            </div>

            <div class={`${styles.gameObjectList}`}>
                <GameObjectList />
            </div>
        </div>
    );
}
