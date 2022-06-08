import { CubeFilled } from "@fluentui/react-icons";
import { Collapse, Loading, Radio } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { isConnected, requestGameObjects } from "../misc/commands";
import { getEvents, useListenToEvent } from "../misc/events";
import { useEffectAsync } from "../misc/utils";

export interface GameObjectsListProps {
    objects: string[],
    // TODO: Make this return GameObject
    onSelect?: (value: string | number) => void,
}
export default function GameObjectsList(props: GameObjectsListProps) {
    // TODO: Clean
    // TODO: Use Suspense?
    // const [objects, setObjects] = useState<string[] | null>(null);
    const objects = useListenToEvent(getEvents().GAMEOBJECTS_LIST_EVENT, [])
    console.log(`Received objects ${objects}`)

    // Listen to game object list events
    // On connect 
    useEffectAsync(async () => {
        console.log("listening for game objects")

        const connected = await isConnected();
        
        if (connected) {
            console.log("connected, requesting objects")
            requestGameObjects().catch((e) => console.error(`Error: ${e}`));
        } else {
            console.log("Waiting for connection")
        }

        
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

            <Radio.Group onChange={props.onSelect}>


                <Collapse.Group
                    accordion={false}

                    style={{
                        //flexDirection: "column", flexWrap: "nowrap", height: "101%", overflowY: "auto"
                    }}>



                    {objects?.slice(0,20)?.map(e => (

                        <Collapse contentLeft={
                            <div style={{ display: "flex", flex: "row", justifyContent: "center" }}>
                                { /* The marginTop position fix is so bad */}
                                <Radio isSquared size={"sm"} value={e} style={{ marginTop: 10 }} label="R"/>

                                <CubeFilled title="GameObject" width={"2em"} height={"2em"} />

                            </div>
                        } key={e} title={e} bordered={false}>

                        </Collapse>
                    ))}

                </Collapse.Group>

            </Radio.Group>
        </>
    )
}