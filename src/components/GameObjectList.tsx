import { For, Show, createDeferred, createMemo, createSignal } from "solid-js";
import {
    GameObjectJSON,
    PacketWrapperCustomJSON,
    createEventEffect,
    getEvents,
} from "../misc/events";
import { gameObjectsStore } from "../misc/handlers/gameobject";

import "./GameObjectList.module.css";
import { requestGameObjects } from "../misc/commands";
import { selectGameObject, setSelectedObject } from "../misc/state";

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
                    <span
                        class="mr-1 inline-block w-4 text-center"
                        onClick={() => setCollapsed(!collapsed())}
                    >
                        {collapsed() ? "+" : "-"}
                    </span>
                </Show>
                <span onClick={() => selectGameObject(props.obj)}>
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
        { timeoutMs: 1000 }
    );

    // refresh store
    requestGameObjects();
    const [requesting, setRequesting] = createSignal<boolean>(
        import.meta.env.VITE_USE_QUEST_MOCK != "true"
    );

    const rootObjects = createMemo(() =>
        filteredObjects()?.filter(([, [o]]) => !o.transform?.parent)
    );

    const noEntries = () => {
        if (search() == "") return "Loading ...";
        return "No Results";
    };

    // update state
    createEventEffect<PacketWrapperCustomJSON>(
        getEvents().ALL_PACKETS,
        (packet) => {
            if (packet.packetType === "getAllGameObjectsResult") {
                setSelectedObject(undefined);
                setRequesting(false);
            }
        }
    );

    // refresh state
    function refresh() {
        if (import.meta.env.VITE_USE_QUEST_MOCK == "true") return;
        if (!requesting()) requestGameObjects();
        setRequesting(true);
        setSearch("");
    }

    return (
        <div class="flex flex-col items-stretch h-full">
            <div class="px-2 py-2 flex gap-2 justify-center">
                <input
                    placeholder="Search"
                    value={search()}
                    onInput={(e) => {
                        setSearch(e.currentTarget.value);
                    }}
                    class="flex-1 w-0"
                />
                <button class="flex-0 p-2" onClick={refresh}>
                    <Show
                        when={requesting()}
                        fallback={<img src="/src/assets/refresh.svg" />}
                    >
                        <img
                            src="/src/assets/loading.svg"
                            class="animate-spin"
                        />
                    </Show>
                </button>
            </div>
            <div class="ml-2 overflow-auto">
                <ul class="min-w-full w-max h-max">
                    <Show when={!requesting()} fallback="Loading...">
                        <For each={rootObjects()} fallback={noEntries()}>
                            {([, [obj]]) => <GameObjectListItem obj={obj} />}
                        </For>
                    </Show>
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
