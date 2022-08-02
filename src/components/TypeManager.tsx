import { FieldDataCell, PropertyDataCell } from "./DataCell"
import { ProtoClassInfo, ProtoClassDetails } from "../misc/proto/il2cpp"
import { Collapse, Divider, Loading } from "@nextui-org/react"
import { GetClassDetailsResult, GetGameObjectComponentsResult } from "../misc/proto/qrue"
import { GameObjectJSON, PacketJSON, useRequestAndResponsePacket } from "../misc/events"
import { useEffect, useMemo } from "react"
import { useParams } from "react-router-dom";



function AllDetails(details: PacketJSON<ProtoClassDetails>) {
    const name = details?.clazz?.namespaze + " :: " + details?.clazz?.clazz
    const key = `${details?.clazz?.namespaze}${details?.clazz?.clazz}${details?.clazz?.generics}`

    const fields = details?.fields?.map(field => <FieldDataCell key={ field.id} {...field} />)

    const props = details?.properties?.map(prop => (<PropertyDataCell key={`${prop.getterId}${prop.setterId}`} {...prop} />))



    return (
        <div key={key}>
            <Collapse className="xs-collapse" title={name}>
                <div className="flex flex-row flex-wrap items-center gap-3 p-1">
                    {fields}
                    <Divider height={2} />
                    {props}
                </div>
            </Collapse>
        </div>
    )
}

function GetAllDetails(details?: PacketJSON<ProtoClassDetails>) {
    if (!details) return undefined

    const ret: JSX.Element[] = []

    const id = (d: typeof details) => `${d?.clazz?.namespaze}${d?.clazz?.clazz}${d?.clazz?.generics}`
    ret.push(<AllDetails key={id(details)} {...details} />)
    while (details?.parent) {
        details = details?.parent;
        ret.push(<AllDetails key={id(details)} {...details} />)
    }
    return ret
}

const helpers: TypeHelper[] = []

type TypeHelper = (details: PacketJSON<ProtoClassDetails>) => JSX.Element | undefined

export function RegisterHelper(helper: TypeHelper) {
    helpers.push(helper)
}

function GetHelpers(details?: PacketJSON<ProtoClassDetails>) {
    if (!details) return undefined

    return helpers.map(helper => helper(details)).filter(component => component !== undefined);
}

export interface TypeManagerProps {
    objectsMap: Record<number, [GameObjectJSON, symbol]> | undefined
}

type TypeManagerParams = {
    gameObjectAddress?: string
}

export function TypeManager({ objectsMap }: TypeManagerProps) {
    const params = useParams<TypeManagerParams>();
    const [classDetails, getClassDetails] = useRequestAndResponsePacket<GetClassDetailsResult>()

    const [components, getComponents] = useRequestAndResponsePacket<GetGameObjectComponentsResult>();
    const selectedObject = useMemo(() => params.gameObjectAddress && objectsMap ? objectsMap[parseInt(params.gameObjectAddress)][0] : undefined, [objectsMap, params.gameObjectAddress]);

    // get class details each time the info changes
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

    const comp = components?.components && components.components[0];

    useEffect(() => {
        if (!selectedObject || !components) return

        getClassDetails({
            getClassDetails: {
                classInfo: comp?.classInfo
            }
        })
    }, [components])

    if (!classDetails) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full">
                <h3 className="text-center">Requesting details for {comp?.classInfo?.namespaze + " :: " + comp?.classInfo?.clazz} at {params.gameObjectAddress}</h3>
                <Loading size="xl" />
            </div>
        )
    }

    return (
        <div className="flex flex-col" style={{ maxHeight: "100%", marginTop: "-1px" }}>
            {GetHelpers(classDetails?.classDetails)}
            {GetAllDetails(classDetails?.classDetails)}
        </div>
    )
}
