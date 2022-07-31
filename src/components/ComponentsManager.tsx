import { Text, Input, Button, useInput } from "@nextui-org/react";
import { useEffect } from "react";
import { getEvents, useListenToEvent, useRequestAndResponsePacket } from "../misc/events";
import { GetGameObjectComponentsResult, ReadMemoryResult } from "../misc/proto/qrue";

export interface ComponentsManagerProps {

}

export function ComponentsManager(props: ComponentsManagerProps) {
    const selectedObject = useListenToEvent(getEvents().SELECTED_GAME_OBJECT)

    const [components, getComponents] = useRequestAndResponsePacket<GetGameObjectComponentsResult>();
    const [addressData, getAddressData] = useRequestAndResponsePacket <ReadMemoryResult>()

    useEffect(() => {
        if (!selectedObject) return;


        getComponents({
            getGameObjectComponents: {
                address: selectedObject.address
            }
        })
    }, [selectedObject]);

    const addressInput = useInput("");
    const sizeInput = useInput("1");

    // Professional React developers, I'm sorry
    // Rendering performance is important
    return (
        <>

            {/* FIX BIG TEXT TAKING UP ALL SPACE */}
            <div className="grid grid-flow-row gap-12 pl-8">
                <div>
                    <Text b h2>{selectedObject?.name ?? "NOT FOUND"}</Text>
                    <div className="grid grid-flow-row grid-cols-2 gap-4">
                        {components?.components.map(c => (
                            <Text key={c.address.toString()} size="1rem">{JSON.stringify(c)}</Text>
                        ))}
                        </div>
                    </div>
                <div>
                <div className="grid grid-flow-row grid-cols-2 gap-4">
                    <Button color="success" size="sm" onPress={() => {
                        console.log("Reading address")

                        getAddressData({
                            readMemory: {
                                address: parseInt(addressInput.value),
                                size: parseInt(sizeInput.value)
                            }
                        });
                    }}>Read Address</Button>
                    <Button size="sm">Some button2</Button>
                    <Button size="sm">Some button3</Button>
                    </div>
                </div>
            </div>

            <Text className="center text-center" size="1.0rem">Address:{addressData?.address} Status: {addressData?.status} Data:{addressData?.data} </Text>
            
            {/* <span style={{ fontSize:"1em" }}>{selectedObject ?? ""}</span> */}
        </>
    );
}