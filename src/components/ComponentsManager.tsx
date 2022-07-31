import { Text, Divider, useInput } from "@nextui-org/react";
import { useEffect } from "react";
import { getEvents, useListenToEvent, useRequestAndResponsePacket } from "../misc/events";
import { GetGameObjectComponentsResult, ReadMemoryResult } from "../misc/proto/qrue";
import { DataCell, DataCellType } from "./DataCell"

export interface ComponentsManagerProps {

}

export function ComponentsManager(props: ComponentsManagerProps) {
    // TODO: Grab this from useParams
    const selectedObject = useListenToEvent(getEvents().SELECTED_GAME_OBJECT)

    const [components, getComponents] = useRequestAndResponsePacket<GetGameObjectComponentsResult>();
    const [addressData, getAddressData] = useRequestAndResponsePacket<ReadMemoryResult>()

    useEffect(() => {
        if (!selectedObject)
            return;

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
        <div className="flex flex-col">
            {/* FIX BIG TEXT TAKING UP ALL SPACE */}
            <div>
                <Text b h2>{selectedObject?.name ?? "NOT FOUND"}</Text>
            </div>
            <div className="flex flex-row flex-wrap items-center gap-3">
                {/* <Button color="success" size="sm" onPress={() => {
                    console.log("Reading address")

                    getAddressData({
                        readMemory: {
                            address: parseInt(addressInput.value),
                            size: parseInt(sizeInput.value)
                        }
                    });
                }}>Read Address</Button> */}
                <DataCell name="something" type={DataCellType.Method}></DataCell>
                <DataCell name="something" type={DataCellType.Field}></DataCell>
                <DataCell name="something" type={DataCellType.Method}></DataCell>
                <DataCell name="something" type={DataCellType.Method}></DataCell>
                <DataCell name="something" type={DataCellType.Field}></DataCell>
                <DataCell name="something" type={DataCellType.Property}></DataCell>
                <DataCell name="something" type={DataCellType.Property}></DataCell>
            </div>

            <Text className="center text-center" size="1.0rem">Address:{addressData?.address} Status: {addressData?.status} Data:{addressData?.data} </Text>

            {/* <span style={{ fontSize:"1em" }}>{selectedObject ?? ""}</span> */}
        </div>
    );
}