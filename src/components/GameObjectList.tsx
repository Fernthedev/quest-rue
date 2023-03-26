import { For, Show, createDeferred, createMemo, createSignal } from "solid-js";
import { GameObjectJSON } from "../misc/events";
import { gameObjectsStore } from "../misc/handlers/gameobject";

import "./GameObjectList.module.css";

function GameObjectListItem(props: { obj: GameObjectJSON }) {
    return <>{props.obj.name}</>;
}

export default function GameObjectList() {
    const [search, setSearch] = createSignal<string>("");

    // createDeferred is a createMemo that runs when the browser is idle
    // Solid is awesome
    const filteredObjects = createDeferred(
        () => {
            if (!gameObjectsStore.objectsMap) return null;
            if (search() == "")
                return Object.entries(gameObjectsStore.objectsMap);

            return Object.entries(gameObjectsStore.objectsMap).filter(
                ([, [o]]) =>
                    o.name?.toLocaleLowerCase().includes(search().toLowerCase())
            );
        },
        {
            timeoutMs: 1000,
        }
    );

    const rootObjects = createMemo(() =>
        filteredObjects()?.filter(([, [o]]) => !o.transform?.parent)
    );

    return (
        <div>
            {/* TODO: Make this sticky horizontal scroll */}
            <div class="mx-8 my-1 sticky">
                <input
                    placeholder="Search"
                    value={search()}
                    onInput={(e) => {
                        const value = e.currentTarget.value;

                        setSearch(value);
                    }}
                    class="w-full"
                />
            </div>
            <div class="w-max overflow-x-auto">
                <ul>
                    <For each={rootObjects()} fallback={<p>"Loading..."</p>}>
                        {([, [obj]]) => (
                            <li>
                                <GameObjectListItem obj={obj} />
                                <ConstructList obj={obj} />
                            </li>
                        )}
                    </For>
                </ul>
            </div>
        </div>
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
