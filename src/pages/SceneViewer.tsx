import GameObjectList from "../components/GameObjectList";

import styles from "./SceneViewer.module.css"

export default function SceneViewer() {
    
    
    return (
        <div class="flex w-full min-w-full">
            <div class="flex-1" />

            <div class={`${styles.gameObjectList}`}>
                <GameObjectList />
            </div>
        </div>
    );
}