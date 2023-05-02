import { Show, createMemo } from "solid-js";
import { PacketJSON } from "../misc/events";
import { ProtoTypeInfo } from "../misc/proto/il2cpp";

import styles from "./InputCell.module.css"
import { protoTypeToString } from "../misc/utils";
import { selectObject } from "../App";

export function ActionButton(props: { img: string, onClick: () => void, loading?: boolean, class?: string }) {
    return (
        <button class={props.class ?? ""} onClick={props.onClick}>
            <Show when={props.loading} fallback={<img src={"/src/assets/" + props.img} />}>
                <img src="/src/assets/loading.svg" class="animate-spin" />
            </Show>
        </button>
    )
}

export default function InputCell(props: { type: PacketJSON<ProtoTypeInfo>, value?: string, placeholder?: string, onInput?: (s: string) => void, disabled?: boolean }) {
    let inputType = "text"
    let minWidth = 100;
    if (props.type.classInfo != undefined)
        inputType = "number";
    else if (props.type.structInfo != undefined)
        minWidth = 200;
    else if (props.type.primitiveInfo != undefined) {
        switch (props.type.primitiveInfo) {
        case ProtoTypeInfo.Primitive.BOOLEAN:
            minWidth = 60;
            break;
        case ProtoTypeInfo.Primitive.CHAR:
            minWidth = 40;
            break;
        case ProtoTypeInfo.Primitive.INT:
            inputType = "number";
            break;
        case ProtoTypeInfo.Primitive.LONG:
            inputType = "number";
            break;
        case ProtoTypeInfo.Primitive.FLOAT:
            inputType = "number";
            break;
        case ProtoTypeInfo.Primitive.DOUBLE:
            inputType = "number";
            break;
        case ProtoTypeInfo.Primitive.STRING:
            break;
        case ProtoTypeInfo.Primitive.PTR:
            break;
        case ProtoTypeInfo.Primitive.UNKNOWN:
            break;
        case ProtoTypeInfo.Primitive.VOID:
            minWidth = 50;
            break;
        }
    }
    const detail = createMemo(() => (props.placeholder ? props.placeholder + ": " : "") + protoTypeToString(props.type));
    return (
        <span class={styles.inputParent} style={{
            "flex-grow": detail().length,
            "min-width": `${minWidth}px`,
        }}>
            <input
                class={styles.input}
                type={inputType}
                onInput={e => { props.onInput?.(e.target.value);  }}
                value={props.value ?? ""}
                disabled={props.disabled}
                placeholder={detail()}
                title={detail()}
            />
            <Show when={props.type.classInfo && props.disabled}>
                <ActionButton class="small-button" img="navigate.svg" onClick={() => selectObject(Number(props.value))} />
            </Show>
        </span>
    )
}
