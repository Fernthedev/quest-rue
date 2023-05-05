import { For, createEffect, createMemo } from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../misc/events";
import { InvokeMethodResult } from "../../misc/proto/qrue";
import { ProtoMethodInfo } from "../../misc/proto/il2cpp";
import { protoDataToString, stringToProtoData } from "../../misc/utils";
import InputCell, { ActionButton } from "../InputCell";
import { refreshSpan } from "./ObjectView";

export function MethodCell(props: {
    method: PacketJSON<ProtoMethodInfo>;
    colSize: number;
    maxCols: number;
    address: number;
}) {
    let element: HTMLDivElement | undefined;
    createEffect(() => refreshSpan(element!, props.colSize, props.maxCols));
    const args = createMemo(() =>
        Object.keys(props.method.args ?? {}).map(() => "")
    );
    const [result, resultLoading, runMethod] =
        useRequestAndResponsePacket<InvokeMethodResult>();
    function run() {
        const argsData = args().map((str, index) =>
            stringToProtoData(str, Object.values(props.method.args!)[index])
        );
        runMethod({
            invokeMethod: {
                methodId: props.method.id,
                objectAddress: props.address,
                args: argsData,
            },
        });
    }
    return (
        <span ref={element} class="font-mono">
            {props.method.name + " ("}
            <For each={Object.entries(props.method.args ?? {})}>
                {([name, type], index) => (
                    <InputCell
                        input
                        placeholder={name}
                        type={type!}
                        // False positive
                        // eslint-disable-next-line solid/reactivity
                        onInput={(str) => (args()[index()] = str)}
                    />
                )}
            </For>
            {") "}
            <ActionButton
                class={"small-button"}
                onClick={run}
                loading={resultLoading()}
                img="enter.svg"
            />
            <InputCell
                output
                value={protoDataToString(result()?.result)}
                type={props.method.returnType!}
            />
        </span>
    );
}
