import { createEffect, onMount } from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../misc/events";
import { GetFieldResult, SetFieldResult } from "../../misc/proto/qrue";
import { ProtoFieldInfo } from "../../misc/proto/il2cpp";
import { stringToProtoData } from "../../misc/types/type_format";
import { protoDataToString } from "../../misc/types/type_format";
import InputCell, { ActionButton } from "../InputCell";
import { SpanFn } from "./ObjectView";

import styles from "./ObjectView.module.css";

export function FieldCell(props: {
  field: PacketJSON<ProtoFieldInfo>;
  colSize: number;
  address: bigint;
  spanFn: SpanFn;
}) {
  // update element on resize
  let element: HTMLDivElement | undefined;
  createEffect(() => {
    if (element) props.spanFn(element, props.colSize);
  });

  // field getting
  const [value, valueLoading, requestValue] =
    useRequestAndResponsePacket<GetFieldResult>();
  function refresh() {
    console.log(`Requesting ${props.field.id} ${props.address}`);
    requestValue({
      $case: "getField",
      getField: {
        fieldId: props.field.id,
        objectAddress: props.address,
      },
    });
  }
  // get initial value (to be moved)
  onMount(() => refresh());

  // field setting
  const [, valueSetting, requestSet] =
    useRequestAndResponsePacket<SetFieldResult>();
  function update(value: string) {
    console.log("Field setter");
    const protoData = stringToProtoData(value, props.field.type!);
    requestSet({
      $case: "setField",
      setField: {
        fieldId: props.field.id,
        objectAddress: props.address,
        value: protoData,
      },
    });
  }
  return (
    <span
      ref={element}
      class={`font-mono overflow-visible ${styles.field} ${styles.gridElement}`}
    >
      {props.field.name + " = "}
      <InputCell
        isInput
        isOutput
        onInput={update}
        value={protoDataToString(value()?.value)}
        type={props.field.type!}
      />
      <ActionButton
        class={"small-button"}
        onClick={refresh}
        loading={valueLoading() || valueSetting()}
        img="refresh.svg"
        tooltip="Refresh"
      />
    </span>
  );
}
