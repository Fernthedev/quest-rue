import {
  Accessor,
  Show,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../../misc/events";
import { InvokeMethodResult } from "../../../misc/proto/qrue";
import {
  ProtoDataPayload,
  ProtoDataSegment,
  ProtoPropertyInfo,
} from "../../../misc/proto/il2cpp";
import { stringToProtoData } from "../../../misc/types/type_format";
import { protoDataToString } from "../../../misc/types/type_format";
import InputCell, { ActionButton } from "../InputCell";
import toast from "solid-toast";

import styles from "./ObjectView.module.css";
import { SpanFn } from "./ObjectView";

export function PropertyCell(props: {
  prop: PacketJSON<ProtoPropertyInfo>;
  colSize: number;
  selected: ProtoDataPayload;
  spanFn: SpanFn;
  initVal?: ProtoDataSegment;
}) {
  // update element span when colSize updates
  let element: HTMLDivElement | undefined;
  createEffect(() => {
    if (element) props.spanFn(element, props.colSize);
  });

  // run getter and get value
  const [value, valueLoading, requestGet] =
    useRequestAndResponsePacket<InvokeMethodResult>();
  function get() {
    requestGet({
      $case: "invokeMethod",
      invokeMethod: {
        generics: [],
        methodId: props.prop.getterId!,
        inst: props.selected,
        args: [],
      },
    });
  }

  // run setter on input and check if no error
  const [valueSetter, valueSetting, requestSet] =
    useRequestAndResponsePacket<InvokeMethodResult>();
  // always update the input value so that it overrides anything typed in
  // when the refresh button is pressed, even if it hasn't changed
  const [inputValue, setInputValue] = createSignal("", { equals: false });
  function set() {
    const protoData = stringToProtoData(inputValue(), props.prop.type!);
    requestSet({
      $case: "invokeMethod",
      invokeMethod: {
        generics: [],
        methodId: props.prop.setterId!,
        inst: props.selected,
        args: [protoData],
      },
    });
  }
  createEffect(() => setInputValue(protoDataToString(value()?.result)));

  createEffect(() => {
    if (!props.initVal) return;

    const data = ProtoDataPayload.fromPartial({
      typeInfo: props.prop.type,
      data: props.initVal,
    });
    setInputValue(protoDataToString(data));
  });

  const errorHandler = (result: Accessor<{ error?: string } | undefined>) => {
    const resultData = result();
    if (!resultData?.error) return;

    toast.error(`Property exception error: ${resultData.error}`);
  };

  // Error handle
  createEffect(() => {
    errorHandler(value);
  });
  createEffect(() => {
    errorHandler(valueSetter);
  });

  const propertyGetter = createMemo(
    () => props.prop.getterId && styles.propertyGetter
  );
  const propertySetter = createMemo(
    () => props.prop.setterId && styles.propertySetter
  );
  const propertyBoth = createMemo(
    () => props.prop.getterId && props.prop.setterId && styles.propertyBoth
  );

  return (
    <span
      ref={element}
      class={`font-mono ${
        propertyBoth() || propertySetter() || propertyGetter()
      } ${styles.gridElement} overflow-visible`}
    >
      {props.prop.name + " = "}
      <InputCell
        isInput={Boolean(props.prop.setterId)}
        isOutput
        onInput={setInputValue}
        value={inputValue()}
        type={props.prop.type!}
      />
      <Show when={props.prop.getterId}>
        <ActionButton
          class={"small-button"}
          onClick={get}
          loading={valueLoading() || valueSetting()}
          img="refresh.svg"
          tooltip="Refresh"
        />
      </Show>
      <Show when={props.prop.setterId}>
        <ActionButton
          class={"small-button"}
          onClick={set}
          loading={valueLoading() || valueSetting()}
          img="enter.svg"
          tooltip="Set"
        />
      </Show>
    </span>
  );
}
