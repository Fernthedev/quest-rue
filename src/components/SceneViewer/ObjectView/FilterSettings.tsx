import { Icon } from "solid-heroicons";
import Toggle from "../../form/Toggle";
import { SetStoreFunction, Store } from "solid-js/store";
import { adjustmentsHorizontal } from "solid-heroicons/outline";
import { JSX, onCleanup, onMount, splitProps } from "solid-js";
import {
  ProtoFieldInfo,
  ProtoMethodInfo,
  ProtoPropertyInfo,
  ProtoTypeInfo,
} from "../../../misc/proto/il2cpp";
import { stringToPrimitive } from "../../../misc/types/type_format";

export interface FilterSettings {
  filterFields: boolean;
  filterGetters: boolean;
  filterSetters: boolean;
  filterMethods: boolean;
  filterByTypes: boolean;
  filterByParameterName: boolean;
}

export function FilterSettingsDropdown(
  props: {
    settings: Store<FilterSettings>;
    setSettings: SetStoreFunction<FilterSettings>;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  let parent: HTMLDivElement | undefined;
  let child: HTMLDivElement | undefined;

  // prevent menu from causing overflow in parent containers when hidden
  const callback = () => {
    if (parent && child) {
      const showing = getComputedStyle(child).visibility != "hidden";
      parent.style.overflow = showing ? "visible" : "hidden";
    }
  };
  onMount(() => document.addEventListener("click", callback));
  onCleanup(() => document.removeEventListener("click", callback));

  // separate the properties for the <div>
  const [, divProps] = splitProps(props, ["settings", "setSettings"]);

  return (
    <div
      {...divProps}
      ref={parent}
      class={`dropdown dropdown-bottom dropdown-end flex-none ${props.class}`}
      style={{ overflow: "hidden" }}
    >
      <button class="p-2" title="Settings">
        <Icon path={adjustmentsHorizontal} class="w-6 h-6" />
      </button>

      <div
        class="
                dropdown-content shadow menu text-base
                bg-neutral-400 dark:bg-zinc-800
                justify-center gap-2 w-80 p-3
                my-2 z-20 rounded-box cursor-auto"
        ref={child}
      >
        <Toggle
          class="h-8"
          title="Show Fields"
          checkedSignal={[
            () => props.settings.filterFields,
            (b) => props.setSettings("filterFields", b),
          ]}
        />
        <Toggle
          class="h-8"
          title="Show Getters"
          checkedSignal={[
            () => props.settings.filterGetters,
            (b) => props.setSettings("filterGetters", b),
          ]}
        />
        <Toggle
          class="h-8"
          title="Show Setters"
          checkedSignal={[
            () => props.settings.filterSetters,
            (b) => props.setSettings("filterSetters", b),
          ]}
        />
        <Toggle
          class="h-8"
          title="Show Methods"
          checkedSignal={[
            () => props.settings.filterMethods,
            (b) => props.setSettings("filterMethods", b),
          ]}
        />
        <Toggle
          class="h-8"
          title="Filter by parameter name"
          checkedSignal={[
            () => props.settings.filterByParameterName,
            (b) => props.setSettings("filterByParameterName", b),
          ]}
        />
        <Toggle
          class="h-8"
          title="Filter by type"
          checkedSignal={[
            () => props.settings.filterByTypes,
            (b) => props.setSettings("filterByTypes", b),
          ]}
        />
      </div>
    </div>
  );
}

function typeMatches(type: Readonly<ProtoTypeInfo>, search: string): boolean {
  switch (type.Info?.$case) {
    case "arrayInfo": {
      return (
        (type.Info.arrayInfo.memberType &&
          typeMatches(type.Info.arrayInfo.memberType, search)) ??
        false
      );
    }
    case "classInfo": {
      return (
        type.Info.classInfo.clazz.toLocaleLowerCase().includes(search) ||
        type.Info.classInfo.namespaze.toLocaleLowerCase().includes(search) ||
        type.Info.classInfo.generics.some((e) => typeMatches(e, search))
      );
    }
    case "genericInfo": {
      return type.Info.genericInfo.name.toLocaleLowerCase().includes(search);
    }
    case "primitiveInfo": {
      return stringToPrimitive(search) === type.Info.primitiveInfo;
    }
    case "structInfo": {
      const clazzInfo = type.Info.structInfo.clazz;
      return (
        (clazzInfo?.clazz.toLocaleLowerCase().includes(search) ||
          clazzInfo?.namespaze.toLocaleLowerCase().includes(search)) ??
        false
      );
    }
  }

  return false;
}

export function filterMethods(
  list: ProtoMethodInfo[],
  search: string,
  settings: Readonly<FilterSettings>
) {
  if (!settings.filterMethods) return [];

  return list.filter((item) => {
    const nameMatches = item.name?.toLocaleLowerCase().includes(search);
    const parameterMatches =
      settings.filterByParameterName &&
      item.args.some(
        ({ name, type }) =>
          name.toLocaleLowerCase().includes(search) ||
          (settings.filterByTypes && typeMatches(type!, search))
      );
    const retTypeMatches =
      settings.filterByTypes &&
      item.returnType &&
      typeMatches(item.returnType, search);

    return (
      nameMatches || parameterMatches || retTypeMatches || parameterMatches
    );
  });
}
export function filterProperties(
  list: ProtoPropertyInfo[],
  search: string,
  settings: Readonly<FilterSettings>
) {
  if (!settings.filterGetters && !settings.filterSetters) return [];

  return list.filter((item) => {
    const matchGetter = settings.filterGetters && item.getterId;
    const matchSetter = settings.filterSetters && item.setterId;

    if (!matchGetter && !matchSetter) return false;

    const matchesName = item.name
      ?.toLocaleLowerCase()
      .includes(search.toLocaleLowerCase());

    const matchesType =
      settings.filterByTypes && item.type && typeMatches(item.type, search);

    return matchesName || matchesType;
  });
}
export function filterFields(
  list: Readonly<ProtoFieldInfo[]>,
  search: string,
  settings: Readonly<FilterSettings>
) {
  if (!settings.filterFields) return [];

  return list.filter((item) => {
    const matchesName = item.name
      ?.toLocaleLowerCase()
      .includes(search.toLocaleLowerCase());

    const matchesType =
      settings.filterByTypes && item.type && typeMatches(item.type, search);

    return matchesName || matchesType;
  });
}
