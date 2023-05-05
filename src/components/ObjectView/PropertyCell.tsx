import { Accessor, Show, createEffect, createSignal } from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../misc/events";
import { InvokeMethodResult } from "../../misc/proto/qrue";
import { ProtoPropertyInfo } from "../../misc/proto/il2cpp";
import { protoDataToString, stringToProtoData } from "../../misc/utils";
import InputCell, { ActionButton } from "../InputCell";
import { refreshSpan } from "./ObjectView";
import toast from "solid-toast";

export function PropertyCell(props: {
    prop: PacketJSON<ProtoPropertyInfo>;
    colSize: number;
    maxCols: number;
    address: number;
}) {
    let element: HTMLDivElement | undefined;
    createEffect(() => refreshSpan(element!, props.colSize, props.maxCols));
    const [value, valueLoading, requestGet] =
        useRequestAndResponsePacket<InvokeMethodResult>();
    function get() {
        requestGet({
            invokeMethod: {
                methodId: props.prop.getterId,
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
            invokeMethod: {
                methodId: props.prop.setterId,
                objectAddress: props.address,
                args: [protoData],
            },
        });
    }
    createEffect(() => setInputValue(protoDataToString(value()?.result)));

    const errorHandler = (result: Accessor<{ error?: string } | undefined>) => {
        const resultData = result()
        if (!resultData?.error) return;

        toast.error(`Property exception error: ${resultData.error}`);
    };

    // Error handle
    createEffect(() => {
        errorHandler(value)
    });
    createEffect(() => {
        errorHandler(valueSetter);
    });

    return (
        <span ref={element} class="font-mono">
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
                />
            </Show>
            <Show when={props.prop.setterId}>
                <ActionButton
                    class={"small-button"}
                    onClick={set}
                    loading={valueLoading() || valueSetting()}
                    img="enter.svg"
                />
            </Show>
        </span>
    );
}
