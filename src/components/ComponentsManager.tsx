import { Text, Input, Button, useInput } from "@nextui-org/react";
import { useRef } from "react";
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
                <Text b h2>Buttons!</Text>
                <div
                    className="grid grid-flow-row
                  grid-cols-2
                  gap-4">
                    {components?.components.map(c => (
                        <Text key={c.address.toString()} size="1rem">{JSON.stringify(c)}</Text>
                    ))}
                        <Input status={"primary"} label={"Pointer Address"} clearable bordered onChange={addressInput.bindings.onChange} value={addressInput.bindings.value} />

                        <Input status={"secondary"} label={"Size"} clearable bordered type="number" onChange={sizeInput.bindings.onChange} value={sizeInput.bindings.value} />
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
                        <Button color="success" size="sm" onPress={() => {
                            console.log("Reading address")

                            getAddressData({
                                readMemory: {
                                    address: parseInt(addressInput.value),
                                    size: parseInt(sizeInput.value)
                                }
                            });
                        }}
            >Read Address</Button>
                    <Button size="sm">Some button2</Button>
                    <Button size="sm">Some button3</Button>
                    </div>
                </div>
            </div>

            <Text className="center" size="2rem">{selectedObject?.name ?? "NOT FOUND"}</Text>
            <Text className="center text-center" size="1.0rem">Address Data address:{addressData?.address} status: {addressData?.status} data:{addressData?.data} </Text>
            
            {/* <span style={{ fontSize:"1em" }}>{selectedObject ?? ""}</span> */}
        </>
    );
}