import { Show, createMemo } from "solid-js";
import { PacketJSON } from "../misc/events";
import { ProtoTypeInfo } from "../misc/proto/il2cpp";

import styles from "./InputCell.module.css";
import { protoTypeToString } from "../misc/utils";
import { objectUrl } from "../App";
import { useNavigate } from "@solidjs/router";

export function ActionButton(props: {
    img: "refresh.svg" | "enter.svg" | "navigate.svg";
    onClick: () => void;
    loading?: boolean;
    class?: string;
}) {
    return (
        <button class={props.class ?? ""} onClick={() => props.onClick()}>
            <Show
                when={props.loading}
                fallback={
                    <img
                        src={"/src/assets/" + props.img}
                        elementtiming={"Action"}
                        fetchpriority={"auto"}
                    />
                }
            >
                <img
                    src="/src/assets/loading.svg"
                    class="animate-spin"
                    elementtiming={"Loading"}
                    fetchpriority={"auto"}
                />
            </Show>
        </button>
    );
}

export default function InputCell(props: {
    type: PacketJSON<ProtoTypeInfo>;
    value?: string;
    placeholder?: string;
    onInput?: (s: string) => void;
    input?: boolean;
    output?: boolean;
}) {
    const inputType = createMemo(() => {
        if (props.type.classInfo != undefined) return "number";

        if (props.type.primitiveInfo != undefined) {
            switch (props.type.primitiveInfo) {
                case ProtoTypeInfo.Primitive.BYTE:
                case ProtoTypeInfo.Primitive.SHORT:
                case ProtoTypeInfo.Primitive.INT:
                case ProtoTypeInfo.Primitive.LONG:
                case ProtoTypeInfo.Primitive.DOUBLE:
                case ProtoTypeInfo.Primitive.FLOAT:
                    return "number";
            }
        }

        return "text";
    });
    const minWidth = createMemo(() => {
        if (props.type.structInfo != undefined) return 200;

        if (props.type.primitiveInfo != undefined) {
            switch (props.type.primitiveInfo) {
                case ProtoTypeInfo.Primitive.BOOLEAN:
                    return 60;
                case ProtoTypeInfo.Primitive.CHAR:
                    return 40;
                case ProtoTypeInfo.Primitive.VOID:
                    return 50;
            }
        }

        return 100;
    });

    const detail = createMemo(
        () =>
            (props.placeholder ? props.placeholder + ": " : "") +
            protoTypeToString(props.type)
    );

    const navigate = useNavigate();

 
    return (
        <span
            class={styles.inputParent}
            style={{
                "flex-grow": detail().length,
                "min-width": `${minWidth()}px`,
            }}
        >
            <input
                class={styles.input}
                type={inputType()}
                onInput={(e) => {
                    props.onInput?.(e.target.value);
                }}
                value={props.value ?? ""}
                disabled={!props.input}
                placeholder={detail()}
                title={detail()}
            />
            <Show when={props.type.classInfo && props.output}>
                <ActionButton
                    class="small-button"
                    img="navigate.svg"
                    // False positive
                    // eslint-disable-next-line solid/reactivity
                    onClick={() => navigate(objectUrl(Number.parseInt(props.value!)))}
                />
            </Show>
        </span>
    );
}
