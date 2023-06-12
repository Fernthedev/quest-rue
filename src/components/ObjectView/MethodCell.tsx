import { Show, For, createEffect, createMemo } from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../misc/events";
import { InvokeMethodResult } from "../../misc/proto/qrue";
import { ProtoMethodInfo, ProtoTypeInfo } from "../../misc/proto/il2cpp";
import {
    createUpdatingSignal,
    getGenerics,
    getInstantiation,
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

    function updateGenerics(requireValid: boolean) {
        const genericsData = genericInputs().map<[number, ProtoTypeInfo]>(
            ([index, str]) => [
                index,
                stringToProtoType(str, requireValid) ??
                    genericArgsMap().get(index)!,
            ]
        );
        const generics = genericsData.reduce(
            (map, [index, type]) => map.set(index, type),
            new Map<number, ProtoTypeInfo>()
        );
        // set from base args, not latest args
        setLatestArgs(
            args().map<[string, ProtoTypeInfo]>(([s, type]) => [
                s,
                getInstantiation(type, generics),
            ])
        );
        console.log(latestArgs());
        return genericsData;
    }

    const argInputs = createMemo(() =>
        args()
            .slice(0, -1)
            .map(() => "")
    );
    const [result, resultLoading, runMethod] =
        useRequestAndResponsePacket<InvokeMethodResult>();

    function run() {
        const genericsData = updateGenerics(true);
        const argsData = argInputs().map((str, index) =>
            stringToProtoData(str, latestArgs()[index][1])
        );
        runMethod({
            $case: "invokeMethod",
            invokeMethod: {
                methodId: props.method.id,
                objectAddress: props.address,
                generics: genericsData.map(([, t]) => t),
                args: argsData,
            },
        });
    }

    const genericArgsMap = createMemo(() => {
        // unique on genericParameterIndex
        return (
            args()
                .map(([, t]) => t)
                .flatMap((t) => getGenerics(t))
                // eslint-disable-next-line solid/reactivity
                .reduce((map, t) => {
                    if (t.Info?.$case != "genericInfo") {
                        console.log("bad type", t, args());
                        throw "Non generic ProtoTypeInfo in generics";
                    }
                    const index = t.Info.genericInfo.genericIndex;
                    return map.set(index, t);
                }, new Map<number, ProtoTypeInfo>())
        );
    });
    const genericArgs = createMemo(() => Array.from(genericArgsMap().values()));
    const genericInputs = createMemo(() =>
        genericArgs().map<[number, string]>((t: ProtoTypeInfo) => [
            t.Info?.$case == "genericInfo"
                ? t.Info.genericInfo.genericIndex
                : -1,
            "",
        ])
    );

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
            class={`font-mono method overflow-visible ${styles.method} ${styles.gridElement}`}
            classList={{ [styles.highlighted]: props.highlight }}
        >
            <text class="pr-1 pl-2 -mx-2">{props.method.name}</text>
            <Show when={genericArgs().length > 0}>
                {"<"}
                <For each={genericArgs()}>
                    {(type, index) => (
                        <InputCell
                            input
                            type={type}
                            onInput={(str) =>
                                (genericInputs()[index()][1] = str)
                            }
                            onFocusExit={() => updateGenerics(false)}
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
