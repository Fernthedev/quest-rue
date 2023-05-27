import {
    For,
    Show,
    createDeferred,
    createEffect,
    createMemo,
    createSignal,
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

export function TypeSection(props: {
    details?: PacketJSON<ProtoClassDetails>;
    selectedAddress: bigint;
    search: string;
    spanFn: SpanFn;
}) {
    createEffect(() => {
        console.log(props.details);
    });

    const className = createMemo(() =>
        props.details?.clazz
            ? props.details.clazz!.namespaze + "::" + props.details.clazz!.clazz
            : ""
    );

    const [collapsed, setCollapsed] = createSignal<boolean>(false);

    const headerClass = createMemo(
        () =>
            `${styles.expanded} ${styles.header} ${
                !collapsed() ? styles.rounded : ""
            } cursor-pointer`
    );

    // due to auto-fill all the grids will have the same size columns
    let grid: HTMLDivElement | undefined;
    const [colSize, setColSize] = createSignal<number>(0);
    const gridObserver = new ResizeObserver(() => {
        const columns = getComputedStyle(grid!).gridTemplateColumns.split(" ");
        const column = columns[0].replace("px", "");
        setColSize(Number(column));
    });
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

    const groupedMethods = createMemo(() => {
        const ret = new Map<string, ProtoMethodInfo[]>();
        for (const method of filteredMethods()) {
            if (ret.has(method.name)) ret.get(method.name)!.push(method);
            else ret.set(method.name, [method]);
        }
        return Array.from(ret.entries());
    });

    const [expanded, setExpanded] = createUpdatingSignal(
        () =>
            groupedMethods().reduce((ret: Map<string, boolean>, val) => {
                if (val[1].length > 1) ret.set(val[0], false);
                return ret;
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
                            .map(([name, arr]) =>
                                arr.length == 1
                                    ? arr
                                    : expanded().get(name)
                                    ? [{ name: name, count: arr.length }, ...arr]
                                    : { name: name, count: arr.length }
                            )
                            .flat()}
                    >
                        {(item) => (
                            <Show
                                // @ts-expect-error (I know it might not have the field why do you think I'm doing this check typescript)
                                when={item.count !== undefined}
                                fallback={
                                    <MethodCell
                                        // @ts-expect-error (item is ProtoMethodInfo)
                                        method={item}
                                        colSize={colSize()}
                                        spanFn={props.spanFn}
                                        address={props.selectedAddress}
                                    />
                                }
                            >
                                <OverloadCell
                                    name={item.name}
                                    // @ts-expect-error (field is verified in "when")
                                    count={item.count}
                                    toggleFn={() =>
                                        setExpanded((prev) =>
                                            prev.set(item.name, !prev.get(item.name))
                                        )
                                    }
                                    colSize={colSize()}
                                    spanFn={props.spanFn}
                                />
                            </Show>
                        )}
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
