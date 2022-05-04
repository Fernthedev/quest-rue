import { CubeFilled } from "@fluentui/react-icons";
import { Collapse, Loading, Radio } from "@nextui-org/react";
import { useEffect, useState, useTransition } from "react";
import { listenToGameOjects } from "../misc/events";

export interface GameObjectsListProps {
    objects: string[],
    // TODO: Make this return GameObject
    onSelect?: (value: string | number) => void,
}
export default function GameObjectsList(props: GameObjectsListProps) {
    // TODO: Clean
    const [objects, setObjects] = useState<string[] | null>(null);

    // https://reactjs.org/docs/hooks-reference.html#usetransition
    const [isPendingGameObjects, loadGameObjects] = useTransition();


    // Listen to game object list events
    useEffect(() => {
        // TODO: Remove, loading test
        loadGameObjects(() => {
            setTimeout(() => {
                setObjects(props.objects)
            }, 2000)
        });

        return listenToGameOjects(objects => {
            loadGameObjects(() => {
                setObjects(objects)
            });
        })
    }, []);

    return (
        <>
            {(isPendingGameObjects || !objects) && (
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



                    {objects?.map(e => (

                        <Collapse contentLeft={
                            <div style={{ display: "flex", flex: "row", justifyContent: "center" }}>
                                { /* The marginTop position fix is so bad */}
                                <Radio squared size={"sm"} value={e} style={{ marginTop: 10 }} />

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