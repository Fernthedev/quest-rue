import {
    Accessor,
    Show,
    createEffect,
    createMemo,
    createSignal,
} from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../misc/events";
import { InvokeMethodResult } from "../../misc/proto/qrue";
import { ProtoPropertyInfo } from "../../misc/proto/il2cpp";
import { protoDataToString, stringToProtoData } from "../../misc/utils";
import InputCell, { ActionButton } from "../InputCell";
import toast from "solid-toast";

import styles from "./ObjectView.module.css";
import { SpanFn } from "./ObjectView";

export function PropertyCell(props: {
    prop: PacketJSON<ProtoPropertyInfo>;
    colSize: number;
    address: bigint;
    spanFn: SpanFn;
}) {
    let element: HTMLDivElement | undefined;
    createEffect(() => {
        if (element) props.spanFn(element, props.colSize);
    });

    const [value, valueLoading, requestGet] =
        useRequestAndResponsePacket<InvokeMethodResult>();
    function get() {
        requestGet({
            $case: "invokeMethod",
            invokeMethod: {
                generics: [],
                methodId: props.prop.getterId!,
                objectAddress: props.address,
                args: [],
            },
        });
    }
    const [valueSetter, valueSetting, requestSet] =
        useRequestAndResponsePacket<InvokeMethodResult>();
    const [inputValue, setInputValue] = createSignal<string>("");
    function set() {
        const protoData = stringToProtoData(inputValue(), props.prop.type!);
        requestSet({
            $case: "invokeMethod",
            invokeMethod: {
                generics: [],
                methodId: props.prop.setterId!,
                objectAddress: props.address,
                args: [protoData],
            },
        });
    }
    createEffect(() => setInputValue(protoDataToString(value()?.result)));

    const errorHandler = (result: Accessor<{ error?: string } | undefined>) => {
        const resultData = result();
        if (!resultData?.error) return;

        toast.error(`Property exception error: ${resultData.error}`);
    };

    // Error handle
    createEffect(() => {
        errorHandler(value);
    });
    createEffect(() => {
        errorHandler(valueSetter);
    });

    const propertyGetter = createMemo(
        () => props.prop.getterId && styles.propertyGetter
    );
    const propertySetter = createMemo(
        () => props.prop.setterId && styles.propertySetter
    );
    const propertyBoth = createMemo(
        () => props.prop.getterId && props.prop.setterId && styles.propertyBoth
    );

    return (
        <span
            ref={element}
            class={`font-mono ${
                propertyBoth() || propertySetter() || propertyGetter()
            } ${styles.gridElement}`}
        >
            {props.prop.name + " = "}
            <InputCell
                input={Boolean(props.prop.setterId)}
                output
                onInput={setInputValue}
                value={inputValue()}
                type={props.prop.type!}
            />
            <Show when={props.prop.getterId}>
                <ActionButton
                    class={"small-button"}
                    onClick={get}
                    loading={valueLoading() || valueSetting()}
                    img="refresh.svg"
                    tooltip="Refresh"
                />
            </Show>
            <Show when={props.prop.setterId}>
                <ActionButton
                    class={"small-button"}
                    onClick={set}
                    loading={valueLoading() || valueSetting()}
                    img="enter.svg"
                    tooltip="Set"
                />
            </Show>
        </span>
    );
}
