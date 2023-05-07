import {
    For,
    Show,
    batch,
    createDeferred,
    createEffect,
    createMemo,
    createSignal,
} from "solid-js";
import { PacketJSON } from "../../misc/events";
import { ProtoClassDetails } from "../../misc/proto/il2cpp";
import styles from "./ObjectView.module.css";
import { FieldCell } from "./FieldCell";
import { PropertyCell } from "./PropertyCell";
import { MethodCell } from "./MethodCell";
import { SpanFn, separator } from "./ObjectView";

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
                    <For each={filteredMethods()}>
                        {(item) => (
                            <MethodCell
                                method={item}
                                colSize={colSize()}
                                spanFn={props.spanFn}
                                address={props.selectedAddress}
                            />
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
