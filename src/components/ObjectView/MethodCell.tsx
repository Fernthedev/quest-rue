import { Show, For, createEffect, createMemo } from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../misc/events";
import { InvokeMethodResult } from "../../misc/proto/qrue";
import { ProtoMethodInfo } from "../../misc/proto/il2cpp";
import {
    createUpdatingSignal,
    getGenerics,
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
    spanFn: SpanFn;
    highlight: boolean;
}) {
    // update element size
    let element: HTMLDivElement | undefined;
    createEffect(() => {
        if (element) props.spanFn(element, props.colSize);
    });

    const args = createMemo(() =>
        Object.entries(props.method.args).concat([
            ["ret", props.method.returnType!],
        ])
    );

    const [latestArgs, setLatestArgs] = createUpdatingSignal(args, {
        equals: false,
    });

    const argInputs = createMemo(() => args().slice(0, -1).map(() => ""));
    const [result, resultLoading, runMethod] =
        useRequestAndResponsePacket<InvokeMethodResult>();
    function run() {
        const genericsData = genericInputs().map((str) =>
            stringToProtoType(str)
        );
        setLatestArgs((prev) => {
            genericArgs().forEach(([, argsIndex], genericInputsIndex) => {
                if (argsIndex != -1)
                    prev[argsIndex][1] = genericsData[genericInputsIndex];
            });
            return prev;
        });
        const argsData = argInputs().map((str, index) =>
            stringToProtoData(str, latestArgs()[index][1])
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

    const genericArgs = createMemo(() => {
        // unique on genericParameterIndex
        const indices = new Set<number>();
        const ret = args()
            .map(([, t]) => t)
            .flatMap((t, i) => getGenerics(i, t))
            .filter(([t]) => {
                if (t.Info?.$case != "genericInfo") {
                    console.log("bad type", t, args());
                    throw "Non generic ProtoTypeInfo in generics";
                }
                const index: number = t.Info.genericInfo.genericIndex;
                if (indices.has(index)) return false;
                indices.add(index);
                return true;
            });
        return ret;
    });
    const genericInputs = createMemo(() => genericArgs().map(() => ""));

    createEffect(() => {
        const resultData = result();
        if (!resultData?.error) return;

        toast.error(
            `${props.method.name} threw an exception: ${resultData.error}`
        );
    });

    return (
        <span
            ref={element}
            class={`font-mono method overflow-hidden ${styles.method} ${styles.gridElement}`}
        >
            <text
                class={`pr-1 pl-2 -mx-2 ${
                    props.highlight ? styles.highlighted : ""
                }`}
            >
                {props.method.name}
            </text>
            <Show when={genericArgs().length > 0}>
                {"<"}
                <For each={genericArgs()}>
                    {([type], index) => (
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
            <For each={latestArgs().slice(0, -1)}>
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
                type={latestArgs().at(-1)![1]}
            />
        </span>
    );
}
