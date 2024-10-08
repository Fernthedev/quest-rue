import {
  Show,
  createMemo,
  JSX,
  createDeferred,
  onMount,
  createSignal,
  createEffect,
} from "solid-js";
import { PacketJSON } from "../../misc/events";
import { sendPacketResult } from "../../misc/commands";
import {
  ProtoTypeInfo,
  ProtoTypeInfo_Primitive,
} from "../../misc/proto/il2cpp";

import styles from "./InputCell.module.css";
import { errorHandle } from "../../misc/utils";
import {
  protoTypeToString,
  stringToProtoData,
} from "../../misc/types/type_format";
import { isProtoClassInstanceOf } from "../../misc/types/type_matching";
import { selectClass, selectData } from "../../App";
import { useNavigate } from "@solidjs/router";
import { createOptions } from "@thisbeyond/solid-select";
import { useSettings } from "../Settings";
import { makeFocusListener } from "@solid-primitives/active-element";
import { Icon } from "solid-heroicons";
import { check, chevronDoubleRight } from "solid-heroicons/outline";
import { addVariable, addrToString } from "../../misc/handlers/variable_list";
import { getVariableValue } from "../../misc/handlers/variable_list";
import { isVariableNameFree } from "../../misc/handlers/variable_list";
import { variables } from "../../misc/handlers/variable_list";
import { GetClassDetailsResult } from "../../misc/proto/qrue";
import { BetterSelect } from "../form/BetterSelect";

export function ActionButton(props: {
  img:
    | { path: JSX.Element; outline: boolean; mini: boolean }
    | "enter"
    | "save"
    | "refresh";
  onClick?: () => void;
  loading?: boolean;
  class?: string;
  label?: string;
  tooltip?: string;
}) {
  const icon = createMemo(() =>
    typeof props.img == "string" ? (
      <img
        class="light-invert"
        src={`/${props.img}.svg`}
        elementtiming={"Action"}
        fetchpriority={"auto"}
        alt="Action"
      />
    ) : (
      <Icon path={props.img} />
    ),
  );

  return (
    <button
      // Accessibility is important
      aria-label={props.label ?? props.tooltip}
      class={props.class}
      classList={{ tooltip: props.tooltip !== undefined }}
      // False positive
      // eslint-disable-next-line solid/reactivity
      onClick={() => errorHandle(() => props.onClick?.())}
      // eslint-disable-next-line solid/reactivity
      onKeyPress={() => errorHandle(() => props.onClick?.())}
      title={props.tooltip}
    >
      <Show when={props.loading} fallback={icon()}>
        <img
          src="/loading.svg"
          class="animate-spin light-invert"
          elementtiming={"Loading"}
          fetchpriority={"auto"}
          alt="Loading"
        />
      </Show>
    </button>
  );
}

export default function InputCell(props: {
  type: PacketJSON<ProtoTypeInfo>;
  value?: string;
  placeholder?: string;
  onInput?: (s: string) => void;
  isInput?: boolean; // receives user input
  isOutput?: boolean; // receives quest output
  onFocusExit?: () => void;
  onEnter?: () => void;
}) {
  const { rawInput } = useSettings();

  // useNavigate needs to be out here instead of in a callback fn
  const navigate = useNavigate();

  // bool for when a field/prop has a non-null value
  const hasValue = createMemo(
    () =>
      props.value != undefined &&
      props.value.length > 0 &&
      props.value != "0x0",
  );

  // either an input for a variable
  // (variable names can be entered into outputs once they have a value instead of after saving it)
  const variableInput = createMemo(
    () => props.isInput && !rawInput() && props.type.Info?.$case == "classInfo",
  );

  // placeholder and title (which is a tooltip)
  const detail = createMemo(
    () =>
      (props.placeholder ? props.placeholder + ": " : "") +
      protoTypeToString(props.type),
  );

  const displayValue = createMemo(() => {
    if (rawInput() || props.type.Info?.$case !== "classInfo")
      return props.value;
    if (!props.value) return undefined;
    if (props.value === "0x0") return "Null";
    // trim namespace for easier reading
    return (
      protoTypeToString({
        Info: {
          $case: "classInfo",
          classInfo: { ...props.type.Info.classInfo, namespaze: "" },
        },
      }) + "*"
    );
  });

  // restrict values for some data types
  const inputType = createMemo(() => {
    if (props.type.Info?.$case == "primitiveInfo") {
      switch (props.type.Info.primitiveInfo) {
        case ProtoTypeInfo_Primitive.BYTE:
        case ProtoTypeInfo_Primitive.SHORT:
        case ProtoTypeInfo_Primitive.INT:
        case ProtoTypeInfo_Primitive.LONG:
        case ProtoTypeInfo_Primitive.DOUBLE:
        case ProtoTypeInfo_Primitive.FLOAT:
          return "number";
      }
    }
    return "text";
  });
  // some data types need more space than others
  const minWidth = createMemo(() => {
    if (!rawInput() && props.type.Info?.$case == "classInfo")
      return ((displayValue() ?? detail()).length + 5) * 8;
    if (props.type.Info?.$case == "structInfo") return 150;
    if (props.type.Info?.$case == "arrayInfo") return 150;
    if (props.type.Info?.$case == "genericInfo") return 80;

    if (props.type.Info?.$case == "primitiveInfo") {
      switch (props.type.Info.primitiveInfo) {
        case ProtoTypeInfo_Primitive.BOOLEAN:
          return 60;
        case ProtoTypeInfo_Primitive.CHAR:
          return 40;
        case ProtoTypeInfo_Primitive.VOID:
          return 50;
      }
    }

    return 120;
  });
  // and others would look ugly if too big
  const maxWidth = createMemo(() => minWidth() * 1.5);

  // true/false selector for booleans
  const isBool = createMemo(
    () =>
      props.type.Info?.$case == "primitiveInfo" &&
      props.type.Info.primitiveInfo == ProtoTypeInfo_Primitive.BOOLEAN,
  );

  const opts = createDeferred(() => {
    if (isBool()) return createOptions(["true", "false"]);
    if (props.type.Info?.$case !== "classInfo") return createOptions([]);
    const inputClassInfo = props.type.Info.classInfo;

    const validEntries = Object.values(variables).filter(({ type }) =>
      isProtoClassInstanceOf(type, inputClassInfo),
    );

    return createOptions(validEntries.map(({ name }) => name).concat("Null"));
  });

  // track loss of focus (defer since it starts as false)
  let target: HTMLInputElement | undefined;
  onMount(() => {
    makeFocusListener(
      target!,
      // False positive
      // eslint-disable-next-line solid/reactivity
      (focused) => {
        if (!focused) props.onFocusExit?.();
      },
      true,
    );
    target!.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.repeat) props.onEnter?.();
    });
  });

  function onInput(val: string) {
    if (!props.isInput) return;
    if (!variableInput()) {
      props.onInput?.(val);
      return;
    }

    const addr = getVariableValue(val)?.[0];
    if (addr) props.onInput?.(`0x${BigInt(addr).toString(16)}`);
  }

  async function saveVariable(name?: string) {
    if (props.type.Info?.$case !== "classInfo") return;

    const [detailsPromise] = sendPacketResult<GetClassDetailsResult>({
      $case: "getClassDetails",
      getClassDetails: {
        classInfo: props.type.Info.classInfo,
      },
    });

    const details = await detailsPromise;

    addVariable(BigInt(props.value!), details.classDetails!, name);
  }

  function BasicInput(): JSX.Element {
    return (
      <input
        ref={target}
        class="small-input w-full"
        type={inputType()}
        onInput={(e) => {
          onInput(e.target.value);
        }}
        value={displayValue() ?? ""}
        disabled={!variableInput() && !props.isInput}
        placeholder={detail()}
        title={detail()}
      />
    );
  }

  function ClassActions() {
    const [name, setName] = createSignal("");

    return (
      <>
        <span class="w-1" />
        <ActionButton
          class="small-button"
          img={chevronDoubleRight}
          onClick={() => selectClass(navigate, BigInt(props.value!))}
          tooltip="Select as object"
        />
        <Show
          when={
            !props.value || !(addrToString(BigInt(props.value)) in variables)
          }
          fallback={
            <ActionButton
              class="small-button"
              img={check}
              tooltip="Variable saved"
            />
          }
        >
          <span class="w-1" />
          <span class="dropdown dropdown-bottom dropdown-end h-6">
            <ActionButton
              class="small-button"
              img="save"
              tooltip="Save variable"
            />
            <div
              class="
              dropdown-content shadow menu text-base
              bg-neutral-400 dark:bg-zinc-800
              justify-center gap-1 w-60 p-2 my-1
              flex flex-row flex-nowrap
              z-20 rounded-box cursor-auto"
            >
              <input
                class="min-w-0 small-input"
                placeholder="Unnamed Variable"
                onInput={(e) => setName(e.currentTarget.value)}
                classList={{ invalid: !isVariableNameFree(name()) }}
              />
              <ActionButton
                class="small-button"
                img={check}
                onClick={() =>
                  saveVariable(name()?.length > 0 ? name() : undefined)
                }
                tooltip="Confirm"
              />
            </div>
          </span>
        </Show>
      </>
    );
  }

  function StructActions() {
    return (
      <>
        <span class="w-1" />
        <ActionButton
          class="small-button"
          img={chevronDoubleRight}
          onClick={() =>
            selectData(navigate, stringToProtoData(props.value!, props.type))
          }
          tooltip="Select as object"
        />
      </>
    );
  }

  createEffect(() => {
    if (props.isInput && (variableInput() || isBool()))
      console.log(props.value);
  });

  return (
    <span
      class={styles.inputParent}
      style={{
        "flex-grow": detail().length,
        "min-width": `${minWidth()}px`,
        "max-width": `${maxWidth()}px`,
      }}
    >
      <span class="flex flex-1 w-0 min-w-0">
        <Show
          when={
            // use a <Select> for inputting booleans or classes with raw input off
            props.isInput && (variableInput() || isBool())
          }
          fallback={<BasicInput />}
        >
          <span ref={target} class="w-full">
            <BetterSelect
              onChange={onInput}
              initialValue={displayValue() ?? ""}
              placeholder={detail()}
              title={detail()}
              {...opts()}
            />
          </span>
        </Show>
      </span>
      {/* buttons for specific data types */}
      <Show
        when={
          props.type.Info?.$case == "structInfo" && props.isOutput && hasValue()
        }
      >
        <StructActions />
      </Show>
      <Show
        when={
          props.type.Info?.$case == "classInfo" && props.isOutput && hasValue()
        }
      >
        <ClassActions />
      </Show>
    </span>
  );
}
