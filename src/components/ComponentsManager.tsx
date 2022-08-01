import { Text, Divider, useInput } from "@nextui-org/react";
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { GameObjectJSON, useRequestAndResponsePacket } from "../misc/events";
import { GetGameObjectComponentsResult, ReadMemoryResult } from "../misc/proto/qrue";
import { DataCell, DataCellType } from "./DataCell"

export interface ComponentsManagerProps {
    objectsMap: Record<number, [GameObjectJSON, symbol]> | undefined
}

type ComponentsManagerParams = {
    gameObjectAddress: string | undefined;
}

export function ComponentsManager({ objectsMap }: ComponentsManagerProps) {
    // TODO: Grab this from useParams
    const params = useParams<ComponentsManagerParams>();
    const selectedObject = useMemo(() => params.gameObjectAddress && objectsMap ? objectsMap[parseInt(params.gameObjectAddress)][0] : undefined, [objectsMap, params.gameObjectAddress]);

    const [components, getComponents] = useRequestAndResponsePacket<GetGameObjectComponentsResult>();
    const [addressData, getAddressData] = useRequestAndResponsePacket<ReadMemoryResult>()

    useEffect(() => {
        if (!selectedObject)
            return;

        console.log(`Got selected object ${selectedObject.address}`)
        
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