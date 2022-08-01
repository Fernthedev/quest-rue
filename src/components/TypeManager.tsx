import { FieldDataCell, PropertyDataCell } from "./DataCell"
import { ProtoClassInfo, ProtoClassDetails } from "../misc/proto/il2cpp"
import { Collapse, Divider, Loading } from "@nextui-org/react"
import { GetClassDetailsResult, PacketWrapper } from "../misc/proto/qrue"
import { useRequestAndResponsePacket } from "../misc/events"
import { useEffect, useMemo } from "react"
import { useParams } from "react-router-dom";

function AllDetails(details: ProtoClassDetails) {
    const fields = details.fields.map(field => FieldDataCell(field))
    
    const props = details.properties.map(prop => PropertyDataCell(prop))

    const name = details.clazz.namespaze + " :: " + details.clazz.clazz
    
    return (
        <div key={name}>
            <Collapse className="xs-collapse" title={name}>
                <div className="flex flex-row flex-wrap items-center gap-3 p-1">
                    {fields}
                    <Divider height={2}/>
                    {props}
                </div>
            </Collapse>
        </div>
    )
}

function GetAllDetails(details?: ProtoClassDetails) {
    if (!details) return undefined

    const ret = []

    ret.push(AllDetails(details))
    while (details.has_parent) {
        details = details.parent
        ret.push(AllDetails(details))
    }
    return ret
}

const helpers: TypeHelper[] = []

type TypeHelper = (details: ProtoClassDetails) => JSX.Element | undefined

export function RegisterHelper(helper: TypeHelper) {
    helpers.push(helper)
}

function GetHelpers(details?: ProtoClassDetails) {
    if (!details) return undefined

    return helpers.map(helper => helper(details)).filter(component => component !== undefined);
}

export interface TypeManagerProps {
    info: ProtoClassInfo
}

type TypeManagerParams = {
    gameObjectAddress?: string
}

export function TypeManager(props: TypeManagerProps) {
    const [ classDetails, getClassDetails ] = useRequestAndResponsePacket<GetClassDetailsResult>()
    const params = useParams<TypeManagerParams>();

    // get class details each time the info changes
    useEffect(() => {
        if (!props.info) return

        getClassDetails({
            getClassDetails: {
                classInfo: props.info
            }
        })
    }, [props.info])
    
    if (!classDetails) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full">
                <h3 className="text-center">Requesting details for {props.info.namespaze + " :: " + props.info.clazz} at {params.gameObjectAddress}</h3>
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
