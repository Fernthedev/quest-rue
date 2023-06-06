import { Icon } from "solid-heroicons";
import { cog_6Tooth } from "solid-heroicons/solid";
import { createContext, useContext, ParentProps } from "solid-js";
import { createLocalSignal } from "../misc/utils";
import Toggle from "./form/Toggle";
import SegmentedControl from "./form/SegmentedControl";

// TODO: Store in local storage

function makeSettingsContext(
    rawInput = false,
    darkMode = true,
    columnCount = 2
) {
    const [getRawInput, setRawInput] = createLocalSignal("rawInput", () =>
        rawInput ? "true" : "false"
    );
    const [getDarkMode, setDarkMode] = createLocalSignal("darkMode", () =>
        darkMode ? "true" : "false"
    );
    const [getColumnCount, setColumnCount] = createLocalSignal(
        "columnCount",
        () => columnCount.toString()
    );

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
                <Toggle
                    title="Dark mode"
                    checkedSignal={[
                        () => darkMode() === "true",
                        (b) => setDarkMode(b ? "true" : "false"),
                    ]}
                />
                <Toggle
                    title="Use raw input"
                    checkedSignal={[
                        () => rawInput() === "true",
                        (b) => setRawInput(b ? "true" : "false"),
                    ]}
                />

                
                <SegmentedControl
                    values={["1", "2", "3", "4"]}
                    onValueSelect={setColumnCount}
                    selectedValue={columnCount()}
                    title="Columns"
                />
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
