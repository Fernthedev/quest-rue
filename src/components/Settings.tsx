import { Icon } from "solid-heroicons";
import { cog_6Tooth } from "solid-heroicons/outline";
import { createContext, useContext, ParentProps } from "solid-js";
import { createPersistentSignal } from "../misc/utils";
import Toggle from "./form/Toggle";
import SegmentedControl from "./form/SegmentedControl";
import { socket } from "../misc/commands";

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
  const [getMonoFont, setMonoFont] = createPersistentSignal(
    "monoFont",
    () => "",
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
    monoFont: getMonoFont,
    setMonoFont: setMonoFont,
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
    monoFont,
    setMonoFont,
    columnCount,
    setColumnCount,
  } = useSettings();

  return (
    <div class="absolute top-2 right-5 dropdown dropdown-bottom dropdown-end flex-none">
      <button class="p-2" title="Settings">
        <Icon path={cog_6Tooth} class="w-6 h-6" />
      </button>

      <div
        class="dropdown-content shadow menu text-base
               bg-zinc-300 dark:bg-zinc-800
               justify-center gap-2 w-60 p-3
               my-2 z-10 rounded-box cursor-auto"
      >
        <Toggle
          class="h-8"
          title="Dark mode"
          value={darkMode()}
          onToggle={setDarkMode}
        />
        <span class={`flex items-center h-8`}>
          <label class="flex-1">{"Mono Font"}</label>
          <input
            class="small-input w-28"
            value={monoFont()}
            onInput={(e) => setMonoFont(e.target.value)}
          />
        </span>
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
        <button
          class="small-button mt-1 mb-1"
          onClick={() => {
            socket.disconnect();
          }}
        >
          Disconnect
        </button>
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
