import { PlayFilled, TextboxFilled, WrenchFilled } from "@fluentui/react-icons";
import { Button, Input, useTheme } from "@nextui-org/react";
import { ProtoTypeInfo, ProtoStructInfo, ProtoClassInfo } from "../misc/proto/il2cpp"

function PrimitiveInputCell(type: ProtoTypeInfo.Primitive) {
    let inputType
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
        <div>
            <Input clearable bordered type={inputType} size="sm" width="20em" css={{ bg: "black" }}></Input>
        </div>
    )
}

function StructInputCell(info: ProtoStructInfo) {
    const name = info.clazz.namespaze + " :: " + info.clazz.clazz
    const { theme } = useTheme();

    const content = []
    for (let field of info.fieldOffsets) {
        content.push(InputCell({ type: field[1] }))
    }

    return (
        <div className="dropdown">
            <Button tabIndex={0} size="sm" css={{ bg: theme?.colors.accents1.value }}>{ name }</Button>
            <div tabIndex={0} className="dropdown-content flex flex-col gap-3 my-1 p-2 rounded-box" style={{ backgroundColor: theme?.colors.accents1.value, marginLeft: -2, zIndex: 250 }}>
                {content}
            </div>
        </div>
    )
}

function ClassInputCell(info: ProtoClassInfo) {
    return (
        <div>
            <Input readOnly bordered size="sm" width="20em" css={{ bg: "black" }}></Input>
        </div>
    )
}

interface InputCellProps {
    type: ProtoTypeInfo
}

function InputCell(props: InputCellProps) {
    switch (props.type.Info) {
        case "primitiveInfo":
            return PrimitiveInputCell(props.type.primitiveInfo)
        case "structInfo":
            return StructInputCell(props.type.structInfo)
        case "classInfo":
            return ClassInputCell(props.type.classInfo)
        default:
            throw "Input not defined for data type"
    }
}

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
    const iconProps = { style:{ width: "20px", height: "20px" } }

    let icon
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

    let typeInfo
    let name
    switch (props.type) {
        case DataCellType.Method:
            typeInfo = ProtoTypeInfo.fromObject({
                primitiveInfo: ProtoTypeInfo.Primitive.INT
            })
            name = "method with parameters, idk unfinished"
            break
        case DataCellType.Field:
            typeInfo = ProtoTypeInfo.fromObject({
                structInfo: {
                    clazz: {
                        namespaze: "UnityEngine",
                        clazz: "Vector3"
                    },
                    fieldOffsets: {
                        0: {
                            primitiveInfo: ProtoTypeInfo.Primitive.FLOAT
                        },
                        4: {
                            primitiveInfo: ProtoTypeInfo.Primitive.FLOAT
                        },
                        8: {
                            primitiveInfo: ProtoTypeInfo.Primitive.FLOAT
                        }
                    }
                }
            })
            name = "some vector field or whatnot"
            break
        case DataCellType.Property:
            typeInfo = ProtoTypeInfo.fromObject({
                classInfo: {
                    namespaze: "UnityEngine",
                    clazz: "GameObject"
                }
            })
            name = "property but no input cuz pointer"
            break
    }

    return (
        <div className="flex grow basis-0 items-center gap-3" style={{ minWidth: "25em", maxWidth: "40em" }}>
            {icon}
            <div className="flex flex-col">
                {name}
                <InputCell type={typeInfo}></InputCell>
            </div>
        </div>
    )
}
