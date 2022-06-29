import { CubeFilled } from "@fluentui/react-icons";
import { Button, Divider, Input, Loading, Radio, Text } from "@nextui-org/react";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { isConnected, requestGameObjects } from "../misc/commands";
import { getEvents, useListenToEvent } from "../misc/events";
import { GameObject } from "../misc/proto/qrue";
import { useEffectAsync } from "../misc/utils";
import { LazyCollapsable } from "./LazyCollapsable";

import { FixedSizeList as List } from 'react-window';
import { items as song_select_json } from "../misc/test_data_in_song_select.json";

export interface GameObjectsListProps {

}

type GameObjectJSON = ReturnType<typeof GameObject.prototype.toObject>;

interface GameObjectRowProps {
    index: number;
    style: CSSProperties;
    data: {
        depth?: number,
        go?: GameObjectJSON,
        objects: Record<number, GameObjectJSON>,
        renderableObjects: GameObjectJSON[]
    };
    isScrolling?: boolean | undefined;
}

// Node component receives all the data we created in the `treeWalker` +
// internal openness state (`isOpen`), function to change internal openness
// state (`toggle`) and `style` parameter that should be added to the root div.
function GameObjectRow(props: GameObjectRowProps) {
    const data = props.data;
    const { data: { depth, objects } } = props
    const go = data.go ?? data.renderableObjects[props.index];

    let childrenFactory: (() => JSX.Element) | undefined = undefined;

    if ((!depth || depth > 0) && go.childrenIds && go.childrenIds.length > 0) {
        // eslint-disable-next-line react/display-name
        childrenFactory = () => {
            const childProp = { ...props };
            childProp.data.depth!--;

            return (
                <>
                    {
                        go?.childrenIds?.map(childId => {
                            const child = objects[childId];

                            if (!child) {
                                console.error(`Did not find child for id ${childId}`);
                                return undefined;
                            }


                            return GameObjectRow({ ...childProp, data: {...childProp.data, go: child} });
                        })
                    }
                </>
            )
        };
    }

    return (
        <LazyCollapsable key={go.id} childrenFactory={childrenFactory}
            unclickableChildren={(
                <div style={{ display: "flex", flex: "row", justifyContent: "center" }}>
                    { /* The marginTop position fix is so bad */}
                    <Radio isSquared key={go.id} size={"sm"} value={go.id!.toString()} style={{ marginTop: 10 }} label="R" />

                    <CubeFilled title="GameObject" width={"2em"} height={"2em"} />


                </div >
            )}>

            <Text h4>{go.name}</Text>

        </LazyCollapsable>
    );
}

export default function GameObjectsList(props: GameObjectsListProps) {
    // TODO: Clean
    // TODO: Use Suspense?

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

    if (!renderableObjects) {
        console.log("Bad objects")
    }

    return (
        <>
            <div className="flex justify-center">
                <Input label="Search" clearable bordered onChange={(e => setFilter(e.currentTarget.value))} width={"90%"} />
            </div>

            <Radio.Group onChange={(e) => {
                console.log(`Selected ${e}`)
                getEvents().SELECTED_GAME_OBJECT.invoke(objectsMap[parseInt(e)])
            }}>
                <div>


                    <List
                        height={950}
                        itemSize={35}
                        width={"100%"}
                        itemCount={renderableObjects.length}
                        itemData={{
                            objects: objectsMap,
                            renderableObjects: renderableObjects
                        }}
                    >
                        {GameObjectRow}
                    </List>

                </div>
            </Radio.Group>
        </>
    )
}