import { PacketJSON } from "../../../misc/events";
import { ProtoTypeInfo } from "../../../misc/proto/il2cpp";
import { ClassInputCell } from "./ClassInputCell";
import { StructInputCell } from "./StructInputCell";
import { PrimitiveInputCell } from "./PrimitiveInputCell";

export interface InputCellProps {
    type: PacketJSON<ProtoTypeInfo>;
}

export function InputCell(props: InputCellProps) {
    if (props.type.primitiveInfo !== undefined)
        return <PrimitiveInputCell type={props.type.primitiveInfo} />;
    if (props.type.structInfo !== undefined)
        return <StructInputCell {...props.type.structInfo} />;
    if (props.type.classInfo !== undefined)
        return <ClassInputCell {...props.type.classInfo} />;

    console.error("Input not defined");
    console.error(JSON.stringify(props.type));
    throw "Input not defined for data type";
}
