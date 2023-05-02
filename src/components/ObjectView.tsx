import { For, Show, createEffect, createMemo, createSignal, on, onMount } from "solid-js"
import { selectedObject } from "../misc/state";
import { PacketJSON, useRequestAndResponsePacket } from "../misc/events";
import { GetClassDetailsResult, GetFieldResult, InvokeMethodResult, SetFieldResult } from "../misc/proto/qrue";
import { ProtoClassDetails, ProtoFieldInfo, ProtoMethodInfo, ProtoPropertyInfo } from "../misc/proto/il2cpp";

import styles from "./ObjectView.module.css";
import { protoDataToString, stringToProtoData } from "../misc/utils";
import InputCell, { ActionButton } from "./InputCell";

function FieldCell(props: { field: PacketJSON<ProtoFieldInfo>, colSize: number, maxCols: number }) {
    let element: HTMLDivElement | undefined;
    createEffect(() => {
        if (props.colSize == 0) return;
        element!.style.setProperty("grid-column", "span 1");
        const width = (element?.clientWidth ?? 1) - 1;
        const span = Math.min(Math.ceil(width / props.colSize), props.maxCols);
        element!.style.setProperty("grid-column", `span ${span}`);
    });
    const [value, valueLoading, requestValue] = useRequestAndResponsePacket<GetFieldResult>();
    function refresh() {
        requestValue({
            getField: {
                fieldId: props.field.id,
                objectAddress: selectedObject()?.address,
            }
        });
    }
    onMount(() => refresh());
    const [_, valueSetting, requestSet] = useRequestAndResponsePacket<SetFieldResult>();
    function update(value: string) {
        const protoData = stringToProtoData(value, props.field.type!);
        requestSet({
            setField: {
                fieldId: props.field.id,
                objectAddress: selectedObject()?.address,
                value: protoData,
            }
        });
    }
    return (
        <span ref={element} class="font-mono">
            {props.field.name + " = "}
            <InputCell onInput={update} value={protoDataToString(value()?.value)} type={props.field.type!} />
            <ActionButton class={`${styles.button}`}  onClick={refresh} loading={valueLoading() || valueSetting()} img="refresh.svg" />
        </span>
    )
}

function PropertyCell(props: { prop: PacketJSON<ProtoPropertyInfo>, colSize: number, maxCols: number }) {
    let element: HTMLDivElement | undefined;
    createEffect(() => {
        if (props.colSize == 0) return;
        element!.style.setProperty("grid-column", "span 1");
        const width = (element?.clientWidth ?? 1) - 1;
        const span = Math.min(Math.ceil(width / props.colSize), props.maxCols);
        element!.style.setProperty("grid-column", `span ${span}`);
    });
    const [value, valueLoading, requestGet] = useRequestAndResponsePacket<InvokeMethodResult>();
    function get() {
        requestGet({
            invokeMethod: {
                methodId: props.prop.getterId,
                objectAddress: selectedObject()?.address,
                args: [],
            }
        });
    }
    const [_, valueSetting, requestSet] = useRequestAndResponsePacket<InvokeMethodResult>();
    const [inputValue, setInputValue] = createSignal<string>("");
    function set() {
        const protoData = stringToProtoData(inputValue(), props.prop.type!);
        requestSet({
            invokeMethod: {
                methodId: props.prop.setterId,
                objectAddress: selectedObject()?.address,
                args: [protoData],
            }
        });
    }
    createEffect(() => setInputValue(protoDataToString(value()?.result)));
    return (
        <span ref={element} class="font-mono">
            {props.prop.name + " = "}
            <InputCell onInput={setInputValue} value={inputValue()} disabled={!props.prop.setterId} type={props.prop.type!} />
            <Show when={props.prop.getterId}>
                <ActionButton class={`${styles.button}`}  onClick={get} loading={valueLoading() || valueSetting()} img="refresh.svg" />
            </Show>
            <Show when={props.prop.setterId}>
                <ActionButton class={`${styles.button}`}  onClick={set} loading={valueLoading() || valueSetting()} img="enter.svg" />
            </Show>
        </span>
    )
}

function MethodCell(props: { method: PacketJSON<ProtoMethodInfo>, colSize: number, maxCols: number }) {
    let element: HTMLDivElement | undefined;
    createEffect(() => {
        if (props.colSize == 0) return;
        element!.style.setProperty("grid-column", "span 1");
        const width = (element?.clientWidth ?? 1) - 1;
        const span = Math.min(Math.ceil(width / props.colSize), props.maxCols);
        element!.style.setProperty("grid-column", `span ${span}`);
    });
    const args = Array<string>(Object.keys(props.method.args ?? {}).length);
    const [result, resultLoading, runMethod] = useRequestAndResponsePacket<InvokeMethodResult>();
    function run() {
        const argsData = args.map((str, index) => stringToProtoData(str, Object.values(props.method.args!)[index]));
        runMethod({
            invokeMethod: {
                methodId: props.method.id,
                objectAddress: selectedObject()?.address,
                args: argsData,
            }
        });
    }
    return (
        <span ref={element} class="font-mono">
            {props.method.name + " ("}
            <For each={Object.entries(props.method.args ?? {})}>
                {([name, type], index) => <InputCell placeholder={name} type={type!} onInput={str => args[index()] = str} />}
            </For>
            {") "}
            <ActionButton class={`${styles.button}`}  onClick={run} loading={resultLoading()} img="enter.svg" />
            <InputCell disabled value={protoDataToString(result()?.result)} type={props.method.returnType!} />
        </span>
    )
}

const separator = () => <div class={`${styles.expanded} ${styles.separator}`}/>;

function TypeSection(props: { details?: PacketJSON<ProtoClassDetails> }) {
    const className = createMemo(() => props.details?.clazz ? props.details.clazz!.namespaze + "::" + props.details.clazz!.clazz : "");

    const [collapsed, setCollapsed] = createSignal<boolean>(false);

    const headerClass = createMemo(() => `${styles.expanded} ${styles.header} ${!collapsed() ? styles.rounded : ""} cursor-pointer`);

    // due to auto-fill all the grids will have the same size columns
    let grid: HTMLDivElement | undefined;
    const [colSize, setColSize] = createSignal<number>(0);
    const [colNum, setColNum] = createSignal<number>(0);
    const gridObserver = new ResizeObserver(() => {
        const columns = getComputedStyle(grid!).gridTemplateColumns.split(" ");
        setColNum(columns.length);
        const column = columns[0].replace("px", "");
        setColSize(Number(column));
    });
    onMount(() => gridObserver.observe(grid!));

    return (
        <div>
            <div class={headerClass()} onClick={() => setCollapsed(!collapsed())}>
                <span class="mr-1 inline-block w-4 text-center">
                    {collapsed() ? "+" : "-"}
                </span>
                {className()}
            </div>
            <Show when={!collapsed()}>
                <div class={`${styles.grid}`} ref={grid}>
                    <For each={props.details?.fields}>
                        {item => <FieldCell field={item} colSize={colSize()} maxCols={colNum()} />}
                    </For>
                </div>
                <div class={`${styles.grid}`}>
                    <For each={props.details?.properties}>
                        {item => <PropertyCell prop={item} colSize={colSize()} maxCols={colNum()} />}
                    </For>
                </div>
                <div class={`${styles.grid}`}>
                    <For each={props.details?.methods}>
                        {item => <MethodCell method={item} colSize={colSize()} maxCols={colNum()} />}
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
