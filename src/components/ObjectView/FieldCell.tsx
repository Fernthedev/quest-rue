import { createEffect, onMount } from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../misc/events";
import { GetFieldResult, SetFieldResult } from "../../misc/proto/qrue";
import { ProtoFieldInfo } from "../../misc/proto/il2cpp";
import { protoDataToString, stringToProtoData } from "../../misc/utils";
import InputCell, { ActionButton } from "../InputCell";
import { refreshSpan } from "./ObjectView";

export function FieldCell(props: {
    field: PacketJSON<ProtoFieldInfo>;
    colSize: number;
    maxCols: number;
    address: number;
}) {
    let element: HTMLDivElement | undefined;
    createEffect(() => refreshSpan(element!, props.colSize, props.maxCols));
    const [value, valueLoading, requestValue] =
        useRequestAndResponsePacket<GetFieldResult>();
    function refresh() {
        requestValue({
            getField: {
                fieldId: props.field.id,
                objectAddress: props.address,
            },
        });
    }
    onMount(() => refresh());
    const [, valueSetting, requestSet] =
        useRequestAndResponsePacket<SetFieldResult>();
    function update(value: string) {
        const protoData = stringToProtoData(value, props.field.type!);
        requestSet({
            setField: {
                fieldId: props.field.id,
                objectAddress: props.address,
                value: protoData,
            },
        });
    }
    return (
        <span ref={element} class="font-mono">
            {props.field.name + " = "}
            <InputCell
                input
                output
                onInput={update}
                value={protoDataToString(value()?.value)}
                type={props.field.type!}
            />
            <ActionButton
                class={"small-button"}
                onClick={refresh}
                loading={valueLoading() || valueSetting()}
                img="refresh.svg"
            />
        </span>
    );
}