import { Text } from "@nextui-org/react";
import { useEffect } from "react";
import { getEvents, useListenToEvent, useRequestAndResponsePacket } from "../misc/events";
import { GetComponentsOfGameObjectResult } from "../misc/proto/qrue";

export interface ComponentsManagerProps {

}

export function ComponentsManager(props: ComponentsManagerProps) {
    const selectedObject = useListenToEvent(getEvents().SELECTED_GAME_OBJECT)

    const [components, getComponents] = useRequestAndResponsePacket<GetComponentsOfGameObjectResult>([selectedObject]);

    useEffect(() => {
        if (!selectedObject) return;


        getComponents({
            getComponentsOfGameObject: {
                id: selectedObject.id
            }
        })
    }, [selectedObject]);


    // Professional React developers, I'm sorry
    // Rendering performance is important
    return (
        <>

            {/* FIX BIG TEXT TAKING UP ALL SPACE */}
            <Text size="2em">{selectedObject?.name ?? "NOT FOUND"}</Text>
            {components?.foundComponents.map(c => (
                <Text key={c.pointer.toString()} size="1em">{JSON.stringify(c)}</Text>
            ))}
            {/* <span style={{ fontSize:"1em" }}>{selectedObject ?? ""}</span> */}
        </>
    );
}