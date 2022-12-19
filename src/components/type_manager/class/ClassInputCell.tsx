import { Input } from "@nextui-org/react";
import { PacketJSON } from "../../../misc/events";
import { ProtoClassInfo } from "../../../misc/proto/il2cpp";

export function ClassInputCell(info: PacketJSON<ProtoClassInfo>) {
    // TODO: Do field, prop and method inputs here?
    return (
        <Input
            aria-label={info.clazz}
            readOnly
            bordered
            size="sm"
            width="20em"
            css={{ bg: "$background" }}
        />
    );
}
