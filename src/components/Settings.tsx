import { Icon } from "solid-heroicons";
import { cog_6Tooth } from "solid-heroicons/outline";
import { createContext, useContext, ParentProps } from "solid-js";
import { createPersistentSignal } from "../misc/utils";
import Toggle from "./form/Toggle";
import SegmentedControl from "./form/SegmentedControl";

function makeSettingsContext(
  rawInput = false,
  darkMode = true,
  columnCount = 2,
) {
  const [getRawInput, setRawInput] = createPersistentSignal("rawInput", () =>
    rawInput ? "true" : "false",
  );
  const [getDarkMode, setDarkMode] = createPersistentSignal("darkMode", () =>
    darkMode ? "true" : "false",
  );
  const [getColumnCount, setColumnCount] = createPersistentSignal(
    "columnCount",
    () => columnCount.toString(),
  );

  // convert to and from strings
  return {
    rawInput: () => getRawInput() == "true",
    setRawInput: (val: boolean) => setRawInput(val ? "true" : "false"),
    darkMode: () => getDarkMode() == "true",
    setDarkMode: (val: boolean) => setDarkMode(val ? "true" : "false"),
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
    <div class="absolute top-2 right-5 dropdown dropdown-bottom dropdown-end flex-none">
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
          class="h-8"
          title="Dark mode"
          value={darkMode()}
          onToggle={setDarkMode}
        />
        <Toggle
          class="h-8"
          title="Use raw input"
          value={rawInput()}
          onToggle={setRawInput}
        />
        <SegmentedControl
          class={"h-8"}
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
  } & ParentProps,
) {
  const val = makeSettingsContext(
    // eslint-disable-next-line solid/reactivity
    props.rawInput,
    // eslint-disable-next-line solid/reactivity
    props.darkMode,
    // eslint-disable-next-line solid/reactivity
    props.columnCount,
  );

  return (
    <SettingsContext.Provider value={val}>
      {props.children}
    </SettingsContext.Provider>
  );
}
