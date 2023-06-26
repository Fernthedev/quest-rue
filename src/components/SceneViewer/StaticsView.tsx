import { SetStoreFunction, createStore } from "solid-js/store";
import { ProtoClassDetails } from "../../misc/proto/il2cpp";
import {
  Show,
  createSignal,
  createEffect,
  on,
  createMemo,
  For,
} from "solid-js";
import { useSettings } from "../Settings";
import { SpanFn, adaptiveSpanSize, separator } from "./ObjectView/ObjectView";
import { TypeSection } from "./ObjectView/TypeSection";
import { Icon } from "solid-heroicons";
import { plus } from "solid-heroicons/outline";
import { useRequestAndResponsePacket } from "../../misc/events";
import { GetClassDetailsResult } from "../../misc/proto/qrue";
import {
  protoTypeToString,
  stringToProtoType,
} from "../../misc/types/type_format";
import toast from "solid-toast";
import {
  FilterSettings,
  FilterSettingsDropdown,
} from "./ObjectView/FilterSettings";

export function StaticsView(props: {
  statics: Readonly<{ [key: string]: ProtoClassDetails }>;
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

  const emptyFallback = (
    <div class="w-full h-full flex-1">
      {separator()}
      <div class="relative w-full h-full min-h-6">
        <div class="absolute-centered">No Static Classes Selected</div>
      </div>
    </div>
  );

  const [search, setSearch] = createSignal("");
  const [deferredColumnCount, setDeferredColumnCount] = createSignal(2);

  const [classInput, setClassInput] = createSignal("");
  const [newDetails, newDetailsLoading, requestNewDetails] =
    useRequestAndResponsePacket<GetClassDetailsResult>();

  function addClass() {
    if (classInput() in props.statics) return;

    const input = stringToProtoType(classInput());
    if (input?.Info?.$case != "classInfo") {
      toast.error("Invalid class name");
      return;
    }

    requestNewDetails({
      $case: "getClassDetails",
      getClassDetails: {
        classInfo: input.Info.classInfo,
      },
    });
  }

  createEffect(() => {
    const result = newDetails();
    if (!result?.classDetails?.clazz) return;

    const name = protoTypeToString({
      Info: {
        $case: "classInfo",
        classInfo: result.classDetails.clazz,
      },
    });
    if (name in props.statics) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { parent, fields, properties, methods, ...smaller } =
      result.classDetails ?? {};
    props.setStatics(name, smaller);
  });

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
    <div
      class={`p-4 w-full h-full flex flex-col overflow-x-hidden`}
      ref={container}
      style={{ "--type-grid-columns": columnCount() }}
    >
      <div class="flex gap-4 mb-1 items-end">
        <span class="text-xl flex-1 -mr-2">Static Class Members</span>

        <div class="whitespace-nowrap join">
          <input
            class="px-2 join-item"
            placeholder="Filter"
            onInput={(e) => setSearch(e.target.value)}
            value={search()}
          />
          <FilterSettingsDropdown
            class="join-item"
            settings={filters}
            setSettings={setFilters}
          />
        </div>

        <div class="whitespace-nowrap join">
          <input
            class="px-2 join-item"
            placeholder="Add Class"
            onInput={(e) => setClassInput(e.target.value.trim())}
            value={classInput()}
          />
          <button class="p-2 join-item" onClick={addClass}>
            <Show
              when={newDetailsLoading()}
              fallback={<Icon path={plus} class="w-6 h-6" />}
            >
              <img
                src="/src/assets/loading.svg"
                class="animate-spin"
                elementtiming={"Loading"}
                fetchpriority={"auto"}
                alt="Loading"
              />
            </Show>
          </button>
        </div>
      </div>
      <For each={Object.values(props.statics)} fallback={emptyFallback}>
        {(details) => (
          <div>
            {separator()}
            <TypeSection
              spanFn={spanFn()}
              details={details}
              selectedAddress={0n}
              search={search()}
              statics={true}
              setStatics={props.setStatics}
              filters={filters}
            />
          </div>
        )}
      </For>
    </div>
  );
}
