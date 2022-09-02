import { ChevronLeftFilled, ChevronDownFilled, CubeFilled, FluentIconsProps } from "@fluentui/react-icons";
import { Divider, Input, Loading, Radio, Text, useInput } from "@nextui-org/react";
import { useMemo } from "react";
import { requestGameObjects } from "../misc/commands";
import { GameObjectJSON, getEvents, useEffectOnEvent } from "../misc/events";
import AutoSizer from 'react-virtualized-auto-sizer';

import { FixedSizeTree as Tree } from 'react-vtree';

import { NodeComponentProps } from "react-vtree/dist/es/Tree";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import { gameObjectsStore } from "../misc/handlers/gameobject";

interface TreeData {
    defaultHeight: number,
    go: GameObjectJSON,
    id: symbol,
    hasChildren: boolean,
    isOpenByDefault: boolean,
    nestingLevel: number
}

type GameObjectRowProps = NodeComponentProps<TreeData>

function* treeWalker(refresh: boolean, objects: Record<number, readonly [GameObjectJSON, symbol]>, rootObjects: (readonly [GameObjectJSON, symbol])[], childrenMap: Record<number, readonly number[]>): Generator<TreeData | string | symbol, void, boolean> {
    const getObject = (id: number) => objects[id][0]

// TODO: Hide children who do not match filter

    const stack = [...rootObjects]
    // Walk through the tree until we have no nodes available.
    while (stack.length !== 0) {
        const node = stack.pop()!;
        const go = node[0]
        const goSymbol = node[1]

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
                nestingLevel
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

// Node component receives all the data we created in the `treeWalker` +
// internal openness state (`isOpen`), function to change internal openness
// state (`toggle`) and `style` parameter that should be added to the root div.
function GameObjectRow({ data: { go, hasChildren, nestingLevel }, toggle, isOpen, style }: GameObjectRowProps) {
    const arrowProps: FluentIconsProps = { width: "1.5em", height: "1.5em" }

    const arrow = isOpen ? ChevronDownFilled(arrowProps) : ChevronLeftFilled(arrowProps)

    return (
        <div style={{ paddingLeft: `calc(20px * ${nestingLevel + 1})`, ...style }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                    <Radio isSquared key={go.transform!.address} size={"sm"} value={go.transform!.address!.toString()} label={go.transform!.address?.toString()} />

                    <CubeFilled title="GameObject" width={"2rem"} height={"2rem"} />
                </div>
                {/* minWidth is necessary for the text to handle overflow properly */}
                <div onClick={() => hasChildren && toggle()} style={{ cursor: hasChildren ? "pointer" : "auto", minWidth: 0 }}>

                    <Text h4 style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{go.name}</Text>
                    {/* <Text h4>Expandable {expandable ? "true" : "false"} C {String(go?.childrenIds?.length ?? "no")}</Text> */}
                </div>
                {hasChildren && (
                    <div style={{ display: "flex", flex: 1, justifyContent: "right", paddingRight: "10px", cursor: hasChildren ? "pointer" : "auto"  }} onClick={toggle}>
                        {arrow}
                    </div>
                )}

            </div>


            <Divider y={1} height={3} />

        </div>
    );
}

export default function GameObjectsList() {
    // TODO: Clean
    // TODO: Use Suspense?
    const navigate = useNavigate()

    const { objectsMap, childrenMap } = useSnapshot(gameObjectsStore);

    const filter = useInput("")

    const lowercaseFilter = useMemo(() => filter.value.toLowerCase(), [filter.value])

    const goFn = (id: number) => objectsMap![id]![0]
    const childrenFn = (go: GameObjectJSON) => childrenMap![go.transform!.address!].map(e => goFn(e))

    const match = (go: GameObjectJSON) => go.name?.toLowerCase().includes(lowercaseFilter);
    const recursiveMatch = (go: GameObjectJSON) => match(go) || (childrenMap && childrenFn(go).some(recursiveMatch));

    {/* TODO: Make recursive match faster */ }

    const rootObjects = useMemo(() => objectsMap && Object.values(objectsMap).filter(g => !g[0].transform!.parent), [objectsMap])
    const renderableObjects = useMemo(() => rootObjects?.filter(g => recursiveMatch(g[0])), [rootObjects, filter, childrenMap])


    // Listen to game object list events
    // On connect 
    useEffectOnEvent(getEvents().CONNECTED_EVENT, () => {
        console.log("connected after waiting, requesting objects")
        requestGameObjects();
    });

    if (!objectsMap || !childrenMap || !rootObjects || !renderableObjects) {
        return (
            <div style={{ overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", margin: "5vmin", height: "50vh" }}>
                <Loading size="xl" />
            </div>
        )
    }

    return (
        <div className="flex flex-col" style={{ height: "100%" }}>
            <div className="flex justify-center" style={{ width: "100%", height: "7em" }}>

                <Input {...filter.bindings} onClearClick={filter.reset} label="Search" clearable bordered width={"90%"} />

            </div>

            <div style={{ flexGrow: "2", height: "100%" }}>
                <AutoSizer disableWidth>
                    {({ height }) => (
                        // TODO: Make selected based on url params
                        <Radio.Group
                            onChange={(e) => {
                            console.log(`Selected ${e}`);
                            // TODO: make this a function that takes a GameObjectJSON, this is extremely error prone
                            navigate(`components/${objectsMap[parseInt(e)][0].transform?.address}`)
                            }}>

                            <Tree treeWalker={(r) => treeWalker(r, objectsMap, renderableObjects, childrenMap)} itemSize={55} height={height} width={"100%"}>
                                {GameObjectRow}
                            </Tree>
                        </Radio.Group>
                    )}
                </AutoSizer>
            </div>
        </div>

    )
}