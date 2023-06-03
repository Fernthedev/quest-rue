import {
    For,
    Show,
    createDeferred,
    createEffect,
    createMemo,
    createSignal,
    on,
} from "solid-js";
import { PacketJSON } from "../../misc/events";
import { ProtoClassDetails, ProtoMethodInfo } from "../../misc/proto/il2cpp";
import styles from "./ObjectView.module.css";
import { FieldCell } from "./FieldCell";
import { PropertyCell } from "./PropertyCell";
import { MethodCell } from "./MethodCell";
import { SpanFn, separator } from "./ObjectView";
import { OverloadCell } from "./OverloadCell";
import { createUpdatingSignal } from "../../misc/utils";

interface OverloadInfo {
    name: string;
    count: number;
}

export function TypeSection(props: {
    details?: PacketJSON<ProtoClassDetails>;
    selectedAddress: bigint;
    search: string;
    spanFn: SpanFn;
}) {
    const className = createMemo(() => {
        if (!props.details?.clazz) return "";
        return `${props.details.clazz.namespaze}::${props.details.clazz.clazz}`;
    });

    const [collapsed, setCollapsed] = createSignal<boolean>(false);

    const headerClass = createMemo(
        () =>
            `${styles.expanded} ${styles.header} cursor-pointer
            ${!collapsed() ? styles.rounded : ""}
            `
    );

    // due to the set count all the grids will have the same size columns
    let grid: HTMLDivElement | undefined;
    const [colSize, setColSize] = createSignal<number>(0);
    const recalculateSize = () => {
        const columns = getComputedStyle(grid!).gridTemplateColumns.split(" ");
        const column = columns[0].replace("px", "");
        setColSize(0);
        requestAnimationFrame(() => setColSize(Number(column)));
    };
    const gridObserver = new ResizeObserver(recalculateSize);
    // recalculate on changes to spanFn - aka "adaptive sizing" or "column count"
    createEffect(
        on(
            () => props.spanFn,
            () => {
                if (!collapsed()) recalculateSize();
            },
            { defer: true }
        )
    );
    // loses observation after collapsing
    createEffect(() => {
        if (!collapsed()) gridObserver.observe(grid!);
    });

    const filter = <T extends { name?: string }>(list: T[], search: string) =>
        list.filter((item) =>
            item.name?.toLocaleLowerCase().includes(search.toLocaleLowerCase())
        );

    const filteredFields = createDeferred(() =>
        filter(props.details?.fields ?? [], props.search)
    );
    const filteredProps = createDeferred(() =>
        filter(props.details?.properties ?? [], props.search)
    );
    const filteredMethods = createDeferred(() =>
        filter(props.details?.methods ?? [], props.search)
    );

    // Groups methods as [methodName, Methods[]]
    const groupedMethods = createMemo(() => {
        const ret = filteredMethods().reduce((map, method) => {
            const arr = map.get(method.name);
            if (arr) {
                arr.push(method);
            } else {
                map.set(method.name, [method]);
            }
            return map;
        }, new Map<string, ProtoMethodInfo[]>());

        return Array.from(ret);
    });

    const [expanded, setExpanded] = createUpdatingSignal(
        () =>
            groupedMethods().reduce((map, [name, methodInfos]) => {
                // more than one method
                if (methodInfos.length > 1) map.set(name, false);
                return map;
            }, new Map<string, boolean>()),
        { equals: false }
    );

    return (
        <div>
            <div
                role="checkbox"
                tabIndex={"0"}
                aria-checked={collapsed()}
                class={headerClass()}
                onKeyPress={() => setCollapsed(!collapsed())}
                onClick={() => setCollapsed(!collapsed())}
            >
                <span class="mr-1 inline-block w-4 text-center">
                    {collapsed() ? "+" : "-"}
                </span>
                {className()}
            </div>
            <Show when={!collapsed()}>
                <div class={`${styles.grid}`} ref={grid}>
                    <For each={filteredFields()}>
                        {(item) => (
                            <FieldCell
                                spanFn={props.spanFn}
                                field={item}
                                colSize={colSize()}
                                address={props.selectedAddress}
                            />
                        )}
                    </For>
                </div>
                <div class={`${styles.grid}`}>
                    <For each={filteredProps()}>
                        {(item) => (
                            <PropertyCell
                                prop={item}
                                colSize={colSize()}
                                address={props.selectedAddress}
                                spanFn={props.spanFn}
                            />
                        )}
                    </For>
                </div>
                <div class={`${styles.grid}`}>
                    <For
                        each={groupedMethods()
                            .map<
                                | OverloadInfo
                                | (OverloadInfo | ProtoMethodInfo)[]
                            >(([name, methodInfos]) => {
                                if (methodInfos.length == 1) {
                                    return methodInfos;
                                }
                                if (expanded().get(name)) {
                                    return [
                                        {
                                            name: name,
                                            count: methodInfos.length,
                                        },
                                        ...methodInfos,
                                    ];
                                }
                                return {
                                    name: name,
                                    count: methodInfos.length,
                                };
                            })
                            .flat()}
                    >
                        {(item) => {
                            const overload = createMemo(
                                () => item as OverloadInfo
                            );
                            const isOverload = createMemo(
                                () => overload().count !== undefined
                            );

                            return (
                                <Show
                                    when={isOverload()}
                                    fallback={
                                        <MethodCell
                                            method={item as ProtoMethodInfo}
                                            colSize={colSize()}
                                            spanFn={props.spanFn}
                                            address={props.selectedAddress}
                                        />
                                    }
                                >
                                    <OverloadCell
                                        name={overload().name}
                                        count={overload().count}
                                        toggleFn={() =>
                                            setExpanded((prev) =>
                                                prev.set(
                                                    item.name,
                                                    !prev.get(item.name)
                                                )
                                            )
                                        }
                                        colSize={colSize()}
                                        spanFn={props.spanFn}
                                        expanded={
                                            expanded().get(item.name) ?? false
                                        }
                                    />
                                </Show>
                            );
                        }}
                    </For>
                </div>
            </Show>
            <Show when={props.details?.parent} fallback={<div class="h-20" />}>
                {separator()}
                <TypeSection
                    details={props.details?.parent}
                    selectedAddress={props.selectedAddress}
                    search={props.search}
                    spanFn={props.spanFn}
                />
            </Show>
        </div>
    );
}
