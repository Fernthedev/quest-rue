import { For, Show, createEffect, createMemo, createSignal, on, onMount } from "solid-js"
import { selectedObject } from "../misc/state";
import { PacketJSON, useRequestAndResponsePacket } from "../misc/events";
import { GetClassDetailsResult, GetFieldResult, InvokeMethodResult } from "../misc/proto/qrue";
import { ProtoClassDetails, ProtoFieldInfo, ProtoMethodInfo, ProtoPropertyInfo } from "../misc/proto/il2cpp";

import styles from "./ObjectView.module.css";

function FieldCell(props: { field: PacketJSON<ProtoFieldInfo>, colSize: number }) {
    let element: HTMLDivElement | undefined;
    createEffect(() => {
        const width = (element?.clientWidth ?? 1) - 1;
        const span = Math.ceil(width / props.colSize);
        element!.style.setProperty("grid-column", `span ${span}`);
    });
    return (
        <span ref={element}>
            {props.field.name}
        </span>
    )
}

function PropertyCell(props: { prop: PacketJSON<ProtoPropertyInfo>, colSize: number }) {
    let element: HTMLDivElement | undefined;
    createEffect(() => {
        const width = (element?.clientWidth ?? 1) - 1;
        const span = Math.ceil(width / props.colSize);
        element!.style.setProperty("grid-column", `span ${span}`);
    });
    return (
        <span ref={element}>
            {props.prop.name}
        </span>
    )
}

function MethodCell(props: { method: PacketJSON<ProtoMethodInfo>, colSize: number }) {
    let element: HTMLDivElement | undefined;
    createEffect(() => {
        const width = (element?.clientWidth ?? 1) - 1;
        const span = Math.ceil(width / props.colSize);
        element!.style.setProperty("grid-column", `span ${span}`);
    });
    return (
        <span ref={element}>
            {props.method.name}
        </span>
    )
}

const separator = () => <div class={`${styles.expanded} ${styles.separator}`}/>;

function TypeSection(props: { details?: PacketJSON<ProtoClassDetails> }) {
    const className = createMemo(() => props.details?.clazz ? props.details.clazz!.namespaze + "::" + props.details.clazz!.clazz : "");

    const [collapsed, setCollapsed] = createSignal<boolean>(false);

    const htmlClass = createMemo(() => `${styles.expanded} ${styles.header} ${!collapsed() ? styles.rounded : ""} cursor-pointer`);

    // due to auto-fill all the grids will have the same size columns
    let grid: HTMLDivElement | undefined;
    const [colSize, setColSize] = createSignal<number>(0);
    const gridObserver = new ResizeObserver(() => {
        const column = getComputedStyle(grid!).gridTemplateColumns.split(" ", 1)[0].replace("px", "");
        setColSize(Number(column));
    });
    onMount(() => gridObserver.observe(grid!));

    return (
        <div>
            <div class={htmlClass()} onClick={() => setCollapsed(!collapsed())}>
                <span class="mr-1 inline-block w-4 text-center">
                    {collapsed() ? "+" : "-"}
                </span>
                {className()}
            </div>
            <Show when={!collapsed()}>
                <div class={`${styles.grid}`} ref={grid}>
                    <For each={props.details?.fields}>
                        {item => <FieldCell field={item} colSize={colSize()} />}
                    </For>
                </div>
                <div class={`${styles.grid}`}>
                    <For each={props.details?.properties}>
                        {item => <PropertyCell prop={item} colSize={colSize()} />}
                    </For>
                </div>
                <div class={`${styles.grid}`}>
                    <For each={props.details?.methods}>
                        {item => <MethodCell method={item} colSize={colSize()} />}
                    </For>
                </div>
            </Show>
            <Show when={props.details?.parent} fallback={<div class="h-20" />}>
                {separator()}
                <TypeSection details={props.details?.parent} />
            </Show>
        </div>
    )
}

export default function ObjectView() {
    const globalFallback = <div class="absolute-centered">No Object Selected</div>
    const detailsFallback = <div class="absolute-centered">Loading...</div>

    const className = createMemo(() => selectedObject() ? selectedObject()!.classInfo!.namespaze + "::" + selectedObject()!.classInfo!.clazz : "");

    const [details, detailsLoading, requestDetails] = useRequestAndResponsePacket<GetClassDetailsResult>();

    createEffect(() => {
        if (selectedObject()) {
            requestDetails({
                getClassDetails: {
                    classInfo: selectedObject()!.classInfo
                }
            });
        }
    });

    const classDetails = createMemo(() => {
        if (!selectedObject())
            return undefined;
        return details()?.classDetails;
    });

    return (
        <Show when={selectedObject() != undefined} fallback={globalFallback}>
            <div class="p-4 w-full h-full">
                <div class="space-x-4">
                    <span class="text-xl">{selectedObject()!.name}</span>
                    <span class="text-lg font-mono">{className()}</span>
                </div>
                {separator()}
                <Show when={!detailsLoading()} fallback={detailsFallback}>
                    <TypeSection details={classDetails()!} />
                </Show>
            </div>
        </Show>
    )
}
