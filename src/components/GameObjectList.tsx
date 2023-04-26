import { For, Show, createDeferred, createMemo, createSignal } from "solid-js";
import { GameObjectJSON } from "../misc/events";
import { gameObjectsStore } from "../misc/handlers/gameobject";

import "./GameObjectList.module.css";

function GameObjectListItem(props: { obj: GameObjectJSON }) {
    const [collapsed, setCollapsed] = createSignal<boolean>(false);

    const children = createMemo(
        () => gameObjectsStore.childrenMap?.[props.obj.transform!.address!]
    );
    const hasChildren = () => (children()?.length ?? 0) > 0;

    return (
        <li>
            <div class="cursor-pointer">
                <Show when={hasChildren()}>
                    <span class="mr-1 inline-block w-4 text-center" onClick={() => setCollapsed(!collapsed())}>
                        {collapsed() ? "+" : "-"}
                    </span>
                </Show>
                <span onClick={() => {/* select object */}}>
                    {props.obj.name}
                </span>
            </div>
            <Show when={!collapsed() && hasChildren()}>
                <ConstructList children={children()!} />
            </Show>
        </li>
    );
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

    const noEntries = () => {
        if (search() == "")
            return "Loading ..."
        return "No Results"
    }

    return (
        <div class="flex flex-col items-stretch h-full">
            <div class="mx-4 my-2">
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
            <div class="ml-2 overflow-auto">
                <ul class="min-w-full w-max h-max">
                    <For each={rootObjects()} fallback={<p>{noEntries()}</p>}>
                        {([, [obj]]) => <GameObjectListItem obj={obj} />}
                    </For>
                </ul>
            </div>
        </div>
    );
}

function ConstructList(props: { children: number[] }) {

    return (
        <ul class="pl-4">
            {/* For because the key is variable but the list items only insert/remove */}
            <For each={props.children}>
                {(itemAddress) => {
                    const gameObject = createMemo(
                        () => gameObjectsStore.objectsMap![itemAddress][0]!
                    );

                    return <GameObjectListItem obj={gameObject()} />;
                }}
            </For>
        </ul>
    );
}
