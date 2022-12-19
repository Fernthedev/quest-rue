import { PacketJSON } from "../../../misc/events";
import { ProtoPropertyInfo } from "../../../misc/proto/il2cpp";
import { IconForDataCellType, DataCellType, iconProps } from "./MemberDataCell";
import { InputCell } from "../class/InputCell";

export function PropertyDataCell(propInfo: PacketJSON<ProtoPropertyInfo>) {
    const name = propInfo.name;
    const typeInfo = propInfo.type;

    return (
        <div
            className="flex grow basis-0 items-center gap-3"
            style={{ minWidth: "25em", maxWidth: "40em" }}
        >
            <IconForDataCellType type={DataCellType.Property} {...iconProps} />

            <div className="flex flex-col">
                {name}
                <InputCell type={typeInfo!} />
            </div>
        </div>
    );
}
