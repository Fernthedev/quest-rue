import { CubeFilled } from "@fluentui/react-icons";
import { Collapse, Loading, Radio, Spacer } from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import { isConnected, requestGameObjects } from "../misc/commands";
import { getEvents, useListenToEvent } from "../misc/events";
import { GameObject } from "../misc/proto/qrue";
import { useEffectAsync } from "../misc/utils";

export interface GameObjectsListProps {
    objects: string[],
    // TODO: Make this return GameObject
    onSelect?: (value: GameObjectJSON | undefined) => void,
}

type GameObjectJSON = ReturnType<typeof GameObject.prototype.toObject>;

interface GameObjectRowProps {
    objects: Record<number, GameObjectJSON>,
    go: GameObjectJSON,
    depth?: number
}

function GameObjectRow({ objects, go, depth }: GameObjectRowProps) {
    return (

        <Collapse
            contentLeft={
                <div style={{ display: "flex", flex: "row", justifyContent: "center" }}>
                    { /* The marginTop position fix is so bad */}
                    <Radio isSquared key={go.id} size={"sm"} value={go.id!.toString()} style={{ marginTop: 10 }} label="R" />

                    <CubeFilled title="GameObject" width={"2em"} height={"2em"} />

                </div>
            }
            key={go.id}
            title={go.name}
            bordered={false}
            showArrow={(go.childrenIds?.length ?? 0) > 0}
            disabled={(go.childrenIds?.length ?? 0) <= 0}
        >

        
            {(!depth || depth > 0) && go.childrenIds && (
                <>
                    <Spacer x={5} />
                    <Collapse.Group key={`children-${go.id}`}>

                    {go.childrenIds.map(childId => {
                        const child = objects[childId];

                        if (!child) {
                            console.error(`Did not find child for id ${childId}`)
                            return undefined
                        }


                        return GameObjectRow({ objects: objects, go: child, depth: depth && depth-- })
                    })}

                    </Collapse.Group>
                </>
            )}

        </Collapse>

    );
}

export default function GameObjectsList(props: GameObjectsListProps) {
    // TODO: Clean
    // TODO: Use Suspense?
    // const [objects, setObjects] = useState<string[] | null>(null);
    const objects = useListenToEvent(getEvents().GAMEOBJECTS_LIST_EVENT, [])
    const objectsMap: Record<number, GameObjectJSON> | undefined = useMemo(() => {
        if (!objects) return undefined;

        const obj: Record<number, GameObjectJSON> = {}
        objects?.forEach(o => {
            obj[o.id!] = o;
        });

        return obj;
    }, [objects]);

    console.log(`Received objects ${Array.from(Object.entries(objectsMap ?? []).keys())}`)

    // Listen to game object list events
    // On connect 
    useEffectAsync(async () => {
        console.log("listening for game objects")
        return getEvents().CONNECTED_EVENT.addListener(() => {
            console.log("connected after waiting, requesting objects")
            requestGameObjects();
        });
    }, [])

    return (
        <>
            {!objects && (
                <div style={{ overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", margin: "5vmin", height: "50vh" }}>
                    <Loading size="xl" />
                </div>
            )}

            <Radio.Group onChange={(e) => {
                console.log(`Selected ${e}`)
                props.onSelect && props.onSelect(objectsMap![parseInt(e)])
            }}>


                <Collapse.Group
                    accordion={false}

                    style={{
                        //flexDirection: "column", flexWrap: "nowrap", height: "101%", overflowY: "auto"
                    }}>



                    {objectsMap && objects?.filter(g => !g.parentId).slice(0, 50)?.map(e => GameObjectRow({ objects: objectsMap, go: e, depth: 2 }))}

                </Collapse.Group>

            </Radio.Group>
        </>
    )
}