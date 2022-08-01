import { ChevronLeftFilled, ChevronDownFilled, CubeFilled, FluentIconsProps } from "@fluentui/react-icons";
import { Divider, Input, Loading, Radio, Text } from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import { requestGameObjects } from "../misc/commands";
import { GameObjectJSON, getEvents, useListenToEvent } from "../misc/events";
import { ProtoGameObject } from "../misc/proto/unity";
import { useEffectAsync } from "../misc/utils";
import AutoSizer from 'react-virtualized-auto-sizer';

import { FixedSizeTree as Tree } from 'react-vtree';

import { NodeComponentProps } from "react-vtree/dist/es/Tree";
import { useNavigate } from "react-router-dom";

export interface GameObjectsListProps {
    objectsMap: Record<number, [GameObjectJSON, symbol]> | undefined
}

interface TreeData {
    defaultHeight: number,
    go: GameObjectJSON,
    id: symbol,
    hasChildren: boolean,
    isOpenByDefault: boolean,
    nestingLevel: number
}

type GameObjectRowProps = NodeComponentProps<TreeData>

function* treeWalker(refresh: boolean, objects: Record<number, [GameObjectJSON, symbol]>, childrenMap: Record<number, number[]>): Generator<TreeData | string | symbol, void, boolean> {
    const getObject = (id: number) => objects[id][0]

    const stack: [GameObjectJSON, symbol][] = Object.values(objects).filter(g => !g[0].transform!.parent);
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
                    <Radio isSquared key={go.transform!.address} size={"sm"} value={go.transform!.address!.toString()} label="R" />

                    <CubeFilled title="GameObject" width={"2rem"} height={"2rem"} />
                </div>
                {/* minWidth is necessary for the text to handle overflow properly */}
                <div onClick={() => hasChildren && toggle()} style={{ cursor: hasChildren ? "pointer" : "auto", minWidth: 0 }}>

                    <Text h4 style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{go.name}</Text>
                    {/* <Text h4>Expandable {expandable ? "true" : "false"} C {String(go?.childrenIds?.length ?? "no")}</Text> */}
                </div>
                <div style={{ display: "flex", flex: 1, justifyContent: "right", paddingRight: "10px" }}>
                    {hasChildren && arrow}
                </div>
            </div>


            <Divider y={1} height={3} />

        </div>
    );
}

export default function GameObjectsList({objectsMap}: GameObjectsListProps) {
    // TODO: Clean
    // TODO: Use Suspense?
    const navigate = useNavigate()

    const [filter, setFilter] = useState<string>("")

    const childrenMap: Record<number, number[]> | undefined = useMemo(() => {
        if (!objectsMap) return undefined;

        const tempChildMap: Record<number, number[]> = {}

        Object.values(objectsMap).forEach(pair => {
            const o = pair[0];
            // ignore the error messages!
            const address = o.transform?.address;

            if (!address) return;

            if (!tempChildMap[address])
                tempChildMap[address] = []

            const parent = o.transform?.parent;

            if (parent) {
                if (!tempChildMap[parent])
                    tempChildMap[parent] = []

                tempChildMap[parent].push(address)
            }
        });

        return tempChildMap;
    }, [objectsMap]);

    {/* TODO: Allow filter to include children */ }
    const renderableObjects = useMemo(() => objectsMap && Object.values(objectsMap).filter(g => !g[0].transform?.parent && g[0].name?.includes(filter)), [objectsMap, filter])


    // Listen to game object list events
    // On connect 
    useEffectAsync(async () => {
        console.log("listening for game objects")
        const id = getEvents().CONNECTED_EVENT.addListener(() => {
            console.log("connected after waiting, requesting objects")
            requestGameObjects();
        });

        return () => {
            getEvents().CONNECTED_EVENT.removeListener(id)
        }
    }, [])

    if (!objectsMap || !renderableObjects || !childrenMap) {
        return (
            <div style={{ overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", margin: "5vmin", height: "50vh" }}>
                <Loading size="xl" />
            </div>
        )
    }

    return (
        <div className="flex flex-col" style={{ height: "100%" }}>
            <div className="flex justify-center" style={{ width: "100%", height: "7em" }}>

                <Input label="Search" clearable bordered onChange={(e => setFilter(e.currentTarget.value))} width={"90%"} />

            </div>

            <div style={{ flexGrow: "2", height: "100%" }}>
                <AutoSizer disableWidth>
                    {({ height, width }) => (
                        // TODO: Make selected based on url params
                        <Radio.Group onChange={(e) => {
                            console.log(`Selected ${e}`);
                            // TODO: make this a function that takes a GameObjectJSON, this is extremely error prone
                            navigate(`components/${objectsMap[parseInt(e)][0].transform?.address}`)
                        }}>
                            <Tree treeWalker={(r) => treeWalker(r, objectsMap, childrenMap)} itemSize={55} height={height} width={"100%"}>
                                {GameObjectRow}
                            </Tree>
                        </Radio.Group>
                    )}
                </AutoSizer>
            </div>
        </div>

    )
}