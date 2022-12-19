import { Checkbox, Input } from "@nextui-org/react";
import { ProtoTypeInfo } from "../../../misc/proto/il2cpp";


export interface PrimitiveInputCellProps {
    type: ProtoTypeInfo.Primitive;
}

export function PrimitiveInputCell({ type }: PrimitiveInputCellProps) {
    let inputType: string;
    switch (type) {
        case ProtoTypeInfo.Primitive.BOOLEAN:
            inputType = "toggle";
            break;
        case ProtoTypeInfo.Primitive.CHAR:
        case ProtoTypeInfo.Primitive.STRING:
            inputType = "text";
            break;
        case ProtoTypeInfo.Primitive.INT:
        case ProtoTypeInfo.Primitive.LONG:
        case ProtoTypeInfo.Primitive.FLOAT:
        case ProtoTypeInfo.Primitive.DOUBLE:
            inputType = "number";
            break;
        default:
            inputType = "text";
            break;
    }

    if (inputType === "toggle") {
        return <Checkbox />;
    }

    return (
        <Input
            aria-label={type.toString()}
            clearable
            bordered
            type={inputType}
            size="sm"
            width="20em"
            css={{ bg: "$background" }}
        />
    );
}
