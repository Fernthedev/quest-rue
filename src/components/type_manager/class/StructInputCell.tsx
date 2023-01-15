import { Button, useTheme } from "@nextui-org/react";
import { PacketJSON } from "../../../misc/events";
import { ProtoStructInfo } from "../../../misc/proto/il2cpp";
import Show from "../../utils/Show";
import { FieldDataCell } from "../members/FieldDataCell";

export function StructInputCell(info: PacketJSON<ProtoStructInfo>) {
    const name = info?.clazz?.namespaze + " :: " + info?.clazz?.clazz;
    const { theme } = useTheme();

    const content = Object.values(info!.fieldOffsets!).map((field) => (
        <FieldDataCell {...field} key={field.id} />
    ));

    return (
        <div className="dropdown">
            <Button tabIndex={0} size="sm" ghost css={{ bg: "$primary" }}>
                {name}
            </Button>
            <Show when={content.length > 0}>
                <div
                    tabIndex={0}
                    className="dropdown-content flex flex-col gap-3 my-1 p-2 rounded-box"
                    style={{
                        backgroundColor: theme?.colors.accents1.value,
                        marginLeft: -2,
                        zIndex: 250,
                    }}
                >
                    {content}
                </div>
            </Show>
        </div>
    );
}
