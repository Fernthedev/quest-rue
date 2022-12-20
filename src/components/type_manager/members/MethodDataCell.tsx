import { Button, Popover, Text, Textarea } from "@nextui-org/react";
import { useMemo } from "react";
import { PacketJSON } from "../../../misc/events";
import { ProtoMethodInfo } from "../../../misc/proto/il2cpp";
import { IconForDataCellType, DataCellType, iconProps } from "./MemberDataCell";
import { InputCell } from "../class/InputCell";
import NavBar, { NavButton } from "../../utils/NavBar";

export function MethodDataCell(methodInfo: PacketJSON<ProtoMethodInfo>) {
    const name = methodInfo.name!;
    const retType = methodInfo.returnType!;

    const argsInputs = useMemo(
        () =>
            methodInfo.args &&
            Object.entries(methodInfo.args!).map(([argName, argType]) => (
                <div key={argName}>
                    <Text>{argName}</Text>
                    <InputCell type={argType} />
                </div>
            )),
        [methodInfo.args]
    );
    const argsNames = useMemo(
        () => methodInfo.args && Object.keys(methodInfo.args),
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
                        {name} ({argsNames?.toString()})
                    </Text>
                    <span>{JSON.stringify(retType)}</span>
                </Button>
            </Popover.Trigger>
            <Popover.Content css={{ px: "$8", py: "$8" }}>
                <NavBar active={0}>
                    <NavButton label="UI">
                        <div
                            className="flex flex-col shrink gap-3"
                            style={{ maxWidth: "40em" }}
                        >
                            {argsInputs}
                        </div>
                    </NavButton>
                    <NavButton label="JSON">
                        <Textarea
                            bordered
                            fullWidth
                            label={"JSON"}
                            animated={false}
                            minRows={8}
                            maxRows={20}
                            css={{ bg: "$background", padding: "$4" }}
                        />
                    </NavButton>
                </NavBar>
            </Popover.Content>
        </Popover>
    );
}
