import {
  Show,
  createMemo,
  createEffect,
  on,
  JSX,
  createSignal,
  createDeferred,
} from "solid-js";
import { PacketJSON, sendPacketResult } from "../misc/events";
import { ProtoTypeInfo, ProtoTypeInfo_Primitive } from "../misc/proto/il2cpp";

import styles from "./InputCell.module.css";
import { errorHandle } from "../misc/utils";
import { protoTypeToString } from "../misc/types/type_format";
import { isProtoClassInstanceOf } from "../misc/types/type_matching";
import { objectUrl } from "../App";
import { useNavigate } from "@solidjs/router";
import { createOptions } from "@thisbeyond/solid-select";
import { useSettings } from "./Settings";
import { createFocusSignal } from "@solid-primitives/active-element";
import { Icon } from "solid-heroicons";
import { chevronDoubleRight } from "solid-heroicons/outline";
import { addVariable, getVariableValue } from "./VariablesList";
import { variables } from "../misc/globals";
import { GetClassDetailsResult } from "../misc/proto/qrue";
import { BetterSelect } from "./form/BetterSelect";

export function ActionButton(props: {
  img:
    | { path: JSX.Element; outline: boolean; mini: boolean }
    | "enter.svg"
    | "save.svg"
    | "refresh.svg";
  onClick: () => void;
  loading?: boolean;
  class?: string;
  label?: string;
  tooltip?: string;
}) {
  const classes = createMemo(() => props.class);

  const icon = createMemo(() =>
    typeof props.img == "string" ? (
      <img
        src={`/src/assets/${props.img}`}
        elementtiming={"Action"}
        fetchpriority={"auto"}
        alt="Action"
      />
    ) : (
      <Icon path={props.img} />
    )
  );

  return (
    <button
      // Accessibility is important
      aria-label={props.label ?? props.tooltip}
      class={classes()}
      classList={{ tooltip: props.tooltip !== undefined }}
      // False positive
      // eslint-disable-next-line solid/reactivity
      onClick={() => errorHandle(() => props.onClick())}
      title={props.tooltip}
    >
      <Show when={props.loading} fallback={icon()}>
        <img
          src="/src/assets/loading.svg"
          class="animate-spin"
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
}) {
  const { rawInput } = useSettings();

  // useNavigate needs to be out here instead of in a callback fn
  const navigate = useNavigate();

  // bool for when a field/prop has a non-null value
  const hasValue = createMemo(() => props.value && props.value != "0x0");

  // either an input for a variable
  // (variable names can be entered into outputs once they have a value instead of after saving it)
  const variableInput = createMemo(
    () => props.isInput && !rawInput() && props.type.Info?.$case == "classInfo"
  );

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

    return 100;
  });
  // and others would look ugly if too big
  const maxWidth = createMemo(() => minWidth() * 2);

  // placeholder and title (which is a tooltip)
  const detail = createMemo(
    () =>
      (props.placeholder ? props.placeholder + ": " : "") +
      protoTypeToString(props.type)
  );

  // true/false selector for booleans
  const isBool = createMemo(
    () =>
      props.type.Info?.$case == "primitiveInfo" &&
      props.type.Info.primitiveInfo == ProtoTypeInfo_Primitive.BOOLEAN
  );

  const opts = createDeferred(() => {
    if (isBool()) return createOptions(["true", "false"]);
    if (props.type.Info?.$case !== "classInfo") return createOptions([]);
    const inputClassInfo = props.type.Info.classInfo;

    const validEntries = Object.values(variables).filter(({ type }) =>
      isProtoClassInstanceOf(type, inputClassInfo)
    );

    return createOptions(validEntries.map(({ name }) => name));
  });

  // track loss of focus (defer since it starts as false)
  let target: HTMLInputElement | undefined;
  const focused = createFocusSignal(() => target!);
  createEffect(
    on(
      focused,
      () => {
        if (!focused()) props.onFocusExit?.();
      },
      { defer: true }
    )
  );

  const onInput = (val: string) => {
    if (!props.isInput) return;
    if (!variableInput()) {
      props.onInput?.(val);
      return;
    }

    // Replace with
    const addr = getVariableValue(val)?.[0];
    if (addr) props.onInput?.(addr);
  };

  async function saveVariable() {
    if (props.type.Info?.$case !== "classInfo") return;

    const [detailsPromise] = sendPacketResult<GetClassDetailsResult>({
      $case: "getClassDetails",
      getClassDetails: {
        classInfo: props.type.Info.classInfo,
      },
    });

    const details = await detailsPromise;

    addVariable(props.value!, details.classDetails!);
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
        value={props.value ?? ""}
        disabled={!variableInput() && !props.isInput}
        placeholder={detail()}
        title={detail()}
      />
    );
  }

  function ClassActions() {
    return (
      <Show
        when={
          props.type.Info?.$case == "classInfo" && props.isOutput && hasValue()
        }
      >
        <span class="w-1" />
        <ActionButton
          class="small-button"
          img={chevronDoubleRight}
          onClick={() => navigate(objectUrl(BigInt(props.value!)))}
          tooltip="Select as object"
        />
        <span class="w-1" />
        <ActionButton
          class="small-button"
          img="save.svg"
          onClick={saveVariable}
          tooltip="Save variable"
        />
      </Show>
    );
  }

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
              initialValue={props.value ?? ""}
              placeholder={detail()}
              title={detail()}
              {...opts()}
            />
          </span>
        </Show>
      </span>
      {/* selection button for classes only */}
      <ClassActions />
    </span>
  );
}
