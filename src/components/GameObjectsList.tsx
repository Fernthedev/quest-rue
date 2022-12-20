import { Input, Loading, Radio, useInput } from "@nextui-org/react";
import { useMemo } from "react";
import { requestGameObjects } from "../misc/commands";
import { GameObjectJSON, getEvents, useEffectOnEvent } from "../misc/events";
import AutoSizer from "react-virtualized-auto-sizer";

import { FixedSizeTree as Tree } from "react-vtree";

import { useNavigate, useParams } from "react-router-dom";
import { useSnapshot } from "valtio";
import { gameObjectsStore } from "../misc/handlers/gameobject";
import { TypeManagerParams } from "./TypeManager";
import {
    GameObjectRow,
    GameObjectRowTreeData,
} from "./game_object_list/GameObjectRow";

function* treeWalker(
    refresh: boolean,
    objects: Record<number, readonly [GameObjectJSON, symbol]>,
    rootObjects: (readonly [GameObjectJSON, symbol])[],
    childrenMap: Record<number, readonly number[]>
): Generator<GameObjectRowTreeData | string | symbol, void, boolean> {
    const getObject = (id: number) => objects[id][0];

    // TODO: Hide children who do not match filter

    const stack = [...rootObjects];
    // Walk through the tree until we have no nodes available.
    while (stack.length !== 0) {
        const node = stack.pop()!;
        const go = node[0];
        const goSymbol = node[1];

        let nestingLevel = 0;
        let parent = go.transform?.parent;
        while (parent) {
            parent = getObject(parent)?.transform?.parent;
            nestingLevel++;
        }
        const children = childrenMap[go.transform!.address!];
        // Here we are sending the information about the node to the Tree component
        // and receive an information about the openness state from it. The
        // `refresh` parameter tells us if the full update of the tree is requested;
        // basing on it we decide to return the full node data or only the node
        // id to update the nodes order.
        const isOpened = yield refresh
            ? {
                  defaultHeight: 30,
                  go: node[0],
                  id: node[1],
                  hasChildren: children.length > 0,
                  isOpenByDefault: false,
                  nestingLevel,
              }
            : goSymbol;

        // Basing on the node openness state we are deciding if we need to render
        // the child nodes (if they exist).
        if (node && children.length > 0 && isOpened) {
            for (const child of children) {
                stack.push(objects[child]);
            }
        }
    }
}

export default function GameObjectsList() {
    // TODO: Clean
    // TODO: Use Suspense?
    const navigate = useNavigate();
    const params = useParams<TypeManagerParams>();

    const { objectsMap, childrenMap } = useSnapshot(gameObjectsStore);

    const filter = useInput("");

    const lowercaseFilter = useMemo(
        () => filter.value.toLowerCase(),
        [filter.value]
    );

    const gameObjectGetFn = (id: number) => objectsMap![id]![0];
    const childrenFn = (go: GameObjectJSON) =>
        childrenMap![go.transform!.address!].map(gameObjectGetFn);

    const match = (go: GameObjectJSON) =>
        go.name?.toLowerCase().includes(lowercaseFilter);
    const recursiveMatch = (go: GameObjectJSON) =>
        match(go) || (childrenMap && childrenFn(go).some(recursiveMatch));

    {
        /* TODO: Make recursive match faster */
    }

    const rootObjects = useMemo(
        () =>
            objectsMap &&
            Object.values(objectsMap).filter(([g]) => !g.transform!.parent),
        [objectsMap]
    );
    const renderableObjects = useMemo(
        () => rootObjects?.filter(([g]) => recursiveMatch(g)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [rootObjects, filter, childrenMap]
    );

    // Listen to game object list events
    // On connect
    useEffectOnEvent(getEvents().CONNECTED_EVENT, () => {
        console.log("connected after waiting, requesting objects");
        requestGameObjects();
    });

    if (!objectsMap || !childrenMap || !rootObjects || !renderableObjects) {
        return (
            <div
                style={{
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    margin: "5vmin",
                    height: "50vh",
                }}
            >
                <Loading size="xl" />
            </div>
        );
    }

    return (
        <div className="flex flex-col" style={{ height: "100%" }}>
            <div
                className="flex justify-center"
                style={{ width: "100%", height: "7em" }}
            >
                <Input
                    {...filter.bindings}
                    onClearClick={filter.reset}
                    label="Search"
                    clearable
                    bordered
                    width={"90%"}
                />
            </div>

            <div style={{ flexGrow: "2", height: "100%" }}>
                <AutoSizer disableWidth>
                    {({ height }) => (
                        // TODO: Make selected based on url params
                        <Radio.Group
                            aria-label={"GameObjectList"}
                            defaultValue={params.gameObjectAddress ?? undefined}
                            onChange={(e) => {
                                console.log(`Selected ${e}`);
                                // TODO: make this a function that takes a GameObjectJSON, this is extremely error prone
                                navigate(
                                    `components/${
                                        objectsMap[parseInt(e)][0].transform
                                            ?.address
                                    }`
                                );
                            }}
                        >
                            <Tree
                                treeWalker={(r) =>
                                    treeWalker(
                                        r,
                                        objectsMap,
                                        renderableObjects,
                                        childrenMap
                                    )
                                }
                                itemSize={55}
                                height={height}
                                width={"100%"}
                            >
                                {GameObjectRow}
                            </Tree>
                        </Radio.Group>
                    )}
                </AutoSizer>
            </div>
        </div>
    );
}
