import { PlayFilled, TextboxFilled, WrenchFilled } from "@fluentui/react-icons";
import { Button, Input, useTheme } from "@nextui-org/react";
import { PacketJSON } from "../misc/events";
import { ProtoTypeInfo, ProtoStructInfo, ProtoClassInfo, ProtoFieldInfo, ProtoPropertyInfo } from "../misc/proto/il2cpp"

interface PrimitiveInputCellProps {
    type: ProtoTypeInfo.Primitive
}
function PrimitiveInputCell({ type }: PrimitiveInputCellProps) {
    let inputType: string
    switch (type) {
        case ProtoTypeInfo.Primitive.BOOLEAN:
        case ProtoTypeInfo.Primitive.CHAR:
        case ProtoTypeInfo.Primitive.STRING:
            inputType = "text"
            break;
        case ProtoTypeInfo.Primitive.INT:
        case ProtoTypeInfo.Primitive.LONG:
        case ProtoTypeInfo.Primitive.FLOAT:
        case ProtoTypeInfo.Primitive.DOUBLE:
            inputType = "number"
            break;
        default:
            inputType = "text"
            break;
    }
    return (
        <Input clearable bordered type={inputType} size="sm" width="20em" css={{ bg: "black" }} />
    )
}

function StructInputCell(info: PacketJSON<ProtoStructInfo>) {
    const name = info?.clazz?.namespaze + " :: " + info?.clazz?.clazz
    const { theme } = useTheme();

    const content = Object.values(info!.fieldOffsets!).map(field => <FieldDataCell {...field} key={field.id} />)

    return (
        <div className="dropdown">
            <Button tabIndex={0} size="sm" css={{ bg: theme?.colors.accents1.value }}>{ name }</Button>
            <div tabIndex={0} className="dropdown-content flex flex-col gap-3 my-1 p-2 rounded-box" style={{ backgroundColor: theme?.colors.accents1.value, marginLeft: -2, zIndex: 250 }}>
                {content}
            </div>
        </div>
    )
}

function ClassInputCell(info: PacketJSON<ProtoClassInfo>) {
    return (
        <Input readOnly bordered size="sm" width="20em" css={{ bg: "black" }}></Input>
    )
}

interface InputCellProps {
    type: PacketJSON<ProtoTypeInfo>
}

function InputCell(props: InputCellProps) {
    if (props.type.primitiveInfo !== undefined)
        return <PrimitiveInputCell type={props.type.primitiveInfo} />
    if (props.type.structInfo !== undefined)
        return <StructInputCell {...props.type.structInfo} />
    if (props.type.classInfo !== undefined)
        return <ClassInputCell {...props.type.classInfo} />

    console.error("Input not defined")
    console.error(JSON.stringify(props.type))
    throw "Input not defined for data type"

}

const iconProps = { style:{ width: "20px", height: "20px" } }

export enum DataCellType {
    Method,
    Field,
    Property
}

export interface DataCellProps {
    type: DataCellType
    name: string
    args?: Array<string>
}

export function DataCell(props: DataCellProps) {
    let icon: JSX.Element
    switch (props.type) {
        case DataCellType.Method:
            icon = PlayFilled(iconProps)
            break
        case DataCellType.Field:
            icon = TextboxFilled(iconProps)
            break
        case DataCellType.Property:
            icon = WrenchFilled(iconProps)
            break
        default:
            throw "Icon not defined for component data type"
    }

    let typeInfo: PacketJSON<ProtoTypeInfo>
    let name: string

    switch (props.type) {
        case DataCellType.Method:
            typeInfo = {
                primitiveInfo: ProtoTypeInfo.Primitive.INT
            }
            name = "method with parameters, idk unfinished"
            break
        case DataCellType.Field:
            typeInfo = {
                structInfo: {
                    clazz: {
                        namespaze: "UnityEngine",
                        clazz: "Vector3"
                    },
                    fieldOffsets: {
                        0: {
                            name: "x",
                            id: 2398198,
                            type: {
                                primitiveInfo: ProtoTypeInfo.Primitive.FLOAT
                            }
                        },
                        4: {
                            name: "y",
                            id: 2345265,
                            type: {
                                primitiveInfo: ProtoTypeInfo.Primitive.FLOAT
                            }
                        },
                        8: {
                            name: "z",
                            id: 4235564,
                            type: {
                                primitiveInfo: ProtoTypeInfo.Primitive.FLOAT
                            }
                        }
                    }
                }
            }
            name = "some vector field or whatnot"
            break
        case DataCellType.Property:
            typeInfo = {
                classInfo: {
                    namespaze: "UnityEngine",
                    clazz: "GameObject"
                }
            }
            name = "property but no input cuz pointer"
            break
        default: 
            throw "Property not found"
    }

    return (
        <div className="flex grow basis-0 items-center gap-3" style={{ minWidth: "25em", maxWidth: "40em" }}>
            {icon}
            <div className="flex flex-col">
                {name}
                <InputCell type={typeInfo} />
            </div>
        </div>
    )
}

export function FieldDataCell(fieldInfo: PacketJSON<ProtoFieldInfo>) {
    const name = fieldInfo.name
    const typeInfo = fieldInfo.type

    return (
        <div className="flex grow basis-0 items-center gap-3" style={{ minWidth: "25em", maxWidth: "40em" }}>
            {TextboxFilled(iconProps)}
            <div className="flex flex-col">
                {name}
                <InputCell type={typeInfo!} />
            </div>
        </div>
    )
}

export function PropertyDataCell(propInfo: PacketJSON<ProtoPropertyInfo>) {
    const name = propInfo.name
    const typeInfo = propInfo.type

    return (
        <div className="flex grow basis-0 items-center gap-3" style={{ minWidth: "25em", maxWidth: "40em" }}>
            {WrenchFilled(iconProps)}
            <div className="flex flex-col">
                {name}
                <InputCell type={typeInfo!} />
            </div>
        </div>
    )
}
