import { Show, createEffect, createMemo, createSignal, on } from "solid-js";
import { useRequestAndResponsePacket } from "../../misc/events";
import { GetInstanceDetailsResult } from "../../misc/proto/qrue";

import styles from "./ObjectView.module.css";
import { protoTypeToString } from "../../misc/utils";
import { TypeSection } from "./TypeSection";

export type SpanFn = (e: HTMLDivElement, colSize: number) => void;

function adaptiveSpanSize(
    element: HTMLDivElement,
    colSize: number,
    maxCols: number,
    adaptiveSize: boolean
) {
    if (!adaptiveSize) {
        element.style.removeProperty("grid-column");
        return;
    }
    if (colSize == 0 || maxCols == 1) {
        element.style.setProperty("grid-column", `span 1`);
        return;
    }

    const width = (element?.clientWidth ?? 1) - 1;
    const span = Math.min(Math.ceil(width / colSize), maxCols);

    element.style.setProperty("grid-column", `span ${span}`);
}

export const separator = () => (
    <div class={`${styles.expanded} ${styles.separator}`} />
);

export default function ObjectView(props: {
    selectedAddress: bigint | undefined;
}) {
    const globalFallback = (
        <div class="absolute-centered">No Object Selected</div>
    );
    const detailsFallback = <div class="absolute-centered">Loading...</div>;

    const [details, detailsLoading, requestDetails] =
        useRequestAndResponsePacket<GetInstanceDetailsResult>();

    // request the instance data on select
    createEffect(() => {
        if (!props.selectedAddress) return;

        requestDetails({
            $case: "getInstanceDetails",
            getInstanceDetails: {
                address: props.selectedAddress,
            },
        });
    });

    const classDetails = createMemo(() => {
        if (!props.selectedAddress) return undefined;
        return details()?.classDetails;
    });
    const className = createMemo(() => {
        const details = classDetails();
        if (!details?.clazz) return "";

        protoTypeToString({
            Info: {
                $case: "classInfo",
                classInfo: details.clazz,
            },
        });
    });
    const interfaces = createMemo(() => {
        const details = classDetails();
        if (!details?.interfaces) return "";
        return details?.interfaces
            .map((info) =>
                protoTypeToString({
                    Info: {
                        $case: "classInfo",
                        classInfo: info,
                    },
                })
            )
            .join(", ");
    });

    const [search, setSearch] = createSignal<string>("");
    // TODO: Store in localStorage
    const [adaptiveSize, setAdaptiveSize] = createSignal(true);
    const [columnCount, setColumnCount] = createSignal(2);
    const [deferredColumnCount, setDeferredColumnCount] = createSignal(2);

    let container: HTMLDivElement | undefined;
    createEffect(
        on(columnCount, () => {
            if (container) {
                const count = columnCount()
                container.style.setProperty(
                    "--type-grid-columns",
                    count.toString()
                );
                setDeferredColumnCount(count);
            }
        })
    );

    const spanFn = createMemo<SpanFn>(() => {
        const adapt = adaptiveSize();
        const cols = deferredColumnCount();

        return (e: HTMLDivElement, colSize: number) =>
            adaptiveSpanSize(e, colSize, cols, adapt);
    });

    const columnRadioSelect = (
        e: Event & {
            currentTarget: HTMLInputElement;
            target: HTMLInputElement;
        }
    ) => {
        if (!e.currentTarget.checked) return;
        setColumnCount(Number.parseInt(e.currentTarget.value));
    };

    return (
        <Show when={props.selectedAddress} fallback={globalFallback} keyed>
            <div
                class={`p-4 w-full h-full overflow-x-hidden ${styles.viewContainer}`}
                ref={container}
            >
                <div class="flex gap-4 mb-1 items-end">
                    <span class="text-xl font-mono flex-0">{className()}</span>
                    <span class="text-lg font-mono flex-0">{interfaces()}</span>
                    <span class="flex-1" />
                    <div class="py-1 whitespace-nowrap">
                        <input
                            class="px-2 py-1"
                            placeholder="Search"
                            onInput={(e) => setSearch(e.target.value)}
                            value={search()}
                        />

                        <div class="btn-group btn-group-horizontal px-4">
                            <input
                                type="radio"
                                name="grid-size"
                                data-title="1"
                                value={"1"}
                                onChange={columnRadioSelect}
                                class="btn btn-sm"
                                checked={columnCount() === 1}
                            />
                            <input
                                type="radio"
                                name="grid-size"
                                data-title="2"
                                value={2}
                                id="2"
                                class="btn btn-sm"
                                onChange={columnRadioSelect}
                                checked={columnCount() === 2}
                            />
                            <input
                                type="radio"
                                name="grid-size"
                                data-title="3"
                                value={3}
                                id="3"
                                class="btn btn-sm"
                                onChange={columnRadioSelect}
                                checked={columnCount() === 3}
                            />
                            <input
                                type="radio"
                                name="grid-size"
                                data-title="4"
                                id="4"
                                value={4}
                                class="btn btn-sm"
                                onChange={columnRadioSelect}
                                checked={columnCount() === 4}
                            />

                            <label for="4" hidden>
                                4
                            </label>
                            <label for="3" hidden>
                                3
                            </label>
                            <label for="2" hidden>
                                2
                            </label>
                            <label for="1" hidden>
                                1
                            </label>
                        </div>
                    </div>

                    {/* A11Y <3 */}
                    <label class="label">
                        <span class="label-text text-base whitespace-nowrap">
                            Adaptive Row Sizing
                        </span>

                        <input
                            class="mx-2"
                            id="adaptive-row-size"
                            data-title="Adaptive Row Size"
                            type="checkbox"
                            checked={adaptiveSize()}
                            aria-checked={adaptiveSize()}
                            onChange={(e) => {
                                return setAdaptiveSize(e.currentTarget.checked);
                            }}
                        />
                    </label>
                </div>
                {separator()}
                <Show
                    when={!detailsLoading() && classDetails()}
                    fallback={detailsFallback}
                >
                    <TypeSection
                        spanFn={spanFn()}
                        details={classDetails()!}
                        selectedAddress={props.selectedAddress!}
                        search={search()}
                    />
                </Show>
            </div>
        </Show>
    );
}
