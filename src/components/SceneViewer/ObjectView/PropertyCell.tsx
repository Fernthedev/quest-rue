import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../../misc/events";
import { InvokeMethodResult } from "../../../misc/proto/qrue";
import {
  ProtoDataPayload,
  ProtoDataSegment,
  ProtoPropertyInfo,
  ProtoTypeInfo,
} from "../../../misc/proto/il2cpp";
import { stringToProtoData } from "../../../misc/types/type_format";
import { protoDataToString } from "../../../misc/types/type_format";
import InputCell, { ActionButton } from "../InputCell";
import toast from "solid-toast";

import styles from "./ObjectView.module.css";
import { SpanFn } from "./ObjectView";
import { createUpdatingSignal } from "../../../misc/utils";

export function PropertyCell(props: {
  prop: PacketJSON<ProtoPropertyInfo>;
  colSize?: number;
  selected?: ProtoDataPayload;
  spanFn?: SpanFn;
  initVal?: ProtoDataSegment;
  runGet?: boolean;
}) {
  // update element span when colSize updates
  let element: HTMLDivElement | undefined;
  createEffect(() => {
    if (element) props.spanFn?.(element, props.colSize!);
  });

  // run getter and get value
  const [value, valueLoading, requestGet] =
    useRequestAndResponsePacket<InvokeMethodResult>();
  function get() {
    if (!props.prop.getterId || !props.selected) return;
    requestGet({
      $case: "invokeMethod",
      invokeMethod: {
        generics: [],
        methodId: props.prop.getterId,
        inst: props.selected,
        args: [],
      },
    });
  }

  createEffect(() => {
    if (!props.initVal && props.runGet && props.selected) get();
  });

  // run setter on input and check if no error
  const [valueSetter, valueSetting, requestSet] =
    useRequestAndResponsePacket<InvokeMethodResult>();
  // always update the input value so that it overrides anything typed in
  // when the refresh button is pressed, even if it hasn't changed
  const [inputValue, setInputValue] = createSignal("");
  function set() {
    if (!props.prop.type || !props.prop.setterId || !props.selected) return;
    const protoData = stringToProtoData(inputValue(), props.prop.type);
    requestSet({
      $case: "invokeMethod",
      invokeMethod: {
        generics: [],
        methodId: props.prop.setterId,
        inst: props.selected,
        args: [protoData],
      },
    });
  }
  const [serverValue, setServerValue] = createUpdatingSignal(() =>
    protoDataToString(value()?.result),
  );

  createEffect(() => {
    if (!props.initVal || !props.prop.type) return;

    const data = ProtoDataPayload.fromPartial({
      typeInfo: props.prop.type,
      data: props.initVal,
    });
    setServerValue(protoDataToString(data));
  });

  const errorHandler = (result: { error?: string } | undefined) => {
    const resultData = result;
    if (!resultData?.error) return;

    toast.error(`Property exception error: ${resultData.error}`);
  };

  // Error handle
  createEffect(() => {
    errorHandler(value());
  });
  createEffect(() => {
    errorHandler(valueSetter());
  });

  const propertyGetter = createMemo(
    () => props.prop.getterId && styles.propertyGetter,
  );
  const propertySetter = createMemo(
    () => props.prop.setterId && styles.propertySetter,
  );
  const propertyBoth = createMemo(
    () => props.prop.getterId && props.prop.setterId && styles.propertyBoth,
  );

  return (
    <span
      ref={element}
      class={`mono ${
        propertyBoth() || propertySetter() || propertyGetter()
      } ${styles.gridElement} overflow-visible`}
    >
      {props.prop.name + " = "}
      <InputCell
        isInput={Boolean(props.prop.setterId)}
        isOutput
        onInput={setInputValue}
        onEnter={set}
        value={serverValue()}
        type={props.prop.type ?? ProtoTypeInfo.fromPartial({})}
      />
      <Show when={props.prop.getterId}>
        <ActionButton
          class={"small-button"}
          onClick={get}
          loading={valueLoading() || valueSetting()}
          img="refresh"
          tooltip="Refresh"
        />
      </Show>
      <Show when={props.prop.setterId}>
        <ActionButton
          class={"small-button"}
          onClick={set}
          loading={valueLoading() || valueSetting()}
          img="enter"
          tooltip="Set"
        />
      </Show>
    </span>
  );
}
