import { Icon } from "solid-heroicons";
import Toggle from "../form/Toggle";
import { SetStoreFunction, Store } from "solid-js/store";
import { magnifyingGlass } from "solid-heroicons/solid";
import { JSX } from "solid-js";

export interface FilterSettings {
    filterFields: boolean;
    filterGetters: boolean;
    filterSetters: boolean;
    filterMethods: boolean;
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
                justify-center gap-2 w-60 p-3
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
            </div>
        </div>
    );
}
