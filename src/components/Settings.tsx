import { Icon } from "solid-heroicons";
import { cog_6Tooth } from "solid-heroicons/solid";
import { createContext, useContext, ParentProps } from "solid-js";
import { createLocalSignal } from "../misc/utils";

// TODO: Store in local storage

function makeSettingsContext(
    rawInput = false,
    darkMode = true,
    columnCount = 2
) {
    const [getRawInput, setRawInput] = createLocalSignal("rawInput", () => rawInput ? "true" : "false");
    const [getDarkMode, setDarkMode] = createLocalSignal("darkMode", () => darkMode ? "true" : "false");
    const [getColumnCount, setColumnCount] = createLocalSignal("columnCount", () => columnCount.toString());

    return {
        rawInput: getRawInput,
        setRawInput: setRawInput,
        darkMode: getDarkMode,
        setDarkMode: setDarkMode,
        columnCount: getColumnCount,
        setColumnCount: setColumnCount,
    } as const;
}

const SettingsContext = createContext<ReturnType<typeof makeSettingsContext>>();

export const useSettings = () => useContext(SettingsContext)!;

export function SettingsMenu() {
    const {
        rawInput,
        setRawInput,
        darkMode,
        setDarkMode,
        columnCount,
        setColumnCount,
    } = useSettings();

    const columnRadioSelect = (
        e: Event & {
            currentTarget: HTMLInputElement;
            target: HTMLInputElement;
        }
    ) => {
        if (!e.currentTarget.checked) return;
        setColumnCount(e.currentTarget.value);
    };

    return (
        <div class="absolute top-2 right-5 dropdown dropdown-bottom dropdown-end flex-0">
            <button class="p-2" title="Settings">
                <Icon path={cog_6Tooth} class="w-6 h-6" />
            </button>

            <div
                class="
                dropdown-content shadow menu text-base
                bg-neutral-400 dark:bg-zinc-800
                justify-center gap-2 w-60 p-3
                my-2 z-10 rounded-box cursor-auto"
            >
                <span class="flex items-center h-8">
                    <label class="flex-1">Use raw input</label>
                    <input
                        type="checkbox"
                        class="toggle flex-none"
                        checked={rawInput() === "true"}
                        onInput={(e) => setRawInput(e.currentTarget.checked ? "true" : "false")}
                    />
                </span>
                <span class="flex items-center h-8">
                    <label class="flex-1">Dark mode</label>
                    <input
                        type="checkbox"
                        class="toggle flex-none"
                        checked={darkMode() === "true"}
                        onInput={(e) => setDarkMode(e.currentTarget.checked ? "true" : "false")}
                    />
                </span>
                <span class="flex items-center h-8">
                    <label class="flex-1">Columns</label>
                    <div class="join flex-none">
                        <input
                            type="radio"
                            name="grid-size"
                            aria-label="1"
                            value={"1"}
                            onChange={columnRadioSelect}
                            class="join-item btn btn-sm"
                            checked={columnCount() === "1"}
                        />
                        <input
                            type="radio"
                            name="grid-size"
                            aria-label="2"
                            value={2}
                            class="join-item btn btn-sm"
                            onChange={columnRadioSelect}
                            checked={columnCount() === "2"}
                        />
                        <input
                            type="radio"
                            name="grid-size"
                            aria-label="3"
                            value={3}
                            class="join-item btn btn-sm"
                            onChange={columnRadioSelect}
                            checked={columnCount() === "3"}
                        />
                        <input
                            type="radio"
                            name="grid-size"
                            aria-label="4"
                            value={4}
                            class="join-item btn btn-sm"
                            onChange={columnRadioSelect}
                            checked={columnCount() === "4"}
                        />
                    </div>
                </span>
            </div>
        </div>
    );
}

export function SettingsProvider(
    props: {
        rawInput?: boolean;
        darkMode?: boolean;
        columnCount?: number;
    } & ParentProps
) {
    const val = makeSettingsContext(
        // eslint-disable-next-line solid/reactivity
        props.rawInput,
        // eslint-disable-next-line solid/reactivity
        props.darkMode,
        // eslint-disable-next-line solid/reactivity
        props.columnCount
    );

    return (
        <SettingsContext.Provider value={val}>
            {props.children}
        </SettingsContext.Provider>
    );
}
