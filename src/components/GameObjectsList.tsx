import { ArrowDownFilled, ArrowUpFilled, CubeFilled, FluentIconsProps } from "@fluentui/react-icons";
import { Button, Divider, Input, Loading, Radio, Text } from "@nextui-org/react";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { isConnected, requestGameObjects } from "../misc/commands";
import { getEvents, useListenToEvent } from "../misc/events";
import { GameObject } from "../misc/proto/qrue";
import { useEffectAsync } from "../misc/utils";
import { LazyCollapsable } from "./LazyCollapsable";
import AutoSizer from 'react-virtualized-auto-sizer';

import { FixedSizeTree as Tree } from 'react-vtree';

import { items as song_select_json } from "../misc/test_data_in_song_select.json";
import { NodeComponentProps } from "react-vtree/dist/es/Tree";

export interface GameObjectsListProps {

}

type GameObjectJSON = ReturnType<typeof GameObject.prototype.toObject>;

interface TreeData {
    defaultHeight: number,
    id: symbol,
    go: GameObjectJSON,
    isOpenByDefault: boolean,
    nestingLevel: number
}

type GameObjectRowProps = NodeComponentProps<TreeData>

function* treeWalker(refresh: boolean, objects: Record<number, [GameObjectJSON, symbol]>): Generator<TreeData | string | symbol, void, boolean> {
    const stack: [GameObjectJSON, symbol][] = Object.values(objects).filter(g => !g[0].parentId);

    // Walk through the tree until we have no nodes available.
    while (stack.length !== 0) {
        const node = stack.pop()!;
        const go = node[0]

        let nestingLevel = 0;
        let parent = go.parentId;
        while (parent) {
            parent = objects[parent][0]?.parentId;
            nestingLevel++;
        }

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
                isOpenByDefault: false,
                nestingLevel
            }
            : node[1];
        
        // Basing on the node openness state we are deciding if we need to render
        // the child nodes (if they exist).
        if (node && go.childrenIds && go.childrenIds.length !== 0 && isOpened) {
            // Since it is a stack structure, we need to put nodes we want to render
            // first to the end of the stack.
            for (let i = go.childrenIds.length - 1; i >= 0; i--) {
                const child = objects[go.childrenIds[i]];
                if (!child) throw `Undefined child ${i} on object ${JSON.stringify(node)}`

                stack.push(
                    child
                );
            }
        }
    }
}

// Node component receives all the data we created in the `treeWalker` +
// internal openness state (`isOpen`), function to change internal openness
// state (`toggle`) and `style` parameter that should be added to the root div.
function GameObjectRow({ data: { go, id, nestingLevel }, toggle, isOpen, style }: GameObjectRowProps) {
    const expandable = go.childrenIds !== undefined && go.childrenIds?.length > 0;

    const arrowProps: FluentIconsProps = { width: "1.5em", height: "1.5em" }

    const arrow = expandable &&
        isOpen ? ArrowUpFilled(arrowProps) : ArrowDownFilled(arrowProps)

    return (
        <div style={{ paddingLeft: `calc(20px * ${nestingLevel + 1})`, ...style }}>
            <div style={{
                display: "flex",
                alignItems: "center",
            }}>
                <div style={{ display: "flex", flex: "row", justifyContent: "center" }}>
                    { /* The marginTop position fix is so bad */}
                    <Radio isSquared key={go.id} size={"sm"} value={go.id!.toString()} style={{ marginTop: 10 }} label="R" />

                    {expandable && arrow}
                    <CubeFilled title="GameObject" width={"2rem"} height={"2rem"} />
                </div >
                <div onClick={() => expandable && toggle()} style={{ cursor: expandable ? "pointer" : "auto" }}>

                    <Text h4>{go.name}</Text>
                    {/* <Text h4>Expandable {expandable ? "true" : "false"} C {String(go?.childrenIds?.length ?? "no")}</Text> */}
                </div>
            </div>


            <Divider y={1} height={3} />

        </div>
    );
}

export default function GameObjectsList(props: GameObjectsListProps) {
    // TODO: Clean
    // TODO: Use Suspense?

    const objects = useListenToEvent(getEvents().GAMEOBJECTS_LIST_EVENT, []) ?? song_select_json
    const [filter, setFilter] = useState<string>("")


    const objectsMap: Record<number, [GameObjectJSON, symbol]> | undefined = useMemo(() => {
        if (!objects) return undefined;

        const obj: Record<number, [GameObjectJSON, symbol]> = {}
        objects?.forEach(o => {
            obj[o.id!] = [o, Symbol(o.id)];
        });

        return obj;
    }, [objects]);

    {/* TODO: Allow filter to include children */ }
    const renderableObjects = useMemo(() => objects?.filter(g => !g.parentId && g.name!.includes(filter)), [objects, filter])


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

    if (!objects || !objectsMap || !renderableObjects) {
        return (
            <div style={{ overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", margin: "5vmin", height: "50vh" }}>
                <Loading size="xl" />
            </div>
        )
    }

    return (
        <div className="flex flex-col" style={{ height: "100%" }}>
            <div className="flex justify-center"
                style={{ width: "100%" }}
            >
                <Input label="Search" clearable bordered onChange={(e => setFilter(e.currentTarget.value))} width={"90%"} />
            </div>

            <div style={{ flexGrow: "2", height: "100%" }}>
                <AutoSizer disableWidth>
                    {({ height, width }) => (
                        <Radio.Group onChange={(e) => {
                            console.log(`Selected ${e}`);
                            getEvents().SELECTED_GAME_OBJECT.invoke(objectsMap[parseInt(e)][0]);
                        } }>
                            <Tree treeWalker={(r) => treeWalker(r, objectsMap)} itemSize={55} height={height} width={"100%"}>
                                {GameObjectRow}
                            </Tree>

                        </Radio.Group>
                    )}
                </AutoSizer>
            </div>
        </div>

    )
}