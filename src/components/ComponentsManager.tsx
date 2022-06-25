import { Text, Input, Button } from "@nextui-org/react";
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
            <div className="grid grid-flow-row gap-12 pl-8">
                <div>
                <Text b h2>Buttons!</Text>
                <div
                    className="grid grid-flow-row
                  grid-cols-2
                  gap-4">
                    {components?.foundComponents.map(c => (
                        <Text key={c.pointer.toString()} size="1rem">{JSON.stringify(c)}</Text>
                    ))}
                    <Input label={"a"} clearable bordered />

                    <Input label={"b"} clearable bordered />
                    <Input label={"c"} clearable bordered />
                    <Input label={"d"} clearable bordered />
                    <Input label={"e"} clearable bordered />
                    </div>
                </div>
                <div>
                <Text b h2>Buttons!</Text>
                <div
                    className="grid grid-flow-row
                  grid-cols-2
                  gap-4">
                    <Button size="sm">Some button</Button>
                    <Button size="sm">Some button2</Button>
                    <Button size="sm">Some button3</Button>
                    </div>
                </div>
            </div>

            <Text className="center" size="2rem">{selectedObject?.name ?? "NOT FOUND"}</Text>
            {/* <span style={{ fontSize:"1em" }}>{selectedObject ?? ""}</span> */}
        </>
    );
}