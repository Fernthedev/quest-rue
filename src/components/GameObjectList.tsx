import {
    For,
    Show,
    createDeferred,
    createEffect,
    createMemo,
    createSignal,
} from "solid-js";
import {
    GameObjectJSON,
    PacketWrapperCustomJSON,
    createEventEffect,
    getEvents,
} from "../misc/events";
import { gameObjectsStore } from "../misc/handlers/gameobject";

import styles from "./GameObjectList.module.css";
import { requestGameObjects } from "../misc/commands";
import { objectUrl } from "../App";
import { Navigator, useNavigate } from "@solidjs/router";

function GameObjectListItem(props: {
    navigate: Navigator;
    obj: GameObjectJSON;
    addressMap?: Map<number, [boolean, boolean]>;
}) {
    const address = createMemo(() => props.obj.transform!.address!);

    const highlighted = createMemo(
        () => props.addressMap?.get(address())?.[0] ?? false
    );

    const [collapsed, setCollapsed] = createSignal(false);
    createEffect(() => {
        if (props.addressMap)
            setCollapsed(!(props.addressMap.get(address())?.[1] ?? true));
        else setCollapsed(false);
    });

    const children = createMemo(() =>
        gameObjectsStore.childrenMap?.[address()].filter(
            (addr) => props.addressMap?.has(addr) ?? true
        )
    );
    const hasChildren = () => (children()?.length ?? 0) > 0;

    return (
        <li>
            <div
                class={`${styles.objectTitle} ${
                    highlighted() ? styles.highlighted : ""
                }`}
            >
                <Show when={hasChildren()}>
                    <span
                        class="mr-1 inline-block w-4 text-center"
                        onClick={() => setCollapsed(!collapsed())}
                    >
                        {collapsed() ? "+" : "-"}
                    </span>
                </Show>
                <span
                    onClick={() => props.navigate(objectUrl(props.obj.address))}
                >
                    {props.obj.name}
                </span>
            </div>
            <Show when={!collapsed() && hasChildren()}>
                <ConstructList
                    navigate={props.navigate}
                    children={children()!}
                    addressMap={props.addressMap}
                />
            </Show>
        </li>
    );
}

function inSearch(
    object: GameObjectJSON,
    addressMap: Map<
        Required<GameObjectJSON>["transform"]["address"],
        [selfMatches: boolean, childMatches: boolean]
    >,
    searchLower: string,
    matchChild = false
): boolean {
    if (addressMap.has(object.transform!.address!)) return true;

    let childMatches = false;
    let selfMatches = false;
    if (object.name?.toLocaleLowerCase().includes(searchLower))
        selfMatches = true;

    for (const addr of gameObjectsStore.childrenMap?.[
        object.transform!.address!
    ] ?? []) {
        const child = gameObjectsStore.objectsMap![addr][0];
        if (inSearch(child, addressMap, searchLower, selfMatches || matchChild))
            childMatches = true;
    }
    if (childMatches || selfMatches || matchChild)
        addressMap.set(object.transform!.address!, [selfMatches, childMatches]);
    return childMatches || selfMatches;
}

export default function GameObjectList() {
    const navigate = useNavigate();

    /// Handle search
    // #region search
    const [search, setSearch] = createSignal<string>("");

    // address -> [highlight, expand]
    const [searchAddresses, setSearchAddresses] =
        createSignal<Map<number, [boolean, boolean]>>();

    const rootObjects = createDeferred(() =>
        Object.entries(gameObjectsStore.objectsMap ?? {}).filter(
            ([, [o]]) => !o.transform?.parent
        )
    );

    // createDeferred is a createMemo that runs when the browser is idle
    // Solid is awesome
    const filteredRootObjects = createDeferred(
        () => {
            if (search() == "") {
                setSearchAddresses(undefined);
                return rootObjects();
            }
            if (!gameObjectsStore.objectsMap) return null;

            const searchLower = search().toLocaleLowerCase();
            const newAddresses = new Map<number, [boolean, boolean]>();
            const ret = rootObjects().filter(([, [obj]]) =>
                inSearch(obj, newAddresses, searchLower)
            );
            setSearchAddresses(newAddresses);
            return ret;
        },
        { timeoutMs: 1000 }
    );
    // #endregion

    // refresh store
    requestGameObjects();
    const [requesting, setRequesting] = createSignal<boolean>(
        import.meta.env.VITE_USE_QUEST_MOCK != "true"
    );

    const noEntries = () => (search() ? "No Results" : "Loading...");

    // update state
    createEventEffect<PacketWrapperCustomJSON>(
        getEvents().ALL_PACKETS,
        (packet) => {
            if (packet.packetType === "getAllGameObjectsResult") {
                navigate(objectUrl(undefined));
                setRequesting(false);
            }
        }
    );

    // refresh state
    function refresh() {
        if (import.meta.env.VITE_USE_QUEST_MOCK == "true") return;
        if (!requesting()) requestGameObjects();
        setRequesting(true);
        // setSearch(""); // TODO: Is this necessary?
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
                        fallback={
                            <img
                                src="/src/assets/refresh.svg"
                                elementtiming={"Refresh icon"}
                                fetchpriority={"auto"}
                            />
                        }
                    >
                        <img
                            src="/src/assets/loading.svg"
                            class="animate-spin"
                            elementtiming={"Spinning icon"}
                            fetchpriority={"auto"}
                        />
                    </Show>
                </button>
            </div>
            <div class="ml-2 overflow-auto grow">
                <ul class="min-w-full w-max h-max">
                    <Show when={!requesting()} fallback="Loading...">
                        <For
                            each={filteredRootObjects()}
                            fallback={noEntries()}
                        >
                            {([, [obj]]) => (
                                <GameObjectListItem
                                    navigate={navigate}
                                    obj={obj}
                                    addressMap={searchAddresses()}
                                />
                            )}
                        </For>
                    </Show>
                </ul>
            </div>
        </div>
    );
}

function ConstructList(props: {
    children: number[];
    addressMap?: Map<number, [boolean, boolean]>;
    navigate: Navigator;
}) {
    return (
        <ul class="pl-4">
            {/* For because the key is variable but the list items only insert/remove */}
            <For each={props.children}>
                {(itemAddress) => {
                    const gameObject = createMemo(
                        () => gameObjectsStore.objectsMap![itemAddress][0]!
                    );
                    return (
                        <GameObjectListItem
                            navigate={props.navigate}
                            obj={gameObject()}
                            addressMap={props.addressMap}
                        />
                    );
                }}
            </For>
        </ul>
    );
}
