import {
    Accessor,
    Show,
    createDeferred,
    createMemo,
    createSignal,
} from "solid-js";
import {
    GameObjectJSON,
    PacketWrapperCustomJSON,
    createEventEffect,
    getEvents,
} from "../misc/events";
import { GameObjectIndex, gameObjectsStore } from "../misc/handlers/gameobject";

import styles from "./GameObjectList.module.css";
import { requestGameObjects, sendPacket } from "../misc/commands";
import { objectUrl } from "../App";
import { Navigator, useNavigate } from "@solidjs/router";
import { VirtualList } from "./VirtualList";

import { plus } from "solid-heroicons/solid";
import { Icon } from "solid-heroicons";
import { PacketWrapper } from "../misc/proto/qrue";
import { uniqueBigNumber } from "../misc/utils";

function GameObjectListItem(props: {
    item: GameObjectIndex;
    navigate: Navigator;
    addressMap: Accessor<Map<GameObjectIndex, [boolean, boolean]> | undefined>;
    updateAddressMap?: (map?: Map<GameObjectIndex, [boolean, boolean]>) => void;
    addressTreeData: Accessor<
        Map<GameObjectIndex, [number, boolean]> | undefined
    >;
}) {
    const object = createMemo(
        () => gameObjectsStore.objectsMap?.get(props.item)?.[0]
    );

    const highlighted = createMemo(
        () => props.addressMap()?.get(props.item)?.[0] ?? false
    );
    const expanded = createMemo(() => {
        const map = props.addressMap();
        return map ? map.get(props.item)?.[1] : true;
    });

    const toggle = () =>
        props.updateAddressMap?.(
            props.addressMap()?.set(props.item, [highlighted(), !expanded()])
        );
    const select = () => props.navigate(objectUrl(object()?.address));

    // [indent, hasChildren]
    const treeData = createMemo(
        () => props.addressTreeData()?.get(props.item) ?? [0, false]
    );

    return (
        <div
            class={`${styles.listItem} ${
                highlighted() ? styles.highlighted : ""
            }`}
            style={{ "padding-left": `${treeData()[0]}rem` }}
            // role="listitem"
        >
            <Show when={treeData()[1]}>
                <span
                    role="checkbox"
                    tabIndex={"0"}
                    aria-checked={!expanded()}
                    class="mr-1 inline-block w-4 text-center"
                    onKeyPress={toggle}
                    onClick={toggle}
                >
                    {expanded() ? "-" : "+"}
                </span>
            </Show>
            <span role="link" tabIndex="0" onKeyPress={select} onClick={select}>
                {object()?.name}
            </span>
        </div>
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
    if (addressMap.has(object.transform!.address!)) return true;

    let childMatches = false;
    let selfMatches = false;
    if (object.name?.toLocaleLowerCase().includes(searchLower))
        selfMatches = true;

    for (const addr of gameObjectsStore.childrenMap?.get(
        object.transform!.address!
    ) ?? []) {
        const child = gameObjectsStore.objectsMap!.get(addr)![0];
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
    dataMap: Map<GameObjectIndex, [number, boolean]>,
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

export default function GameObjectList() {
    const navigate = useNavigate();

    /// Handle search
    // #region search
    const [search, setSearch] = createSignal<string>("");

    // address -> [highlight, expand]
    const [searchAddresses, setSearchAddresses] = createSignal<
        Map<GameObjectIndex, [boolean, boolean]> | undefined
    >(undefined, { equals: false });

    const rootObjects = createDeferred(() =>
        [...(gameObjectsStore.objectsMap?.entries() ?? [])].filter(
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
    // #endregion

    // address -> [indentation, hasChildren]
    const [addressTreeData, setAddressTreeData] = createSignal<
        Map<GameObjectIndex, [number, boolean]> | undefined
    >(undefined, { equals: false });

    const objects = createMemo(() => {
        const addresses = searchAddresses();
        const newTreeData = new Map<GameObjectIndex, [number, boolean]>();
        filteredRootObjects()?.forEach(([, [obj]]) =>
            addChildren(obj.transform!.address, newTreeData, addresses)
        ) ?? [];
        setAddressTreeData(newTreeData);
        return Array.from(newTreeData.keys());
    });

    // refresh store
    requestGameObjects();
    const [requesting, setRequesting] = createSignal<boolean>();

    const noEntries = () => (search() ? "No Results" : "Loading...");

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
        // setSearch(""); // TODO: Is this necessary?
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
            <div class="px-2 py-2 flex gap-2 justify-center">
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
                    <VirtualList
                        class={`${styles.list} w-full`}
                        items={objects()}
                        itemHeight={29}
                        generator={(item) =>
                            GameObjectListItem({
                                item: item,
                                navigate: navigate,
                                addressMap: searchAddresses,
                                updateAddressMap: setSearchAddresses,
                                addressTreeData: addressTreeData,
                            })
                        }
                    />
                </Show>
            </Show>
        </div>
    );
}
function AddGameObject(props: { parent: bigint }) {
    const [name, setName] = createSignal("GameObjectClone");
    const [childOfSelected, setChildOfSelected] = createSignal(false);

    const create = () => {
        sendPacket(
            PacketWrapper.create({
                queryResultId: uniqueBigNumber(),
                Packet: {
                    $case: "createGameObject",
                    createGameObject: {
                        object: {
                            active: true,
                            name: name(),
                            transform: {
                                name: name(),
                                parent: childOfSelected() ? props.parent : 0n,
                            },
                        },
                    },
                },
            })
        );
    };

    return (
        <button class="dropdown dropdown-bottom dropdown-end flex-0 p-2">
            <Icon path={plus} style={{ height: "1.5rem", width: "1.5rem" }} />

            <div
                class="
                flex-col
                gap-2 justify-center 
                p-2 shadow menu dropdown-content
                bg-neutral-200 dark:bg-zinc-950
                z-10 rounded-box h-60"
            >
                <h4 class="text-base">Create new game object</h4>
                <input
                    placeholder="New Game Object"
                    value={name()}
                    onInput={(e) => {
                        setName(e.currentTarget.value);
                    }}
                    class="flex-1 mx-2 max-h-10 min-w-80"
                />

                {/* A11Y <3 */}
                <label class="label">
                    <span class="label-text text-base whitespace-nowrap">
                        Child of selected GameObject
                    </span>
                    <input
                        type="checkbox"
                        checked={childOfSelected()}
                        aria-checked={childOfSelected()}
                        class="mx-2"
                        onChange={(e) => {
                            return setChildOfSelected(e.currentTarget.checked);
                        }}
                    />
                </label>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a
                    class="w-80 btn mx-2 flex-0"
                    onClick={create}
                    onKeyPress={create}
                    role="button"
                    tabIndex={0}
                >
                    Create
                </a>
            </div>
        </button>
    );
}
