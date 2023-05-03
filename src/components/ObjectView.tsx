import { For, Show, batch, createDeferred, createEffect, createMemo, createSignal, on, onMount } from "solid-js"
import { PacketJSON, useRequestAndResponsePacket } from "../misc/events";
import { GetClassDetailsResult, GetFieldResult, GetInstanceDetails, GetInstanceDetailsResult, InvokeMethodResult, SetFieldResult } from "../misc/proto/qrue";
import { ProtoClassDetails, ProtoFieldInfo, ProtoMethodInfo, ProtoPropertyInfo } from "../misc/proto/il2cpp";

import styles from "./ObjectView.module.css";
import { protoDataToString, protoTypeToString, stringToProtoData } from "../misc/utils";
import InputCell, { ActionButton } from "./InputCell";

function refreshSpan(element: HTMLDivElement, colSize: number, maxCols: number) {
    if (colSize == 0) return;
    element.style.setProperty("grid-column", "span 1");
    const width = (element?.clientWidth ?? 1) - 1;
    const span = Math.min(Math.ceil(width / colSize), maxCols);
    element.style.setProperty("grid-column", `span ${span}`);
}

function FieldCell(props: { field: PacketJSON<ProtoFieldInfo>, colSize: number, maxCols: number, address: number }) {
    let element: HTMLDivElement | undefined;
    createEffect(() => refreshSpan(element!, props.colSize, props.maxCols));
    const [value, valueLoading, requestValue] = useRequestAndResponsePacket<GetFieldResult>();
    function refresh() {
        requestValue({
            getField: {
                fieldId: props.field.id,
                objectAddress: props.address,
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
                objectAddress: props.address,
                value: protoData,
            }
        });
    }
    return (
        <span ref={element} class="font-mono">
            {props.field.name + " = "}
            <InputCell input output onInput={update} value={protoDataToString(value()?.value)} type={props.field.type!} />
            <ActionButton class={"small-button"}  onClick={refresh} loading={valueLoading() || valueSetting()} img="refresh.svg" />
        </span>
    )
}

function PropertyCell(props: { prop: PacketJSON<ProtoPropertyInfo>, colSize: number, maxCols: number, address: number }) {
    let element: HTMLDivElement | undefined;
    createEffect(() => refreshSpan(element!, props.colSize, props.maxCols));
    const [value, valueLoading, requestGet] = useRequestAndResponsePacket<InvokeMethodResult>();
    function get() {
        requestGet({
            invokeMethod: {
                methodId: props.prop.getterId,
                objectAddress: props.address,
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
                objectAddress: props.address,
                args: [protoData],
            }
        });
    }
    createEffect(() => setInputValue(protoDataToString(value()?.result)));
    return (
        <span ref={element} class="font-mono">
            {props.prop.name + " = "}
            <InputCell input={Boolean(props.prop.setterId)} output onInput={setInputValue} value={inputValue()} type={props.prop.type!} />
            <Show when={props.prop.getterId}>
                <ActionButton class={"small-button"}  onClick={get} loading={valueLoading() || valueSetting()} img="refresh.svg" />
            </Show>
            <Show when={props.prop.setterId}>
                <ActionButton class={"small-button"}  onClick={set} loading={valueLoading() || valueSetting()} img="enter.svg" />
            </Show>
        </span>
    )
}

function MethodCell(props: { method: PacketJSON<ProtoMethodInfo>, colSize: number, maxCols: number, address: number }) {
    let element: HTMLDivElement | undefined;
    createEffect(() => refreshSpan(element!, props.colSize, props.maxCols));
    const args = Object.keys(props.method.args ?? {}).map(() => "");
    const [result, resultLoading, runMethod] = useRequestAndResponsePacket<InvokeMethodResult>();
    function run() {
        const argsData = args.map((str, index) => stringToProtoData(str, Object.values(props.method.args!)[index]));
        runMethod({
            invokeMethod: {
                methodId: props.method.id,
                objectAddress: props.address,
                args: argsData,
            }
        });
    }
    return (
        <span ref={element} class="font-mono">
            {props.method.name + " ("}
            <For each={Object.entries(props.method.args ?? {})}>
                {([name, type], index) => <InputCell input placeholder={name} type={type!} onInput={str => args[index()] = str} />}
            </For>
            {") "}
            <ActionButton class={"small-button"}  onClick={run} loading={resultLoading()} img="enter.svg" />
            <InputCell output value={protoDataToString(result()?.result)} type={props.method.returnType!} />
        </span>
    )
}

const separator = () => <div class={`${styles.expanded} ${styles.separator}`}/>;

function TypeSection(props: { details?: PacketJSON<ProtoClassDetails>, selectedAddress: number, search: string }) {
    const className = createMemo(() => props.details?.clazz ? props.details.clazz!.namespaze + "::" + props.details.clazz!.clazz : "");

    const [collapsed, setCollapsed] = createSignal<boolean>(false);

    const headerClass = createMemo(() => `${styles.expanded} ${styles.header} ${!collapsed() ? styles.rounded : ""} cursor-pointer`);

    // due to auto-fill all the grids will have the same size columns
    let grid: HTMLDivElement | undefined;
    const [colSize, setColSize] = createSignal<number>(0);
    const [colNum, setColNum] = createSignal<number>(0);
    const gridObserver = new ResizeObserver(() => {
        const columns = getComputedStyle(grid!).gridTemplateColumns.split(" ");
        const column = columns[0].replace("px", "");
        batch(() => {
            setColNum(columns.length);
            setColSize(Number(column));
        });
    });
    // loses observation after collapsing
    createEffect(() => { if (!collapsed()) gridObserver.observe(grid!) });

    const filter = <T extends { name?: string }>(list: T[], search: string) => list.filter(item => item.name?.toLocaleLowerCase().includes(search.toLocaleLowerCase()));

    const filteredFields = createDeferred(() => filter(props.details?.fields ?? [], props.search));
    const filteredProps = createDeferred(() => filter(props.details?.properties ?? [], props.search));
    const filteredMethods = createDeferred(() => filter(props.details?.methods ?? [], props.search));

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
                    <For each={filteredFields()}>
                        {item => <FieldCell field={item} colSize={colSize()} maxCols={colNum()} address={props.selectedAddress} />}
                    </For>
                </div>
                <div class={`${styles.grid}`}>
                    <For each={filteredProps()}>
                        {item => <PropertyCell prop={item} colSize={colSize()} maxCols={colNum()} address={props.selectedAddress} />}
                    </For>
                </div>
                <div class={`${styles.grid}`}>
                    <For each={filteredMethods()}>
                        {item => <MethodCell method={item} colSize={colSize()} maxCols={colNum()} address={props.selectedAddress} />}
                    </For>
                </div>
            </Show>
            <Show when={props.details?.parent} fallback={<div class="h-20" />}>
                {separator()}
                <TypeSection details={props.details?.parent} selectedAddress={props.selectedAddress} search={props.search} />
            </Show>
        </div>
    )
}

export default function ObjectView(props: { selectedAddress: number }) {
    const globalFallback = <div class="absolute-centered">No Object Selected</div>
    const detailsFallback = <div class="absolute-centered">Loading...</div>

    const [details, detailsLoading, requestDetails] = useRequestAndResponsePacket<GetInstanceDetailsResult>();

    createEffect(() => {
        if (props.selectedAddress) {
            requestDetails({
                getInstanceDetails: {
                    address: props.selectedAddress
                }
            });
        }
    });

    const classDetails = createMemo(() => {
        if (!props.selectedAddress)
            return undefined;
        return details()?.classDetails;
    });
    const className = createMemo(() => classDetails() ? protoTypeToString({classInfo: classDetails()?.clazz}) : "");
    const interfaces = createMemo(() => {
        if (!classDetails()) return ""
        return classDetails()?.interfaces?.map(info => protoTypeToString({classInfo: info})).join(", ");
    });

    const [search, setSearch] = createSignal<string>("");

    return (
        <Show when={props.selectedAddress} fallback={globalFallback}>
            <div class="p-4 w-full h-full">
                <div class="flex gap-4 mb-1 items-end">
                    <span class="text-xl font-mono flex-0">{className()}</span>
                    <span class="text-lg font-mono flex-0">{interfaces()}</span>
                    <span class="flex-1" />
                    <input class="px-2 py-1" placeholder="Search" onInput={e => setSearch(e.target.value)} value={search()} />
                </div>
                {separator()}
                <Show when={!detailsLoading()} fallback={detailsFallback}>
                    <TypeSection details={classDetails()!} selectedAddress={props.selectedAddress} search={search()} />
                </Show>
            </div>
        </Show>
    )
}
