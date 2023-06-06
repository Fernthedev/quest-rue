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
import { SetStoreFunction, Store } from "solid-js/store";
import { FilterSettings } from "./FilterSettings";

interface OverloadInfo {
    name: string;
    count: number;
}

export function TypeSection(props: {
    details?: PacketJSON<ProtoClassDetails>;
    selectedAddress: bigint;
    search: string;
    spanFn: SpanFn;
    statics: boolean;
    setStatics: SetStoreFunction<{ [key: string]: ProtoClassDetails }>;
    filters: Store<FilterSettings>;
}) {
    const className = createMemo(() => {
        if (!props.details?.clazz) return "";
        return `${props.details.clazz.namespaze}::${props.details.clazz.clazz}`;
    });

    const [collapsed, setCollapsed] = createSignal<boolean>(false);

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

    const fields = createMemo(() =>
        props.statics ? props.details?.staticFields : props.details?.fields
    );
    const properties = createMemo(() =>
        props.statics
            ? props.details?.staticProperties
            : props.details?.properties
    );
    const methods = createMemo(() =>
        props.statics ? props.details?.staticMethods : props.details?.methods
    );
    const filteredFields = createDeferred(() =>
        props.filters.filterFields ? filter(fields() ?? [], props.search) : []
    );
    const filteredProps = createDeferred(() => {
        const applicableProperties = properties()?.filter(
            (p) =>
                (props.filters.filterGetters && p.getterId) ||
                (props.filters.filterSetters && p.setterId)
        );
        return filter(applicableProperties ?? [], props.search);
    });
    const filteredMethods = createDeferred(() =>
        props.filters.filterMethods ? filter(methods() ?? [], props.search) : []
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

    const addStatic = () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { parent, fields, properties, methods, ...smaller } =
            props.details ?? {};
        props.setStatics(className(), smaller);
    };
    const removeStatic = () => props.setStatics(className(), undefined!);

    return (
        <div>
            <div
                role="checkbox"
                tabIndex={"0"}
                aria-checked={collapsed()}
                class={`${styles.expanded} ${styles.header}`}
                classList={{ [styles.rounded]: !collapsed() }}
                onKeyPress={() => setCollapsed(!collapsed())}
                onClick={() => setCollapsed(!collapsed())}
            >
                <text class="flex-none mr-1 inline-block w-4 text-center">
                    {collapsed() ? "+" : "-"}
                </text>
                <text class="flex-1 min-w-0">{className()}</text>
                <Show
                    when={props.statics}
                    fallback={
                        <button
                            class="flex-none btn-sm flex items-center min-h-0 h-5"
                            onClick={(e) => {
                                e.stopPropagation();
                                addStatic();
                            }}
                        >
                            View static members
                        </button>
                    }
                >
                    <button
                        class="flex-none btn-sm flex items-center min-h-0 h-5"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeStatic();
                        }}
                    >
                        X
                    </button>
                </Show>
            </div>
            <Show when={!collapsed()}>
                <div class="h-1" />
                <div
                    class={`${styles.grid}`}
                    classList={{ "mb-1": filteredFields().length > 0 }}
                    ref={grid}
                >
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
                <div
                    class={`${styles.grid}`}
                    classList={{ "mb-1": filteredProps().length > 0 }}
                >
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
                <div
                    class={`${styles.grid}`}
                    classList={{ "mb-1": groupedMethods().length > 0 }}
                >
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
                                            highlight={expanded().has(
                                                item.name
                                            )}
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
            <Show when={props.details?.parent}>
                {separator()}
                <TypeSection
                    details={props.details?.parent}
                    selectedAddress={props.selectedAddress}
                    search={props.search}
                    spanFn={props.spanFn}
                    statics={props.statics}
                    setStatics={props.setStatics}
                    filters={props.filters}
                />
            </Show>
        </div>
    );
}
