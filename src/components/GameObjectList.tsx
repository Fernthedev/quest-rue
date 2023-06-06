import {
    Accessor,
    For,
    JSX,
    Show,
    createDeferred,
    createEffect,
    createMemo,
    createSignal,
    on,
} from "solid-js";
import {
    GameObjectJSON,
    PacketWrapperCustomJSON,
    createEventEffect,
    getEvents,
    useRequestAndResponsePacket,
} from "../misc/events";
import { GameObjectIndex, gameObjectsStore } from "../misc/handlers/gameobject";

import styles from "./GameObjectList.module.css";
import { requestGameObjects } from "../misc/commands";
import { objectUrl } from "../App";
import { Navigator, useNavigate } from "@solidjs/router";
import { VirtualList } from "./VirtualList";

import { minus, plus } from "solid-heroicons/solid";
import { Icon } from "solid-heroicons";
import { CreateGameObjectResult } from "../misc/proto/qrue";

type TreeData = [indent: number, hasChildren: boolean];
type AddressData = [highlight: boolean, expanded: boolean];

export default function GameObjectList() {
    const navigate = useNavigate();

    /// Handle search
    // #region search
    const [search, setSearch] = createSignal<string>("");

    // address -> [highlight, expand]
    const [searchAddresses, setSearchAddresses] = createSignal<
        Map<GameObjectIndex, AddressData> | undefined
    >(undefined, { equals: false });

    const rootObjects = createDeferred(() =>
        Array.from(gameObjectsStore.objectsMap?.entries() ?? []).filter(
            ([, [o]]) => !o.transform?.parent
        )
    );

    // createDeferred is a createMemo that runs when the browser is idle
    // Solid is awesome
    const filteredRootObjects = createDeferred(
        () => {
            if (!gameObjectsStore.objectsMap) return null;

            const searchLower = search().toLocaleLowerCase();
            const newAddresses = new Map<bigint, [boolean, boolean]>();
            const ret = rootObjects().filter(([, [obj]]) =>
                inSearch(obj, newAddresses, searchLower)
            );
            setSearchAddresses(newAddresses);
            return ret;
        },
        { timeoutMs: 1000 }
    );

    const filteredScenes = createDeferred(
        () =>
            new Set<string>(
                filteredRootObjects()
                    ?.map(([, [obj]]) => obj.scene?.name)
                    .filter((x) => x !== undefined && x !== "")
                    .map((x) => x!) // make TS happy
            )
    );
    // #endregion

    // address -> [indentation, hasChildren]
    const sceneObjects = createMemo(() => {
        const addresses = searchAddresses();
        const sceneTreeData = new Map<string, Map<GameObjectIndex, TreeData>>();
        filteredRootObjects()?.forEach(([, [obj]]) => {
            const sceneName = obj.scene?.name ?? "";
            let treeData = sceneTreeData.get(sceneName);
            if (treeData === undefined) {
                treeData = new Map();
                sceneTreeData.set(sceneName, treeData);
            }

            return addChildren(obj.transform!.address, treeData, addresses);
        }) ?? [];
        return sceneTreeData;
    });

    const objects = createMemo(
        () =>
            new Map<GameObjectIndex, TreeData>(
                [...sceneObjects().entries()].flatMap<
                    [GameObjectIndex, TreeData]
                >(([, o]) => [...o.entries()])
            )
    );

    // refresh store
    requestGameObjects();
    const [requesting, setRequesting] = createSignal<boolean>();

    const noEntries = () => (search() == "" ? "No Results" : "Loading...");

    // update state
    createEventEffect<PacketWrapperCustomJSON>(
        getEvents().ALL_PACKETS,
        (packet) => {
            if (packet.Packet?.$case === "getAllGameObjectsResult") {
                navigate(objectUrl(undefined));
                setRequesting(false);
            }
        }
    );

    // refresh state
    function refresh() {
        if (!requesting()) requestGameObjects();
        setRequesting(true);
    }

    const refreshButton = (
        <button class="flex-0 p-2" onClick={refresh}>
            <Show
                when={requesting()}
                fallback={
                    <img
                        src="/src/assets/refresh.svg"
                        elementtiming={"Refresh icon"}
                        fetchpriority={"auto"}
                        alt="Refresh"
                    />
                }
            >
                <img
                    src="/src/assets/loading.svg"
                    class="animate-spin"
                    elementtiming={"Spinning icon"}
                    fetchpriority={"auto"}
                    alt="Loading"
                />
            </Show>
        </button>
    );

    return (
        <div class="flex flex-col items-stretch h-full">
            <div class="flex gap-2 p-2 justify-center">
                <input
                    placeholder="Search"
                    value={search()}
                    onInput={(e) => {
                        setSearch(e.currentTarget.value);
                    }}
                    class="flex-1 w-0"
                />
                {refreshButton}
                <AddGameObject />
            </div>
            <Show when={!requesting()} fallback="Loading...">
                <Show
                    when={(filteredRootObjects()?.length ?? 0) > 0}
                    fallback={noEntries()}
                >
                    <GameObjectScenes
                        generator={(item) =>
                            GameObjectListItem({
                                item: item,
                                navigate: navigate,
                                addressMap: searchAddresses,
                                updateAddressMap: setSearchAddresses,
                                addressTreeData: objects,
                            })
                        }
                        objects={sceneObjects}
                        filteredScenes={filteredScenes}
                    />
                </Show>
            </Show>
        </div>
    );
}

function GameObjectScenes(props: {
    generator: (item: bigint) => JSX.Element;
    filteredScenes: Accessor<Set<string>>;
    objects: Accessor<Map<string, Map<GameObjectIndex, TreeData>>>;
}) {
    return (
        <div
            style={{ "padding-left": "0.25rem" }}
            class="flex flex-col divide-y-0 gap-2 h-full"
        >
            <For each={[...props.filteredScenes().values()]}>
                {(scene) => {
                    const [expanded, setExpanded] = createSignal(true);
                    const toggle = () => setExpanded((b) => !b);
                    const sceneObjects = () => props.objects().get(scene)!;

                    return (
                        <div>
                            <div
                                role="checkbox"
                                tabIndex={"0"}
                                aria-checked={!expanded()}
                                onKeyPress={toggle}
                                onClick={toggle}
                                class={`bg-slate-500 flex ${styles.rounded} ${styles.header}`}
                            >
                                <Icon
                                    path={expanded() ? minus : plus}
                                    class="antialiased flex-0 w-4 h-4"
                                />
                                <h2 class="flex-1">{scene}</h2>
                            </div>

                            <Show when={expanded()}>
                                <div>
                                    <VirtualList
                                        class={`${styles.list} w-full`}
                                        items={[...sceneObjects().keys()]}
                                        itemHeight={29}
                                        generator={props.generator}
                                    />
                                </div>
                            </Show>
                        </div>
                    );
                }}
            </For>
        </div>
    );
}

function GameObjectListItem(props: {
    item: GameObjectIndex;
    navigate: Navigator;
    addressMap: Accessor<Map<GameObjectIndex, AddressData> | undefined>;
    updateAddressMap?: (map?: Map<GameObjectIndex, AddressData>) => void;
    addressTreeData: Accessor<Map<GameObjectIndex, TreeData> | undefined>;
}) {
    const object = createMemo(
        () => gameObjectsStore.objectsMap?.get(props.item)?.[0]
    );

    const highlighted = createMemo(
        () => props.addressMap()?.get(props.item)?.[0] ?? false
    );
    const expanded = createMemo(() => {
        const map = props.addressMap();
        return map?.get(props.item)?.[1] ?? true;
    });

    const toggle = () =>
        props.updateAddressMap?.(
            props.addressMap()?.set(props.item, [highlighted(), !expanded()])
        );
    const select = () => props.navigate(objectUrl(object()?.address));

    // [indent, hasChildren]
    const treeData = createMemo<TreeData>(
        () => props.addressTreeData()?.get(props.item) ?? [0, false]
    );

    const indent = createMemo(() => treeData()[0]);
    const hasChildren = createMemo(() => treeData()[1]);

    return (
        <div
            class={`${styles.listItem} ${
                highlighted() ? styles.highlighted : ""
            }`}
            style={{ "padding-left": `${indent() + 1}rem` }}
        >
            <Show when={hasChildren()}>
                <span
                    class="mr-1 flex-0 w-4 text-center"
                    role="checkbox"
                    tabIndex={"0"}
                    aria-checked={!expanded()}
                    onKeyPress={toggle}
                    onClick={toggle}
                >
                    {expanded() ? "-" : "+"}
                </span>
            </Show>
            <span
                class="flex-1"
                role="link"
                tabIndex="0"
                onKeyPress={select}
                onClick={select}
            >
                {object()?.name}
            </span>
        </div>
    );
}

function AddGameObject() {
    const [name, setName] = createSignal("");
    const [parent, setParent] = createSignal<bigint>();

    const [created, , requestCreate] =
        useRequestAndResponsePacket<CreateGameObjectResult>();

    const create = () =>
        requestCreate({
            $case: "createGameObject",
            createGameObject: {
                name: name(),
                parent: parent(),
            },
        });

    createEffect(on(created, () => requestGameObjects(), { defer: true }));

    // there's some weird bug here that errors if the button is the parent instead of a div
    // but also only if there's a button somewhere inside
    // almost definitely related: https://github.com/solidjs/solid-start/issues/820
    return (
        <div class="dropdown dropdown-bottom dropdown-end flex-0">
            <button class="p-2">
                <Icon path={plus} class="w-6 h-6" />
            </button>

            <div
                class="
                dropdown-content shadow menu text-base
                bg-neutral-200 dark:bg-zinc-900
                justify-center gap-2 w-80 p-3
                my-2 z-10 rounded-box cursor-auto"
            >
                <h4 class="text-center">Create new game object</h4>
                <input
                    placeholder="Name"
                    value={name()}
                    onInput={(e) => {
                        setName(e.currentTarget.value);
                    }}
                />
                <input
                    type="number"
                    placeholder="Parent"
                    value={parent()?.toString() ?? ""}
                    onInput={(e) => {
                        const val = e.currentTarget.value;
                        if (val.length == 0) setParent(undefined);
                        else setParent(BigInt(val));
                    }}
                />
                <button onClick={create} onKeyPress={create}>
                    Create
                </button>
            </div>
        </div>
    );
}

function matchesSearch(obj: GameObjectJSON, search: string) {
    return (
        obj.name.toLocaleUpperCase().includes(search) ||
        obj.scene?.name.includes(search)
    );
}

function inSearch(
    object: GameObjectJSON,
    addressMap: Map<
        GameObjectIndex,
        [selfMatches: boolean, childMatches: boolean]
    >,
    searchLower: string,
    matchChild = false
): boolean {
    // nothing searched
    if (searchLower === "") return true;

    if (addressMap.has(object.transform!.address!)) return true;

    let childMatches = false;
    let selfMatches = false;
    if (matchesSearch(object, searchLower)) {
        selfMatches = true;
    }

    for (const addr of gameObjectsStore.childrenMap?.get(
        object.transform!.address!
    ) ?? []) {
        const [child] = gameObjectsStore.objectsMap!.get(addr)!;
        if (inSearch(child, addressMap, searchLower, selfMatches || matchChild))
            childMatches = true;
    }
    if (childMatches || selfMatches || matchChild)
        addressMap.set(object.transform!.address!, [
            selfMatches && searchLower != "",
            childMatches,
        ]);
    return childMatches || selfMatches;
}

function addChildren(
    objectAddress: GameObjectIndex,
    dataMap: Map<GameObjectIndex, TreeData>,
    filterMap?: Map<GameObjectIndex, [boolean, boolean]>,
    parentIndent = 0
) {
    const children = gameObjectsStore.childrenMap?.get(objectAddress);
    dataMap.set(objectAddress, [parentIndent, (children?.length ?? 0) > 0]);
    if (filterMap?.get(objectAddress)?.[1] ?? true)
        children
            ?.filter((addr) => filterMap?.has(addr) ?? true)
            ?.forEach((address) =>
                addChildren(address, dataMap, filterMap, parentIndent + 1)
            );
}
