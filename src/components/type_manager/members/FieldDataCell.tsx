import { PacketJSON } from "../../../misc/events";
import { ProtoFieldInfo } from "../../../misc/proto/il2cpp";
import { IconForDataCellType, DataCellType, iconProps } from "./MemberDataCell";
import { InputCell } from "../class/InputCell";

export function FieldDataCell(fieldInfo: PacketJSON<ProtoFieldInfo>) {
    const name = fieldInfo.name;
    const typeInfo = fieldInfo.type;

    return (
        <div
            className="flex grow basis-0 items-center gap-3"
            style={{ minWidth: "25em", maxWidth: "40em" }}
        >
            <IconForDataCellType type={DataCellType.Field} {...iconProps} />

            <div className="flex flex-col">
                {name}
                <InputCell type={typeInfo!} />
            </div>
        </div>
    );
}
