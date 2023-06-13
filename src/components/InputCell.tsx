import { Show, createMemo, createEffect, on } from "solid-js";
import { PacketJSON } from "../misc/events";
import { ProtoTypeInfo, ProtoTypeInfo_Primitive } from "../misc/proto/il2cpp";

import styles from "./InputCell.module.css";
import { errorHandle, protoTypeToString, uniqueNumber } from "../misc/utils";
import { objectUrl } from "../App";
import { useNavigate } from "@solidjs/router";
import { Select, createOptions } from "@thisbeyond/solid-select";
import { useSettings } from "./Settings";
import { createFocusSignal } from "@solid-primitives/active-element";

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
    onFocusExit?: () => void;
}) {
    const { rawInput } = useSettings();

    // restrict values for some data types
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
    // some data types need more space than others
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
    // and others would look ugly if too big
    const maxWidth = createMemo(() => minWidth() * 2);

    // placeholder and title (which is a tooltip)
    const detail = createMemo(
        () =>
            (props.placeholder ? props.placeholder + ": " : "") +
            protoTypeToString(props.type)
    );

    // useNavigate needs to be out here instead of in a callback fn
    const navigate = useNavigate();

    // true/false selector for booleans
    const isBool = createMemo(
        () =>
            props.type.Info?.$case == "primitiveInfo" &&
            props.type.Info.primitiveInfo == ProtoTypeInfo_Primitive.BOOLEAN
    );
    const bools = createOptions(["true", "false"]);

    const opts = createOptions(["placeholder 1", "placeholder 2", "hi"]);

    // track loss of focus (defer since it starts as false)
    let target: HTMLInputElement | undefined;
    const focused = createFocusSignal(() => target!);
    createEffect(
        on(
            focused,
            () => {
                if (!focused()) props.onFocusExit?.();
            },
            { defer: true }
        )
    );

    return (
        <span
            class={styles.inputParent}
            style={{
                "flex-grow": detail().length,
                "min-width": `${minWidth()}px`,
                "max-width": `${maxWidth()}px`,
            }}
        >
            <Show
                when={
                    // use a <Select> for booleans or classes with raw input off
                    props.input &&
                    ((props.type.Info?.$case == "classInfo" && !rawInput()) ||
                        isBool())
                }
                fallback={
                    <input
                        ref={target}
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
                }
            >
                {/* large negative margin to prevent the <Select> from affecting the flex distribution */}
                <span ref={target} class="w-full -mr-60">
                    <BetterSelect
                        onInput={(str: string) => props.onInput?.(str)}
                        initialValue={props.value ?? ""}
                        placeholder={detail()}
                        title={detail()}
                        {...(isBool() ? bools : opts)}
                    />
                </span>
            </Show>
            {/* selection button for classes only */}
            <Show when={props.type.Info?.$case == "classInfo" && props.output}>
                <ActionButton
                    class="small-button"
                    img="navigate.svg"
                    // False positive
                    // eslint-disable-next-line solid/reactivity
                    onClick={() => {
                        if (props.value != "0")
                            navigate(objectUrl(BigInt(props.value!)));
                    }}
                    tooltip="Select as object"
                />
            </Show>
        </span>
    );
}

type SelectProps = Parameters<typeof Select>[0];
function BetterSelect(props: SelectProps & { title?: string }) {
    const uniqId = uniqueNumber().toString();
    createEffect(() => {
        const e = document.getElementById(uniqId);
        if (e) e.title = props.title ?? "";
    });

    return <Select {...props} id={uniqId} />;
}
