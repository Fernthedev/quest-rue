import { Show, createMemo } from "solid-js";
import { PacketJSON } from "../misc/events";
import { ProtoTypeInfo } from "../misc/proto/il2cpp";

import styles from "./InputCell.module.css"
import { protoTypeToString } from "../misc/utils";

export function ActionButton(props: { img: string, onClick: () => void, loading: boolean, class: string }) {
    return (
        <button class={props.class} onClick={props.onClick}>
            <Show when={props.loading} fallback={<img src={"/src/assets/" + props.img} />}>
                <img src="/src/assets/loading.svg" class="animate-spin" />
            </Show>
        </button>
    )
}

export default function InputCell(props: { type: PacketJSON<ProtoTypeInfo>, value?: string, placeholder?: string, onInput?: (s: string) => void, disabled?: boolean }) {
    let inputType = "text"
    if (!props.type.structInfo && !props.type.classInfo) {
        const type = props.type.primitiveInfo!;
        if (
            type == ProtoTypeInfo.Primitive.INT ||
            type == ProtoTypeInfo.Primitive.LONG ||
            type == ProtoTypeInfo.Primitive.FLOAT ||
            type == ProtoTypeInfo.Primitive.DOUBLE
        )
            inputType = "number";
    }
    const detail = createMemo(() => (props.placeholder ? props.placeholder + ": " : "") + protoTypeToString(props.type));
    return (
        <input
            class={`${styles.input}`}
            type={inputType}
            onInput={e => props.onInput?.(e.target.value)}
            value={props.value ?? ""}
            disabled={props.disabled}
            placeholder={detail()}
            title={detail()}
        />
    )
}
