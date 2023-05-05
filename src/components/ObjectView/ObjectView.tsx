import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { useRequestAndResponsePacket } from "../../misc/events";
import { GetInstanceDetailsResult } from "../../misc/proto/qrue";

import styles from "./ObjectView.module.css";
import { protoTypeToString } from "../../misc/utils";
import { TypeSection } from "./TypeSection";

export function refreshSpan(
    element: HTMLDivElement,
    colSize: number,
    maxCols: number
) {
    if (colSize == 0) return;
    element.style.setProperty("grid-column", "span 1");
    const width = (element?.clientWidth ?? 1) - 1;
    const span = Math.min(Math.ceil(width / colSize), maxCols);
    element.style.setProperty("grid-column", `span ${span}`);
}

export const separator = () => (
    <div class={`${styles.expanded} ${styles.separator}`} />
);

export default function ObjectView(props: { selectedAddress: number }) {
    const globalFallback = (
        <div class="absolute-centered">No Object Selected</div>
    );
    const detailsFallback = <div class="absolute-centered">Loading...</div>;

    const [details, detailsLoading, requestDetails] =
        useRequestAndResponsePacket<GetInstanceDetailsResult>();

    createEffect(() => {
        if (props.selectedAddress) {
            requestDetails({
                getInstanceDetails: {
                    address: props.selectedAddress,
                },
            });
        }
    });

    const classDetails = createMemo(() => {
        if (!props.selectedAddress) return undefined;
        return details()?.classDetails;
    });
    const className = createMemo(() =>
        classDetails()
            ? protoTypeToString({ classInfo: classDetails()?.clazz })
            : ""
    );
    const interfaces = createMemo(() => {
        if (!classDetails()) return "";
        return classDetails()
            ?.interfaces?.map((info) => protoTypeToString({ classInfo: info }))
            .join(", ");
    });

    const [search, setSearch] = createSignal<string>("");

    return (
        <Show when={props.selectedAddress} fallback={globalFallback}>
            <div class="p-4 w-full h-full">
                <div class="flex gap-4 mb-1 items-end">
                    <span class="text-xl font-mono flex-0">{className()}</span>
                    <span class="text-lg font-mono flex-0">{interfaces()}</span>
                    <span class="flex-1" />
                    <input
                        class="px-2 py-1"
                        placeholder="Search"
                        onInput={(e) => setSearch(e.target.value)}
                        value={search()}
                    />
                </div>
                {separator()}
                <Show when={!detailsLoading()} fallback={detailsFallback}>
                    <TypeSection
                        details={classDetails()!}
                        selectedAddress={props.selectedAddress}
                        search={search()}
                    />
                </Show>
            </div>
        </Show>
    );
}
