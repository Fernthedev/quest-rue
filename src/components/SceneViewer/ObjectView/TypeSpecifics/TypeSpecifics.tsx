import {
  For,
  JSX,
  Show,
  createMemo,
  createSignal,
  on,
  untrack,
} from "solid-js";
import styles from "../ObjectView.module.css";
import { Store } from "solid-js/store";
import { PacketJSON } from "../../../../misc/events";
import {
  ProtoClassDetails,
  ProtoDataPayload,
  ProtoDataSegment,
  ProtoFieldInfo,
  ProtoMethodInfo,
  ProtoPropertyInfo,
} from "../../../../misc/proto/il2cpp";
import { GetInstanceValuesResult } from "../../../../misc/proto/qrue";
import { FilterSettings } from "../FilterSettings";
import { separator } from "../ObjectView";

export function TypeSpecifics(props: {
  details?: PacketJSON<ProtoClassDetails>;
  initVals?: GetInstanceValuesResult;
  selected: ProtoDataPayload;
  search: string;
  filters: Store<FilterSettings>;
}) {
  const className = createMemo(() => {
    if (!props.details?.clazz) return "";
    return `${props.details.clazz.namespaze}::${props.details.clazz.clazz}`;
  });

  const [collapsed, setCollapsed] = createSignal(false);

  const helpers = createMemo(() =>
    Object.entries(TypeHelperMap)
      .filter(([typeString]) => typeString === className())
      .map(([typeString]) => typeString),
  );

  const parentSection = createMemo(() => (
    <Show when={props.details?.parent}>
      <TypeSpecifics
        details={props.details!.parent}
        initVals={props.initVals}
        selected={props.selected}
        search={props.search}
        filters={props.filters}
      />
    </Show>
  ));

  const [prev, setPrev] = createSignal<
    PacketJSON<ProtoClassDetails> | undefined
  >(undefined);

  const details = createMemo(() => {
    const eq = props.details === untrack(prev);
    console.log("details", props.details, untrack(prev), eq);
    setPrev(props.details);
    return props.details;
  });

  const helperSections = createMemo(
    on(details, () => {
      return (
        <For each={helpers()}>
          {(name) => {
            const fn = TypeHelperMap[name];
            return (
              <div>
                {fn(
                  props.selected,
                  props.search,
                  props.filters,
                  props.details!,
                  props.initVals,
                )}
                {separator()}
              </div>
            );
          }}
        </For>
      );
    }),
  );

  return (
    <Show
      when={helpers().length > 0 && props.details}
      fallback={parentSection()}
    >
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
          <text class="flex-1 min-w-0">{className()} Helper</text>
        </div>
        <Show
          when={!collapsed()}
          fallback={
            <>
              {separator()}
              {parentSection()}
            </>
          }
        >
          {helperSections()}
          {parentSection()}
        </Show>
      </div>
    </Show>
  );
}

// ---------- Registration Map -----------
export const TypeHelperMap: {
  [typeString: string]: (
    selected: ProtoDataPayload,
    search: string,
    filters: Store<FilterSettings>,
    details: PacketJSON<ProtoClassDetails>,
    initVals?: GetInstanceValuesResult,
  ) => JSX.Element;
} = {};

import { GameObjectSection } from "./GameObject";
import { RectTransformSection } from "./RectTransform";

TypeHelperMap["UnityEngine::GameObject"] = GameObjectSection;
TypeHelperMap["UnityEngine::Transform"] = GameObjectSection;
TypeHelperMap["UnityEngine::RectTransform"] = RectTransformSection;

// ---------- Utility Functions ----------
import { FieldCell } from "../FieldCell";
import { PropertyCell } from "../PropertyCell";
import { MethodCell } from "../MethodCell";

export function searchSelfAndParents<T>(
  details: ProtoClassDetails,
  fn: (details: ProtoClassDetails) => T | undefined,
) {
  let classDetails: ProtoClassDetails | undefined = details;
  let ret: T | undefined = undefined;
  while (classDetails != undefined) {
    ret = fn(classDetails);
    if (ret !== undefined) return ret;
    classDetails = classDetails.parent;
  }
  return ret;
}

function findByName<T extends { name: string }>(
  list: T[],
  search: string,
  extraFilter?: (item: T) => boolean,
) {
  return list.find(
    (item) => item.name === search && (extraFilter?.(item) ?? true),
  );
}

export function FieldCellByName(props: {
  fieldName: string;
  instance: ProtoDataPayload;
  instanceDetails: ProtoClassDetails;
  initVals?: GetInstanceValuesResult;
  class?: string;
  extraFilter?: (item: ProtoFieldInfo) => boolean;
}) {
  const field = createMemo(() =>
    // eslint-disable-next-line solid/reactivity
    searchSelfAndParents(props.instanceDetails, (details) =>
      findByName(details.fields, props.fieldName, props.extraFilter),
    ),
  );
  const fieldVals = createMemo(
    () =>
      props.initVals?.fieldValues as
        | {
            [key: string]: ProtoDataSegment;
          }
        | undefined,
  );

  return (
    <div class={props.class} style={{ display: "flex" }}>
      <Show when={field()} fallback={`Field ${props.fieldName} not found`}>
        <FieldCell
          field={field()!}
          selected={props.instance}
          initVal={fieldVals()?.[field()!.id.toString()]}
        />
      </Show>
    </div>
  );
}

export function PropertyCellByName(props: {
  propertyName: string;
  instance: ProtoDataPayload;
  instanceDetails: ProtoClassDetails;
  initVals?: GetInstanceValuesResult;
  class?: string;
  extraFilter?: (item: ProtoPropertyInfo) => boolean;
}) {
  const property = createMemo(() =>
    // eslint-disable-next-line solid/reactivity
    searchSelfAndParents(props.instanceDetails, (details) =>
      findByName(details.properties, props.propertyName, props.extraFilter),
    ),
  );
  const propVals = createMemo(
    () =>
      props.initVals?.propertyValues as
        | {
            [key: string]: ProtoDataSegment;
          }
        | undefined,
  );

  return (
    <div class={props.class} style={{ display: "flex" }}>
      <Show
        when={property()}
        fallback={`Property ${props.propertyName} not found`}
      >
        <PropertyCell
          prop={property()!}
          selected={props.instance}
          initVal={propVals()?.[property()!.getterId?.toString() ?? ""]}
        />
      </Show>
    </div>
  );
}

export function MethodCellByName(props: {
  methodName: string;
  instance: ProtoDataPayload;
  instanceDetails: ProtoClassDetails;
  class?: string;
  extraFilter?: (item: ProtoMethodInfo) => boolean;
}) {
  const method = createMemo(() =>
    // eslint-disable-next-line solid/reactivity
    searchSelfAndParents(props.instanceDetails, (details) =>
      findByName(details.methods, props.methodName, props.extraFilter),
    ),
  );

  return (
    <div class={props.class} style={{ display: "flex" }}>
      <Show when={method()} fallback={`Method ${props.methodName} not found`}>
        <MethodCell
          method={method()!}
          selected={props.instance}
          highlight={false}
        />
      </Show>
    </div>
  );
}
