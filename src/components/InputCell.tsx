import { Show, createMemo } from "solid-js";
import { PacketJSON } from "../misc/events";
import { ProtoTypeInfo, ProtoTypeInfo_Primitive } from "../misc/proto/il2cpp";

import styles from "./InputCell.module.css";
import { errorHandle, protoTypeToString } from "../misc/utils";
import { objectUrl } from "../App";
import { useNavigate } from "@solidjs/router";

export function ActionButton(props: {
    img: "refresh.svg" | "enter.svg" | "navigate.svg";
    onClick: () => void;
    loading?: boolean;
    class?: string;
    label?: string;
    tooltip?: string;
}) {
    const classes = createMemo(() => props.class);

    return (
        <button
            // Accessibility is important
            aria-label={props.label ?? props.tooltip}
            class={classes()}
            classList={{ tooltip: props.tooltip !== undefined }}
            // False positive
            // eslint-disable-next-line solid/reactivity
            onClick={() => errorHandle(() => props.onClick())}
            title={props.tooltip}
        >
            <Show
                when={props.loading}
                fallback={
                    <img
                        src={"/src/assets/" + props.img}
                        elementtiming={"Action"}
                        fetchpriority={"auto"}
                        alt="Action"
                    />
                }
            >
                <img
                    src="/src/assets/loading.svg"
                    class="animate-spin"
                    elementtiming={"Loading"}
                    fetchpriority={"auto"}
                    alt="Loading"
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
        if (props.type.Info?.$case == "classInfo") return "number";

        if (props.type.Info?.$case == "primitiveInfo") {
            switch (props.type.Info.primitiveInfo) {
                case ProtoTypeInfo_Primitive.BYTE:
                case ProtoTypeInfo_Primitive.SHORT:
                case ProtoTypeInfo_Primitive.INT:
                case ProtoTypeInfo_Primitive.LONG:
                case ProtoTypeInfo_Primitive.DOUBLE:
                case ProtoTypeInfo_Primitive.FLOAT:
                    return "number";
            }
        }

        return "text";
    });
    const minWidth = createMemo(() => {
        if (props.type.Info?.$case == "structInfo") return 150;
        if (props.type.Info?.$case == "arrayInfo") return 150;
        if (props.type.Info?.$case == "genericInfo") return 80;

        if (props.type.Info?.$case == "primitiveInfo") {
            switch (props.type.Info.primitiveInfo) {
                case ProtoTypeInfo_Primitive.BOOLEAN:
                    return 60;
                case ProtoTypeInfo_Primitive.CHAR:
                    return 40;
                case ProtoTypeInfo_Primitive.VOID:
                    return 50;
            }
        }

        return 100;
    });
    const maxWidth = createMemo(() => minWidth() * 2);

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
                "max-width": `${maxWidth()}px`,
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
            <Show when={props.type.Info?.$case == "classInfo" && props.output}>
                <ActionButton
                    class="small-button"
                    img="navigate.svg"
                    // False positive
                    // eslint-disable-next-line solid/reactivity
                    onClick={() => navigate(objectUrl(BigInt(props.value!)))}
                    tooltip="Select as object"
                />
            </Show>
        </span>
    );
}
