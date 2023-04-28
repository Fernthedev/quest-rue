import GameObjectList from "../components/GameObjectList";
import ObjectView from "../components/ObjectView";

import styles from "./SceneViewer.module.css"

export default function SceneViewer() {
    return (
        <div class="flex w-full h-full">
            <div class="flex-1 overflow-auto">
                <ObjectView />
            </div>

            <div class={`${styles.gameObjectList}`}>
                <GameObjectList />
            </div>
        </div>
    );
}
