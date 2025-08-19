import { ProtoClassDetails } from "../../misc/proto/il2cpp";
import { useNavigate } from "@solidjs/router";
import { selectClass } from "../../App";
import { ActionButton } from "./InputCell";
import {
  For,
  Show,
  createMemo,
  createSignal,
  onMount,
  createEffect,
} from "solid-js";
import { protoClassDetailsToString } from "../../misc/types/type_matching";
import { useSettings } from "../Settings";
import { separator } from "./ObjectView/ObjectView";
import {
  chevronDoubleRight,
  plus,
  videoCamera,
  xMark,
} from "solid-heroicons/outline";
import { getVariable, variables } from "../../misc/handlers/variable_list";
import { makeFocusListener } from "@solid-primitives/active-element";
import { isVariableNameFree } from "../../misc/handlers/variable_list";
import { removeVariable } from "../../misc/handlers/variable_list";
import { updateVariable } from "../../misc/handlers/variable_list";
import {
  CameraOptionsResult,
  GetCameraHoveredResult,
} from "../../misc/proto/qrue";
import { sendPacketResult } from "../../misc/commands";

function VariableCell(props: { addr: bigint }) {
  const { rawInput } = useSettings();

  const navigate = useNavigate();

  const name = createMemo(() => getVariable(props.addr)?.name ?? "");

  // Use a signal since we need to control ordering
  const [validName, setValidName] = createSignal(true);

  // if the new name is unique, update it, otherwise enable invalid input css
  const updateName = (val: string) => {
    const isValid = isVariableNameFree(val, props.addr);
    setValidName(isValid);
    if (isValid) updateVariable(props.addr, getVariable(props.addr).type, val);
  };

  // reset value to last valid name if focus is exited while it still has an invalid name
  let input: HTMLInputElement | undefined;
  onMount(() => {
    makeFocusListener(
      input!,
      // False positive
      // eslint-disable-next-line solid/reactivity
      (focused) => {
        if (!focused && !validName()) {
          setValidName(true);
          input!.value = name();
        }
      },
      false,
    );
  });

  return (
    <span>
      <span class="flex gap-1">
        <input
          class="small-input flex-1 min-w-0"
          classList={{ invalid: !validName() }}
          onInput={(e) => {
            updateName(e.currentTarget.value);
          }}
          value={name()}
          ref={input}
        />
        <ActionButton
          class="small-button min-w-max"
          img={chevronDoubleRight}
          onClick={() => {
            if (props.addr) selectClass(navigate, BigInt(props.addr));
          }}
          tooltip="Select as object"
        />
        <ActionButton
          class="small-button min-w-max"
          img={xMark}
          onClick={() => {
            if (props.addr) removeVariable(props.addr);
          }}
          tooltip="Remove variable"
        />
      </span>
      <Show when={rawInput()}>
        <span class="mono">0x{BigInt(props.addr).toString(16)}</span>
      </Show>
    </span>
  );
}

function TypeHeader(props: { type: ProtoClassDetails; vars: bigint[] }) {
  const [expanded, setExpanded] = createSignal(true);

  const className = createMemo(() => protoClassDetailsToString(props.type));

  return (
    <div class="flex flex-col">
      {separator()}
      <div
        role="checkbox"
        tabIndex={"0"}
        aria-checked={!expanded()}
        class="header"
        onKeyPress={() => setExpanded(!expanded())}
        onClick={() => setExpanded(!expanded())}
      >
        {/* negative left margin to undo x padding */}
        <text class="flex-none -ml-3 mr-1 inline-block w-4 text-center">
          {expanded() ? "-" : "+"}
        </text>
        <text class="flex-1 min-w-0">{className()}</text>
      </div>
      <div class="flex flex-col gap-1">
        <Show when={expanded()}>
          <For each={props.vars}>{(item) => <VariableCell addr={item} />}</For>
        </Show>
      </div>
    </div>
  );
}

function VariablesListContent() {
  // typeInfo string -> typeInfo, variable addrs with that type
  const types = createMemo(() =>
    Object.entries(variables).reduce((prev, [addr, { type }]) => {
      const addrBigInt = BigInt(addr);
      const typeString = protoClassDetailsToString(type);
      const entry = prev.get(typeString);

      if (!entry) prev.set(typeString, [type, [addrBigInt]]);
      else entry[1].push(addrBigInt);

      return prev;
    }, new Map<string, [ProtoClassDetails, bigint[]]>()),
  );

  const emptyFallback = (
    <div class="w-full h-full pt-2 flex-1 overflow-hidden">
      {separator()}
      <div class="relative w-full h-full min-h-6">
        <div class="absolute-centered w-full">No Variables Saved</div>
      </div>
    </div>
  );

  // use the string key in the <For> to keep it from recreating all the inputs
  // when the store changes, which would cause you to lose focus each keystroke
  return (
    <Show when={types().size > 0} fallback={emptyFallback}>
      <div class="flex flex-col p-2 gap-1 overflow-x-hidden">
        <For each={Array.from(types().keys())}>
          {(key) => {
            // needs to be reactive on types here
            const data = createMemo(() => types().get(key)!);
            return <TypeHeader type={data()[0]} vars={data()[1]} />;
          }}
        </For>
      </div>
    </Show>
  );
}

function VariablesListHeader() {
  return (
    // negative bottom padding because the top padding extends above the separator too much
    <div class="space-x-2 whitespace-nowrap p-2 justify-center -mb-2">
      <SelectAddress />
      <CreateObject />
      <CameraSettings />
    </div>
  );
}

export function VariablesList() {
  return (
    <div class="flex flex-col w-full h-full">
      <VariablesListHeader />
      <VariablesListContent />
    </div>
  );
}

function SelectAddress() {
  const [input, setInput] = createSignal("");

  const navigate = useNavigate();

  return (
    <div class="dropdown dropdown-bottom flex-none">
      <ActionButton
        class="p-2"
        img={chevronDoubleRight}
        tooltip="Select address"
      />

      <div
        class="
                dropdown-content shadow menu text-base
                bg-neutral-200 dark:bg-zinc-900
                justify-center gap-2 w-60 p-3
                flex flex-row flex-nowrap
                my-2 z-20 rounded-box cursor-auto"
      >
        <input
          placeholder="Address"
          title="Address"
          class="w-full min-w-0"
          value={input()}
          onInput={(e) => {
            setInput(e.currentTarget.value);
          }}
        />
        <ActionButton
          class="p-2"
          img={chevronDoubleRight}
          onClick={() => {
            if (input().length > 0) selectClass(navigate, BigInt(input()));
          }}
        />
      </div>
    </div>
  );
}

function CreateObject() {
  function create() {
    return;
  }

  return (
    <div class="dropdown dropdown-bottom flex-none">
      <ActionButton class="p-2" img={plus} tooltip="Create new object" />

      <div
        class="
                dropdown-content shadow menu text-base
                bg-neutral-200 dark:bg-zinc-900
                justify-center gap-2 w-60 p-3 -ml-12
                my-2 z-10 rounded-box cursor-auto"
      >
        <h4 class="text-center">Create new object</h4>
        <text class="text-center italic text-sm">Not yet implemented</text>
        {/* TODO */}
        <button onClick={create} onKeyPress={create}>
          Create
        </button>
      </div>
    </div>
  );
}

function CameraSettings() {
  const navigate = useNavigate();

  const selectHovered = () =>
    sendPacketResult<GetCameraHoveredResult>({
      $case: "getCameraHovered",
      getCameraHovered: {},
    })[0].then((result) => {
      if (result.hoveredObject?.address)
        selectClass(navigate, result.hoveredObject?.address);
    });

  return (
    <div class="dropdown dropdown-bottom flex-none">
      <ActionButton
        class="p-2"
        img={videoCamera}
        tooltip="Select hovered object"
        onClick={selectHovered}
      />
    </div>
  );
}
