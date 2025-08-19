import {
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
} from "../../misc/events";
import {
  GameObjectIndex,
  gameObjectsStore,
} from "../../misc/handlers/gameobject";

import styles from "./GameObjectList.module.css";
import { requestGameObjects } from "../../misc/handlers/gameobject";
import { selectClass } from "../../App";
import { Navigator, useNavigate } from "@solidjs/router";
import { VirtualList } from "../utils/VirtualList";

import { plus } from "solid-heroicons/outline";
import { Icon } from "solid-heroicons";
import { CreateGameObjectResult } from "../../misc/proto/qrue";
import { ActionButton } from "./InputCell";

function GameObjectListItem(props: {
  item: GameObjectIndex;
  navigate: Navigator;
  addressMap: Map<GameObjectIndex, [boolean, boolean]> | undefined;
  updateAddressMap?: (map?: Map<GameObjectIndex, [boolean, boolean]>) => void;
  addressTreeData: Map<GameObjectIndex, [number, boolean]> | undefined;
}) {
  const object = createMemo(
    () => gameObjectsStore.objectsMap?.get(props.item)?.[0],
  );

  const highlighted = createMemo(
    () => props.addressMap?.get(props.item)?.[0] ?? false,
  );
  const expanded = createMemo(() => {
    const map = props.addressMap;
    return map ? map.get(props.item)?.[1] : true;
  });

  const toggle = () =>
    props.updateAddressMap?.(
      props.addressMap?.set(props.item, [highlighted(), !expanded()]),
    );
  const select = () => selectClass(props.navigate, object()?.address);

  // [indent, hasChildren]
  const treeData = createMemo<[number, boolean]>(
    () => props.addressTreeData?.get(props.item) ?? [0, false],
  );

  return (
    <div
      class={`${styles.listItem} ${highlighted() ? styles.highlighted : ""}`}
      style={{ "padding-left": `${treeData()[0] + 0.25}rem` }}
      // role="listitem"
    >
      <Show when={treeData()[1]}>
        <span
          role="checkbox"
          tabIndex={"0"}
          aria-checked={!expanded()}
          class="mr-1 flex-none w-4 text-center"
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

// finds if an object should show up in search results and provides info for highlights/expansion
// if self matches, it should be highlighted, if a child matches (or child of child), it should be expanded
function inSearch(
  object: GameObjectJSON,
  addressMap: Map<
    GameObjectIndex,
    [selfMatches: boolean, childMatches: boolean]
  >,
  searchLower: string,
  matchChild = false,
): boolean {
  if (addressMap.has(object.transform!.address!)) return true;

  let thisSearch = searchLower;
  const hierarchySplit = searchLower.split("/");
  if (hierarchySplit.length > 1) thisSearch = hierarchySplit.splice(0, 1)[0];

  let childMatches = false;
  // require all parts separated by spaces match
  const selfMatches =
    thisSearch.split(" ").findIndex((searchPart) => {
      if (!object.name?.toLocaleLowerCase().includes(searchPart)) return true;
    }) == -1;

  if (selfMatches) searchLower = hierarchySplit.join("/");

  for (const addr of gameObjectsStore.childrenMap?.get(
    object.transform!.address!,
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
  parentIndent = 0,
) {
  const children = gameObjectsStore.childrenMap?.get(objectAddress);
  dataMap.set(objectAddress, [parentIndent, (children?.length ?? 0) > 0]);
  if (filterMap?.get(objectAddress)?.[1] ?? true)
    children
      ?.filter((addr) => filterMap?.has(addr) ?? true)
      ?.forEach((address) =>
        addChildren(address, dataMap, filterMap, parentIndent + 1),
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
      ([, [o]]) => !o.transform?.parent,
    ),
  );

  // createDeferred is a createMemo that runs when the browser is idle
  // Solid is awesome
  const filteredRootObjects = createDeferred(
    () => {
      if (!gameObjectsStore.objectsMap) return null;

      const searchLower = search().toLocaleLowerCase();
      const newAddresses = new Map<bigint, [boolean, boolean]>();
      const ret = rootObjects().filter(([, [obj]]) =>
        inSearch(obj, newAddresses, searchLower),
      );
      setSearchAddresses(newAddresses);
      return ret;
    },
    { timeoutMs: 1000 },
  );
  // #endregion

  // address -> [indentation, hasChildren]
  const [addressTreeData, setAddressTreeData] = createSignal<
    Map<GameObjectIndex, [number, boolean]> | undefined
  >(undefined, { equals: false });

  // calculate the indentation and children status for all objects in search and return all the transform addresses
  const objects = createMemo(() => {
    const addresses = searchAddresses();
    const newTreeData = new Map<GameObjectIndex, [number, boolean]>();
    filteredRootObjects()?.forEach(([, [obj]]) =>
      addChildren(obj.transform!.address, newTreeData, addresses),
    );
    setAddressTreeData(newTreeData);
    return Array.from(newTreeData.keys());
  });

  const [requesting, setRequesting] = createSignal<boolean>();

  const noEntries = () => (search() ? "No Results" : "Loading...");

  // update state
  createEventEffect<PacketWrapperCustomJSON>(
    getEvents().ALL_PACKETS,
    (packet) => {
      if (packet.Packet?.$case === "getAllGameObjectsResult") {
        selectClass(navigate, undefined);
        setRequesting(false);
      }
    },
  );

  // refresh state
  function refresh() {
    if (!requesting()) requestGameObjects();
    setRequesting(true);
  }

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
        <ActionButton
          class="flex-none p-2"
          onClick={refresh}
          img="refresh"
          loading={requesting()}
        />
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
                addressMap: searchAddresses(),
                updateAddressMap: setSearchAddresses,
                addressTreeData: addressTreeData(),
              })
            }
          />
        </Show>
      </Show>
    </div>
  );
}

// button and menu to create a new game object
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
    <div class="dropdown dropdown-bottom dropdown-end flex-none">
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
