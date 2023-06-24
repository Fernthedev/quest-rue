import { Show, createEffect, createMemo, createSignal, on } from "solid-js";
import { useRequestAndResponsePacket } from "../../misc/events";
import { GetInstanceDetailsResult } from "../../misc/proto/qrue";

import styles from "./ObjectView.module.css";
import { protoTypeToString } from "../../misc/utils";
import { TypeSection } from "./TypeSection";
import { useSettings } from "../Settings";
import { ProtoClassDetails } from "../../misc/proto/il2cpp";
import { SetStoreFunction, createStore } from "solid-js/store";
import { FilterSettings, FilterSettingsDropdown } from "./FilterSettings";
import { ActionButton } from "../InputCell";
import { addVariable } from "../VariablesList";

export type SpanFn = (e: HTMLDivElement, colSize: number) => void;

export function adaptiveSpanSize(
  element: HTMLDivElement,
  colSize: number,
  maxCols: number
) {
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
  setStatics: SetStoreFunction<{ [key: string]: ProtoClassDetails }>;
}) {
  const { columnCount } = useSettings();
  const [filters, setFilters] = createStore<FilterSettings>({
    filterFields: true,
    filterGetters: true,
    filterMethods: true,
    filterSetters: true,
    filterByParameterName: false,
    filterByTypes: false,
  } satisfies FilterSettings);

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
    if (!details?.clazz) return "Unknown";

    return protoTypeToString({
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

  const [search, setSearch] = createSignal("");
  // we need to make sure the span calculation happens after the grid has updated its column number
  const [deferredColumnCount, setDeferredColumnCount] = createSignal(
    Number.parseInt(columnCount())
  );

  let container: HTMLDivElement | undefined;
  createEffect(
    on(columnCount, () => {
      if (container) {
        container.style.setProperty("--type-grid-columns", columnCount());
        setDeferredColumnCount(Number.parseInt(columnCount()));
      }
    })
  );

  const spanFn = createMemo<SpanFn>(() => {
    const cols = deferredColumnCount();

    return (e: HTMLDivElement, colSize: number) =>
      adaptiveSpanSize(e, colSize, cols);
  });

  return (
    <Show when={props.selectedAddress} fallback={globalFallback} keyed>
      <div
        class={`p-4 w-full h-full overflow-x-hidden`}
        ref={container}
        style={{ "--type-grid-columns": columnCount() }}
      >
        <div class="flex gap-4 mb-1 items-end pr-10">
          <span class="text-lg flex-0 -mr-2">Selected:</span>
          <span class="text-xl font-mono flex-0">{className()}</span>
          <span class="text-lg flex-0 -mx-2">at</span>
          <span class="text-xl font-mono flex-0">
            0x{props.selectedAddress?.toString(16)}
          </span>
          <ActionButton
            class="small-button"
            img="save.svg"
            onClick={() => {
              const details = classDetails();
              if (props.selectedAddress && details) {
                addVariable(`0x${props.selectedAddress.toString(16)}`, {
                  Info: {
                    $case: "classInfo",
                    classInfo: details.clazz!,
                  },
                  size: 8,
                  isByref: false,
                });
              }
            }}
            tooltip="Save variable"
          />
          <span class="text-lg font-mono flex-0">{interfaces()}</span>
          <span class="flex-1" />
          <div class="whitespace-nowrap flex flex-row join">
            <input
              class="px-2 py-1 join-item"
              placeholder="Filter"
              onInput={(e) => setSearch(e.target.value.toLocaleLowerCase())}
              value={search()}
            />
            <FilterSettingsDropdown
              class="join-item"
              settings={filters}
              setSettings={setFilters}
            />
          </div>
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
            statics={false}
            setStatics={props.setStatics}
            filters={filters}
          />
        </Show>
      </div>
    </Show>
  );
}
