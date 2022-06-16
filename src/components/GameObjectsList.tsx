import { CubeFilled } from "@fluentui/react-icons";
import { Button, Divider, Input, Loading, Radio, Text } from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import { isConnected, requestGameObjects } from "../misc/commands";
import { getEvents, useListenToEvent } from "../misc/events";
import { GameObject } from "../misc/proto/qrue";
import { useEffectAsync } from "../misc/utils";
import { LazyCollapsable } from "./LazyCollapsable";

import { items as song_select_json } from "../misc/test_data_in_song_select.json";

export interface GameObjectsListProps {

}

type GameObjectJSON = ReturnType<typeof GameObject.prototype.toObject>;

interface GameObjectRowProps {
    objects: Record<number, GameObjectJSON>,
    go: GameObjectJSON,
    depth?: number
}

function GameObjectRow({ objects, go, depth }: GameObjectRowProps) {
    let childrenFactory: (() => JSX.Element) | undefined = undefined;

    if ((!depth || depth > 0) && go.childrenIds && go.childrenIds.length > 0) {
        // eslint-disable-next-line react/display-name
        childrenFactory = () => (
            <>
                {
                    go?.childrenIds?.map(childId => {
                        const child = objects[childId];

                        if (!child) {
                            console.error(`Did not find child for id ${childId}`)
                            return undefined
                        }


                        return GameObjectRow({ objects: objects, go: child, depth: depth && depth-- })
                    })
                }
            </>
        );
    }

    return (
        <>
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
        </>
    );
}

export default function GameObjectsList(props: GameObjectsListProps) {
    // TODO: Clean
    // TODO: Use Suspense?
    // const [objects, setObjects] = useState<string[] | null>(null);
    const objects = useListenToEvent(getEvents().GAMEOBJECTS_LIST_EVENT, []) // ?? song_select_json
    const [filter, setFilter] = useState<string>("");

    const increment = 100;

    const [renderedAmount, setRenderedAmount] = useState<number>(increment);



    const objectsMap: Record<number, GameObjectJSON> | undefined = useMemo(() => {
        if (!objects) return undefined;

        const obj: Record<number, GameObjectJSON> = {}
        objects?.forEach(o => {
            obj[o.id!] = o;
        });

        return obj;
    }, [objects]);

    const renderableObjects = objects?.filter(g => !g.parentId)

    // Reuse allocated html
    const objectsRendered = useMemo<Record<number, JSX.Element> | undefined>(() => {
        if (!objects || !objectsMap) return undefined;

        const map: Record<number, JSX.Element> = {}

        // Only render root objects
        // their children are handled by the parent
        renderableObjects?.forEach(e =>
            map[e.id!] = (
                <GameObjectRow objects={objectsMap} go={e} key={e.id} />
            )
        )

        return map;
    }, [objects])

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
            <Input label="Search" clearable bordered onChange={(e => setFilter(e.currentTarget.value))} />

            <Radio.Group onChange={(e) => {
                console.log(`Selected ${e}`)
                getEvents().SELECTED_GAME_OBJECT.invoke(objectsMap![parseInt(e)])
            }}>
                <div style={{ lineHeight: 1.5, }}>

                    {/* TODO: Allow filter to include children */}
                    {objectsMap && renderableObjects?.filter(g => !g.parentId && g.name!.includes(filter))?.slice(0, renderedAmount).map(e => objectsRendered![e.id!]!)}

                </div>
            </Radio.Group>

            {renderedAmount < objects.length && (
                <Button onClick={() => setRenderedAmount(a => a + increment)}>

                    <Text>
                        Load {increment < objects.length - renderedAmount ? increment : objects.length - renderedAmount} more. {objects.length - renderedAmount} remaining
                    </Text>
                </Button>
            )}
        </>
    )
}