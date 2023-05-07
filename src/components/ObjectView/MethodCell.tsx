import { Show, For, createEffect, createMemo, createRenderEffect } from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../misc/events";
import { InvokeMethodResult } from "../../misc/proto/qrue";
import { ProtoMethodInfo } from "../../misc/proto/il2cpp";
import {
    getAllGenerics,
    protoDataToString,
    stringToProtoData,
    stringToProtoType,
} from "../../misc/utils";
import InputCell, { ActionButton } from "../InputCell";
import toast from "solid-toast";

import styles from "./ObjectView.module.css";
import { SpanFn } from "./ObjectView";

export function MethodCell(props: {
    method: PacketJSON<ProtoMethodInfo>;
    colSize: number;
    address: bigint;
    spanFn: SpanFn
}) {
    let element: HTMLDivElement | undefined;
    createRenderEffect(() => props.spanFn(element!, props.colSize));

    const args = createMemo(() => Object.entries(props.method.args ?? {}));

    const argInputs = createMemo(() => args().map(() => ""));
    const [result, resultLoading, runMethod] =
        useRequestAndResponsePacket<InvokeMethodResult>();
    function run() {
        const argsData = argInputs().map((str, index) =>
            stringToProtoData(str, Object.values(props.method.args!)[index])
        );
        const genericsData = genericInputs().map((str) =>
            stringToProtoType(str)
        );
        runMethod({
            $case: "invokeMethod",
            invokeMethod: {
                methodId: props.method.id,
                objectAddress: props.address,
                generics: genericsData,
                args: argsData,
            },
        });
    }

    const genericArgs = createMemo(() =>
        args()
            .map(([, t]) => t)
            .concat([props.method.returnType!])
            .flatMap((t) => getAllGenerics(t))
    );
    const genericInputs = createMemo(() => genericArgs().map(() => ""));

    createEffect(() => {
        const resultData = result();
        if (!resultData?.error) return;

        toast.error(`Method exception error: ${resultData.error}`);
    });

    return (
        <span ref={element} class={`font-mono method ${styles.method}`}>
            {props.method.name + " "}
            <Show when={genericArgs().length > 0}>
                {"<"}
                <For each={genericArgs()}>
                    {(type, index) => (
                        <InputCell
                            input
                            type={type}
                            // False positive
                            // eslint-disable-next-line solid/reactivity
                            onInput={(str) => (genericInputs()[index()] = str)}
                        />
                    )}
                </For>
                {">"}
            </Show>
            {"("}
            <For each={Object.entries(props.method.args ?? {})}>
                {([name, type], index) => (
                    <InputCell
                        input
                        placeholder={name}
                        type={type!}
                        // False positive
                        // eslint-disable-next-line solid/reactivity
                        onInput={(str) => (argInputs()[index()] = str)}
                    />
                )}
            </For>
            {") "}
            <ActionButton
                class={"small-button"}
                onClick={run}
                loading={resultLoading()}
                img="enter.svg"
                tooltip="Invoke"
            />
            <InputCell
                output
                value={protoDataToString(result()?.result)}
                type={props.method.returnType!}
            />
        </span>
    );
}
