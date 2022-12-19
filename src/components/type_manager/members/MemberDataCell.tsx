import { PlayFilled, TextboxFilled, WrenchFilled } from "@fluentui/react-icons";
import { PacketJSON } from "../../../misc/events";
import { ProtoTypeInfo } from "../../../misc/proto/il2cpp";
import { InputCell } from "../class/InputCell";

export const iconProps = { style: { width: "20px", height: "20px" } };

export enum DataCellType {
    Method = "Method",
    Field = "Field",
    Property = "Property",
}

export interface DataCellProps {
    type: DataCellType;
    name: string;
    args?: Array<string>;
}

export function IconForDataCellType(props: {
    type: DataCellType;
}): JSX.Element {
    switch (props.type) {
        case DataCellType.Method:
            return <PlayFilled {...iconProps} />;
        case DataCellType.Field:
            return <TextboxFilled {...iconProps} />;
        case DataCellType.Property:
            return <WrenchFilled {...iconProps} />;
        default:
            throw "Icon not defined for component data type";
    }
}

export function DataCell(props: DataCellProps) {
    const icon = <IconForDataCellType {...props} />;
    let typeInfo: PacketJSON<ProtoTypeInfo>;
    let name: string;

    switch (props.type) {
        case DataCellType.Method:
            typeInfo = {
                primitiveInfo: ProtoTypeInfo.Primitive.INT,
            };
            name = "method with parameters, idk unfinished";
            break;
        case DataCellType.Field:
            typeInfo = {
                structInfo: {
                    clazz: {
                        namespaze: "UnityEngine",
                        clazz: "Vector3",
                    },
                    fieldOffsets: {
                        0: {
                            name: "x",
                            id: 2398198,
                            type: {
                                primitiveInfo: ProtoTypeInfo.Primitive.FLOAT,
                            },
                        },
                        4: {
                            name: "y",
                            id: 2345265,
                            type: {
                                primitiveInfo: ProtoTypeInfo.Primitive.FLOAT,
                            },
                        },
                        8: {
                            name: "z",
                            id: 4235564,
                            type: {
                                primitiveInfo: ProtoTypeInfo.Primitive.FLOAT,
                            },
                        },
                    },
                },
            };
            name = "some vector field or whatnot";
            break;
        case DataCellType.Property:
            typeInfo = {
                classInfo: {
                    namespaze: "UnityEngine",
                    clazz: "GameObject",
                },
            };
            name = "property but no input cuz pointer";
            break;
        default:
            throw "Property not found";
    }

    return (
        <div
            className="flex grow basis-0 items-center gap-3"
            style={{ minWidth: "25em", maxWidth: "40em" }}
        >
            {icon}
            <div className="flex flex-col">
                {name}
                <InputCell type={typeInfo} />
            </div>
        </div>
    );
}
