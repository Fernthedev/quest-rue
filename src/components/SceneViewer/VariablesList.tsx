import { ProtoClassDetails } from "../../misc/proto/il2cpp";
import { useNavigate } from "@solidjs/router";
import { objectUrl } from "../../App";
import { ActionButton } from "./InputCell";
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onMount,
} from "solid-js";
import { protoClassDetailsToString } from "../../misc/types/type_matching";
import { useSettings } from "../Settings";
import { separator } from "./ObjectView/ObjectView";
import { chevronDoubleRight, xMark } from "solid-heroicons/outline";
import { getVariable, variables } from "../../misc/handlers/variable_list";
import {
  createFocusSignal,
  makeFocusListener,
} from "@solid-primitives/active-element";
import { isVariableNameFree } from "../../misc/handlers/variable_list";
import { removeVariable } from "../../misc/handlers/variable_list";
import { updateVariable } from "../../misc/handlers/variable_list";

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
      false
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
            if (props.addr) navigate(objectUrl(BigInt(props.addr)));
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
        <span class="font-mono">0x{BigInt(props.addr).toString(16)}</span>
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

export function VariablesList() {
  // typeInfo string -> typeInfo, variable addrs with that type
  const types = createMemo(() =>
    Object.entries(variables).reduce((prev, [addr, { type }]) => {
      const addrBigInt = BigInt(addr);
      const typeString = protoClassDetailsToString(type);
      const entry = prev.get(typeString);

      if (!entry) prev.set(typeString, [type, [addrBigInt]]);
      else entry[1].push(addrBigInt);

      return prev;
    }, new Map<string, [ProtoClassDetails, bigint[]]>())
  );

  // use the string key in the <For> to keep it from recreating all the inputs
  // when the stpre changes, which would cause you to lose focus each keystroke
  return (
    <div class="flex flex-col p-2 gap-1 overflow-hidden">
      <For each={Array.from(types().keys())}>
        {(key) => {
          // needs to be reactive on types here
          const data = createMemo(() => types().get(key)!);
          return <TypeHeader type={data()[0]} vars={data()[1]} />;
        }}
      </For>
    </div>
  );
}
