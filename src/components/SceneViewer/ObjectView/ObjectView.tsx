import { Show, createEffect, createMemo, createSignal, on } from "solid-js";
import { useRequestAndResponsePacket } from "../../../misc/events";
import {
  GetClassDetailsResult,
  GetInstanceValuesResult,
} from "../../../misc/proto/qrue";

import styles from "./ObjectView.module.css";
import { protoTypeToString } from "../../../misc/types/type_format";
import { TypeSection } from "./TypeSection";
import { useSettings } from "../../Settings";
import {
  ProtoClassDetails,
  ProtoDataPayload,
} from "../../../misc/proto/il2cpp";
import { SetStoreFunction, createStore } from "solid-js/store";
import { FilterSettings, FilterSettingsDropdown } from "./FilterSettings";
import { ActionButton } from "../InputCell";
import {
  addVariable,
  addrToString,
  isVariableNameFree,
  variables,
} from "../../../misc/handlers/variable_list";
import { protoClassDetailsToString } from "../../../misc/types/type_matching";
import { check } from "solid-heroicons/outline";
import { TypeSpecifics } from "./TypeSpecifics/TypeSpecifics";

export type SpanFn = (e: HTMLDivElement, colSize: number) => void;

export function adaptiveSpanSize(
  element: HTMLDivElement,
  colSize: number,
  maxCols: number,
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
  selected?: ProtoDataPayload;
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
    useRequestAndResponsePacket<GetClassDetailsResult>();

  // request the instance data on select
  createEffect(() => {
    const info = props.selected?.typeInfo?.Info;
    if (info?.$case != "classInfo" && info?.$case != "structInfo") return;

    const classInfo =
      info?.$case == "classInfo" ? info.classInfo : info.structInfo.clazz;

    requestDetails({
      $case: "getClassDetails",
      getClassDetails: {
        classInfo: classInfo,
      },
    });
  });

  const selectedAndDetails = createMemo(
    on(details, () => {
      if (!details) return {};
      return { selected: props.selected, details: details() };
    }),
  );

  const [values, , requestValues] =
    useRequestAndResponsePacket<GetInstanceValuesResult>();

  const selectedAddress = createMemo(() => {
    const data = selectedAndDetails().selected?.data?.Data;
    return data?.$case == "classData" ? data.classData : undefined;
  });

  createEffect(() => {
    const info = selectedAndDetails().selected?.typeInfo?.Info;
    if (info?.$case != "classInfo" && info?.$case != "structInfo") return;

    const selected = selectedAddress();
    if (!selected) return;

    console.log("request values");

    requestValues({
      $case: "getInstanceValues",
      getInstanceValues: {
        address: selected,
      },
    });
  });

  createEffect(() => console.log(values()));

  const classDetails = createMemo(() => {
    if (!selectedAndDetails().selected) return undefined;
    return selectedAndDetails().details?.classDetails;
  });
  const className = createMemo(() => {
    const details = classDetails();
    return protoClassDetailsToString(details);
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
        }),
      )
      .join(", ");
  });

  const [search, setSearch] = createSignal("");
  // we need to make sure the span calculation happens after the grid has updated its column number
  const [deferredColumnCount, setDeferredColumnCount] = createSignal(
    Number.parseInt(columnCount()),
  );

  let container: HTMLDivElement | undefined;
  createEffect(
    on(columnCount, () => {
      if (container) {
        container.style.setProperty("--type-grid-columns", columnCount());
        setDeferredColumnCount(Number.parseInt(columnCount()));
      }
    }),
  );

  const spanFn = createMemo<SpanFn>(() => {
    const cols = deferredColumnCount();

    return (e: HTMLDivElement, colSize: number) =>
      adaptiveSpanSize(e, colSize, cols);
  });

  const [varNameInput, setVarNameInput] = createSignal("");

  const trySaveVariable = () => {
    const details = classDetails();
    const addr = selectedAddress();
    const name = varNameInput();
    if (addr && details)
      addVariable(addr, details, name.length > 0 ? name : undefined);
  };

  let input: HTMLInputElement | undefined;

  // TODO: make this a component instead of duplicated
  const saveButton = (
    <Show
      when={
        selectedAddress() && !(addrToString(selectedAddress()!) in variables)
      }
      fallback={
        <ActionButton
          class="small-button"
          img={check}
          tooltip="Variable saved"
        />
      }
    >
      <span class="dropdown dropdown-left dropdown-end h-6">
        <ActionButton
          class="small-button"
          img="save"
          tooltip="Save variable"
          onClick={() => {
            input?.focus();
          }}
        />
        <div
          class="
          dropdown-content shadow menu text-base
          bg-neutral-400 dark:bg-zinc-800
          justify-center gap-1 w-60 p-2 mx-1 -my-1
          flex flex-row flex-nowrap
          z-20 rounded-box cursor-auto"
        >
          <input
            class="min-w-0 small-input"
            placeholder="Unnamed Variable"
            onInput={(e) => setVarNameInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") trySaveVariable();
            }}
            classList={{ invalid: !isVariableNameFree(varNameInput()) }}
            ref={input}
          />
          <ActionButton
            class="small-button"
            img={check}
            onClick={trySaveVariable}
            tooltip="Confirm"
          />
        </div>
      </span>
    </Show>
  );

  return (
    <Show when={selectedAndDetails().selected} fallback={globalFallback} keyed>
      <div
        class={`p-4 w-full h-full overflow-x-hidden`}
        ref={container}
        style={{ "--type-grid-columns": columnCount() }}
      >
        <div class="flex gap-4 mb-1 items-end pr-10">
          <div class="flex-grow-0 overflow-visible min-w-0">
            <div class="flex gap-x-2 flex-wrap">
              <span class="text-lg flex-none">Selected:</span>
              <span class="text-xl mono flex-none">{className()}</span>
              <Show when={selectedAddress()}>
                <span class="text-lg flex-none">at</span>
                <span class="text-xl mono flex-none">
                  0x{selectedAddress()!.toString(16)}
                </span>
                {saveButton}
              </Show>
              <span class="text-lg mono">{interfaces()}</span>
            </div>
          </div>
          <span class="flex-1 -ml-2" />
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
          <TypeSpecifics
            details={classDetails()!}
            initVals={values()}
            selected={selectedAndDetails().selected!}
            search={search()}
            filters={filters}
          />
          <TypeSection
            spanFn={spanFn()}
            details={classDetails()!}
            initVals={values()}
            selected={selectedAndDetails().selected!}
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
