import { Icon } from "solid-heroicons";
import Toggle from "../form/Toggle";
import { SetStoreFunction, Store } from "solid-js/store";
import { magnifyingGlass } from "solid-heroicons/solid";
import { JSX } from "solid-js";
import {
    ProtoFieldInfo,
    ProtoMethodInfo,
    ProtoPropertyInfo,
    ProtoTypeInfo,
} from "../../misc/proto/il2cpp";
import { stringToPrimitive } from "../../misc/utils";

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
    return (
        <div
            {...props}
            class={`dropdown dropdown-bottom dropdown-end flex-0 ${props.class}`}
        >
            <button class="p-2" title="Settings">
                <Icon path={magnifyingGlass} class="w-6 h-6" />
            </button>

            <div
                class="
                dropdown-content shadow menu text-base
                bg-neutral-400 dark:bg-zinc-800
                justify-center gap-2 w-80 p-3
                my-2 z-20 rounded-box cursor-auto"
            >
                <Toggle
                    class="h-8"
                    title="Fields"
                    checkedSignal={[
                        () => props.settings.filterFields,
                        (b) => props.setSettings("filterFields", b),
                    ]}
                />
                <Toggle
                    class="h-8"
                    title="Getters"
                    checkedSignal={[
                        () => props.settings.filterGetters,
                        (b) => props.setSettings("filterGetters", b),
                    ]}
                />
                <Toggle
                    class="h-8"
                    title="Setters"
                    checkedSignal={[
                        () => props.settings.filterSetters,
                        (b) => props.setSettings("filterSetters", b),
                    ]}
                />
                <Toggle
                    class="h-8"
                    title="Methods"
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
                type.Info.classInfo.clazz
                    .toLocaleLowerCase()
                    .includes(search) ||
                type.Info.classInfo.namespaze
                    .toLocaleLowerCase()
                    .includes(search) ||
                type.Info.classInfo.generics.some((e) => typeMatches(e, search))
            );
        }
        case "genericInfo": {
            return type.Info.genericInfo.name
                .toLocaleLowerCase()
                .includes(search);
        }
        case "primitiveInfo": {
            return stringToPrimitive(search) !== undefined;
        }
        case "structInfo": {
            const clazzInfo = type.Info.structInfo.clazz;
            return (
                (clazzInfo?.clazz.toLocaleLowerCase().includes(search) ||
                    clazzInfo?.namespaze
                        .toLocaleLowerCase()
                        .includes(search)) ??
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
            Object.entries(item.args).some(
                ([argName, argData]) =>
                    argName.toLocaleLowerCase().includes(search) ||
                    (settings.filterByTypes && typeMatches(argData, search))
            );
        const retTypeMatches =
            settings.filterByTypes &&
            item.returnType &&
            typeMatches(item.returnType, search);

        return (
            nameMatches ||
            parameterMatches ||
            retTypeMatches ||
            parameterMatches
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
            settings.filterByTypes &&
            item.type &&
            typeMatches(item.type, search);

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
            settings.filterByTypes &&
            item.type &&
            typeMatches(item.type, search);

        return matchesName || matchesType;
    });
}
