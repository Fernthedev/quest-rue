import { CubeFilled } from "@fluentui/react-icons";
import { Collapse, Loading, Radio } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { isConnected, requestGameObjects } from "../misc/commands";
import { listenToConnect, listenToGameObjects } from "../misc/events";
import { useEffectAsync } from "../misc/utils";

export interface GameObjectsListProps {
    objects: string[],
    // TODO: Make this return GameObject
    onSelect?: (value: string | number) => void,
}
export default function GameObjectsList(props: GameObjectsListProps) {
    // TODO: Clean
    // TODO: Use Suspense?
    const [objects, setObjects] = useState<string[] | null>(null);

    // Listen to game object list events
    useEffect(() => {
        console.log("listening for game objects")
        return listenToGameObjects(objects => {
            console.log(`Received objects ${objects}`)
            setObjects(objects)
        })
    }, []);


    // On connect 
    useEffectAsync(async () => {
        const connected = await isConnected();
        
        if (connected) {
            console.log("connected, requesting objects")
            requestGameObjects().catch((e) => console.error(`Error: ${e}`));
        } else {
            console.log("Waiting for connection")
            return listenToConnect((_) => {
                console.log("connected after waiting, requesting objects")
                try {
                    requestGameObjects();
                } catch (e) {
                    console.error(`Error: ${e}`);
                }
            });
        }
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