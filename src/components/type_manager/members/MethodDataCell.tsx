import { Button, Popover, Text } from "@nextui-org/react";
import { useMemo } from "react";
import { PacketJSON } from "../../../misc/events";
import { ProtoMethodInfo } from "../../../misc/proto/il2cpp";
import { IconForDataCellType, DataCellType, iconProps } from "./MemberDataCell";
import { InputCell } from "../class/InputCell";

export function MethodDataCell(methodInfo: PacketJSON<ProtoMethodInfo>) {
    if (!methodInfo?.args) throw "Method info is null!";

    const name = methodInfo.name!;
    const retType = methodInfo.returnType!;

    const argsInputs = useMemo(
        () =>
            Object.entries(methodInfo.args!).map(([argName, argType]) => (
                <div key={argName}>
                    <Text>{argName}</Text>
                    <InputCell type={argType} />
                </div>
            )),
        [methodInfo.args]
    );
    const argsNames = useMemo(
        () => Object.keys(methodInfo.args!),
        [methodInfo.args]
    );

    return (
        <Popover isBordered placement="right" shouldFlip>
            <Popover.Trigger>
                <Button auto color={"primary"} ghost>
                    <IconForDataCellType
                        type={DataCellType.Method}
                        {...iconProps}
                    />

                    <Text className={"px-2"}>
                        {JSON.stringify(retType)} {name} ({argsNames.toString()}
                        )
                    </Text>
                </Button>
            </Popover.Trigger>
            <Popover.Content css={{ px: "$8", py: "$8" }}>
                <div
                    className="flex flex-col shrink gap-3"
                    style={{ maxWidth: "40em" }}
                >
                    {argsInputs}
                </div>
            </Popover.Content>
        </Popover>
    );
}
