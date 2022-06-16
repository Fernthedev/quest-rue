import { Text } from "@nextui-org/react";
import { useEffect } from "react";
import { getEvents, useListenToEvent, useRequestAndResponsePacket } from "../misc/events";
import { GetComponentsOfGameObjectResult } from "../misc/proto/qrue";

export interface ComponentsManagerProps {

}

export function ComponentsManager(props: ComponentsManagerProps) {
    const selectedObject = useListenToEvent(getEvents().SELECTED_GAME_OBJECT)

    const [id, objectName] = selectedObject ?? [undefined, undefined]

    const [components, getComponents] = useRequestAndResponsePacket<GetComponentsOfGameObjectResult>([id]);

    useEffect(() => {
        if (!id) return;


        getComponents({
            getComponentsOfGameObject: {
                id: id
            }
        })
    }, [id]);


    // Professional React developers, I'm sorry
    // Rendering performance is important
    return (
        <>

            {/* FIX BIG TEXT TAKING UP ALL SPACE */}
            <Text size="2em">{objectName ?? ""}</Text>
            {components?.foundComponents.map(c => (
                <Text key={c.pointer.toString()} size="1em">{JSON.stringify(c)}</Text>
            ))}
            {/* <span style={{ fontSize:"1em" }}>{selectedObject ?? ""}</span> */}
        </>
    );
}