import {
  For,
  Show,
  createDeferred,
  createEffect,
  createMemo,
  createSignal,
  on,
} from "solid-js";
import { PacketJSON } from "../../../misc/events";
import {
  ProtoClassDetails,
  ProtoDataPayload,
  ProtoDataSegment,
  ProtoMethodInfo,
} from "../../../misc/proto/il2cpp";
import styles from "./ObjectView.module.css";
import { FieldCell } from "./FieldCell";
import { PropertyCell } from "./PropertyCell";
import { MethodCell } from "./MethodCell";
import { SpanFn, separator } from "./ObjectView";
import { OverloadCell } from "./OverloadCell";
import { createUpdatingSignal } from "../../../misc/utils";
import { SetStoreFunction, Store } from "solid-js/store";
import {
  FilterSettings,
  filterFields,
  filterMethods,
  filterProperties,
} from "./FilterSettings";
import { GetInstanceValuesResult } from "../../../misc/proto/qrue";

interface OverloadInfo {
  name: string;
  count: number;
}

export function TypeSection(props: {
  details?: PacketJSON<ProtoClassDetails>;
  initVals?: GetInstanceValuesResult;
  selected: ProtoDataPayload;
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
  // recalculate on changes to spanFn, aka if column count changes
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

  const fields = createMemo(() =>
    props.statics ? props.details?.staticFields : props.details?.fields
  );
  const properties = createMemo(() =>
    props.statics ? props.details?.staticProperties : props.details?.properties
  );
  const methods = createMemo(() =>
    props.statics ? props.details?.staticMethods : props.details?.methods
  );
  const filteredFields = createDeferred(() =>
    filterFields(fields() ?? [], props.search, props.filters)
  );
  const filteredProps = createDeferred(() => {
    return filterProperties(properties() ?? [], props.search, props.filters);
  });
  const filteredMethods = createDeferred(() =>
    filterMethods(methods() ?? [], props.search, props.filters)
  );

  const fieldVals = createMemo(
    () =>
      props.initVals?.fieldValues as
        | {
            [key: string]: ProtoDataSegment;
          }
        | undefined
  );
  const propVals = createMemo(
    () =>
      props.initVals?.propertyValues as
        | {
            [key: string]: ProtoDataSegment;
          }
        | undefined
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

  // methodName with overloads -> isExpanded
  const [expanded, setExpanded] = createUpdatingSignal(
    () =>
      groupedMethods().reduce((map, [name, methodInfos]) => {
        // more than one method
        if (methodInfos.length > 1) map.set(name, false);
        return map;
      }, new Map<string, boolean>()),
    { equals: false }
  );

  // adds the current class to statics, trimming unnecessary data
  const addStatic = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { parent, fields, properties, methods, ...smaller } =
      props.details ?? {};
    props.setStatics(className(), smaller);
  };
  const removeStatic = () => props.setStatics(className(), undefined!);

  return (
    <div>
      {/* header div */}
      <div
        role="checkbox"
        tabIndex={"0"}
        aria-checked={collapsed()}
        class={`${styles.expanded} header`}
        // squares bottom corners when collapsed
        classList={{ [styles.rounded]: !collapsed() }}
        onKeyPress={() => setCollapsed(!collapsed())}
        onClick={() => setCollapsed(!collapsed())}
      >
        <text class="flex-none mr-1 inline-block w-4 text-center">
          {collapsed() ? "+" : "-"}
        </text>
        <text class="flex-1 min-w-0">{className()}</text>
        {/* button to either add or remove as a static depending on which view it's in */}
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
        {/* spacing above, all the grids have 1 margin below if they have elements */}
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
                selected={props.selected}
                initVal={fieldVals()?.[item.id.toString()]}
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
                selected={props.selected}
                spanFn={props.spanFn}
                initVal={propVals()?.[item.getterId?.toString() ?? ""]}
              />
            )}
          </For>
        </div>
        <div
          class={`${styles.grid}`}
          classList={{ "mb-1": groupedMethods().length > 0 }}
        >
          <For
            // convert the [methodName, methods with that name[]][] to
            // a list with plain methods if there is only one method per name,
            // an overload cell of that name if the overload isn't expanded,
            // or an overload cell followed by all the methods otherwise
            each={groupedMethods()
              .map(([name, methodInfos]) => {
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
              // shenanigans to distinguish between methods and overloads
              const overload = createMemo(() => item as OverloadInfo);
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
                      selected={props.selected}
                      highlight={expanded().has(item.name)}
                    />
                  }
                >
                  <OverloadCell
                    name={overload().name}
                    count={overload().count}
                    toggleFn={() =>
                      setExpanded((prev) =>
                        prev.set(item.name, !prev.get(item.name))
                      )
                    }
                    colSize={colSize()}
                    spanFn={props.spanFn}
                    expanded={expanded().get(item.name) ?? false}
                  />
                </Show>
              );
            }}
          </For>
        </div>
      </Show>
      {/* type section for parent type */}
      <Show when={props.details?.parent}>
        {separator()}
        <TypeSection
          details={props.details?.parent}
          initVals={props.initVals}
          selected={props.selected}
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
