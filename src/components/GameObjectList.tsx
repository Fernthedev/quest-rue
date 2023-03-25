import { For, Show, createMemo } from "solid-js";
import { GameObjectJSON } from "../misc/events";
import { gameObjectsStore } from "../misc/handlers/gameobject";

import "./GameObjectList.module.css";

function GameObjectListItem(props: { obj: GameObjectJSON }) {
    return <>{props.obj.name}</>;
}

export default function GameObjectList() {
    const rootObjects = createMemo(
        () =>
            gameObjectsStore.objectsMap &&
            Object.entries(gameObjectsStore.objectsMap)?.filter(
                ([, [o]]) => !o.transform?.parent
            )
    );

    return (
        <ul>
            <For each={rootObjects()} fallback={<p>"Loading..."</p>}>
                {([, [obj]]) => (
                    <li>
                        <GameObjectListItem obj={obj} />
                        <ConstructList obj={obj} />
                    </li>
                )}
            </For>
            {/* <li>
                <GameObjectListItem text="Hi this is mark and today we're going to cook some doritoes" />
            </li>
            <li>
                <GameObjectListItem text="Hi2" />
            </li>
            <li>
                <GameObjectListItem text="Hi3" />
            </li> */}
        </ul>
    );
}

function ConstructList(props: { obj: GameObjectJSON }) {
    const children = createMemo(
        () => gameObjectsStore.childrenMap?.[props.obj.transform!.address!]
    );

    return (
        <Show when={(children()?.length ?? 0) > 0} keyed>
            <ul class="pl-6">
                {/* For because the key is variable but the list items only insert/remove */}
                <For each={children()} fallback={"Loading..."}>
                    {(itemAddress) => {
                        const gameObject = createMemo(
                            () => gameObjectsStore.objectsMap![itemAddress][0]!
                        );

                        return (
                            <li>
                                <GameObjectListItem obj={gameObject()} />
                                <ConstructList obj={gameObject()} />
                            </li>
                        );
                    }}
                </For>
            </ul>
        </Show>
    );
}
