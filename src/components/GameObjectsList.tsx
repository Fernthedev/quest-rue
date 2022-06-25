import { CubeFilled } from "@fluentui/react-icons";
import { Button, Divider, Input, Loading, Radio, Text } from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import { isConnected, requestGameObjects } from "../misc/commands";
import { getEvents, useListenToEvent } from "../misc/events";
import { GameObject } from "../misc/proto/qrue";
import { useEffectAsync } from "../misc/utils";
import { LazyCollapsable } from "./LazyCollapsable";

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
    isOpenByDefault: boolean
}

type GameObjectRowProps = NodeComponentProps<TreeData>

function* treeWalker(refresh: boolean, objects: Record<number, GameObjectJSON>): Generator<TreeData | string | symbol, void, boolean> {
    const stack: GameObjectJSON[] = Object.values(objects).filter(g => !g.parentId);

    // Walk through the tree until we have no nodes available.
    while (stack.length !== 0) {
        const node = stack.pop()!;

        // Here we are sending the information about the node to the Tree component
        // and receive an information about the openness state from it. The
        // `refresh` parameter tells us if the full update of the tree is requested;
        // basing on it we decide to return the full node data or only the node
        // id to update the nodes order.
        const isOpened = yield refresh
            ? {
                defaultHeight: 30,
                go: objects[node.id!],
                id: Symbol(node.id),
                isOpenByDefault: false,
            }
            : Symbol(node.id);

        // Basing on the node openness state we are deciding if we need to render
        // the child nodes (if they exist).
        if (node && node.childrenIds && node.childrenIds.length !== 0 && isOpened) {
            // Since it is a stack structure, we need to put nodes we want to render
            // first to the end of the stack.
            for (let i = node.childrenIds.length - 1; i >= 0; i--) {
                if (!objects[node.childrenIds[i]]) throw `Undefined child ${i} on object ${JSON.stringify(node)}`

                stack.push(
                    objects[node.childrenIds[i]]
                );
            }
        }
    }
}

// Node component receives all the data we created in the `treeWalker` +
// internal openness state (`isOpen`), function to change internal openness
// state (`toggle`) and `style` parameter that should be added to the root div.
function GameObjectRow({ data: { go }, toggle, isOpen }: GameObjectRowProps) {
    const expandable = go.childrenIds !== undefined && go.childrenIds?.length > 0;

    return (
        <div style={{ paddingLeft: "20px" }}>
            <div style={{
                display: "flex",
                alignItems: "center",
            }}>
                <div style={{ display: "flex", flex: "row", justifyContent: "center" }}>
                    { /* The marginTop position fix is so bad */}
                    <Radio isSquared key={go.id} size={"sm"} value={go.id!.toString()} style={{ marginTop: 10 }} label="R" />

                    <CubeFilled title="GameObject" width={"2em"} height={"2em"} />
                </div >
                <div onClick={() => expandable && toggle()} style={{ cursor: expandable ? "pointer" : "auto" }}>
                    <Text h4>{go.name}</Text>
                </div>
            </div>


            <Divider y={1} height={3} />

        </div>
    );
}

export default function GameObjectsList(props: GameObjectsListProps) {
    // TODO: Clean
    // TODO: Use Suspense?
    // const [objects, setObjects] = useState<string[] | null>(null);
    const objects = useListenToEvent(getEvents().GAMEOBJECTS_LIST_EVENT, []) ?? song_select_json
    const [filter, setFilter] = useState<string>("")


    const objectsMap: Record<number, GameObjectJSON> | undefined = useMemo(() => {
        if (!objects) return undefined;

        const obj: Record<number, GameObjectJSON> = {}
        objects?.forEach(o => {
            obj[o.id!] = o;
        });

        return obj;
    }, [objects]);

    const renderableObjects = objectsMap //?.filter(g => !g.parentId && (filter === "" || g.name?.includes(filter)))

    // console.log(`Received objects ${Array.from(Object.entries(objectsMap ?? []).keys())}`)

    // Listen to game object list events
    // On connect 
    useEffectAsync(async () => {
        console.log("listening for game objects")
        return getEvents().CONNECTED_EVENT.addListener(() => {
            console.log("connected after waiting, requesting objects")
            requestGameObjects();
        });
    }, [])

    // TODO: Slicing
    // if (objectsRow && objectsRow.length > 300) {
    //     const oldObjectsRow = objectsRow;
    //     objectsRow = [];

    //     for (let i = 0; i + 300 < objectsRow.length; i++) {
    //         objectsRow[i] = (<GameObjectRow objects={objectsMap} go={undefined} key={`DUMMY_OBJECT_PARENT_QUEST_RUE${i}`} oldObjectsRow.slice(i, i + 300) />)
    //     }
    // }

    if (!objects) {
        return (
            <div style={{ overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", margin: "5vmin", height: "50vh" }}>
                <Loading size="xl" />
            </div>
        )
    }

    return (
        <>
            <div className="flex justify-center">
                <Input label="Search" clearable bordered onChange={(e => setFilter(e.currentTarget.value))} width={"90%"}/>
            </div>

            <Radio.Group onChange={(e) => {
                console.log(`Selected ${e}`)
                getEvents().SELECTED_GAME_OBJECT.invoke(objectsMap![parseInt(e)])
            }}>
                <div style={{ lineHeight: 1.5, }}>

                    {/* TODO: Allow filter to include children */}

                    <Tree treeWalker={(r) => treeWalker(r, renderableObjects ?? [])} itemSize={30} height={180}>
                        {GameObjectRow}
                    </Tree>

                </div>
            </Radio.Group>
        </>
    )
}