import { createEffect, createMemo, onMount } from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../../misc/events";
import { GetFieldResult, SetFieldResult } from "../../../misc/proto/qrue";
import {
  ProtoDataPayload,
  ProtoDataSegment,
  ProtoFieldInfo,
} from "../../../misc/proto/il2cpp";
import { stringToProtoData } from "../../../misc/types/type_format";
import { protoDataToString } from "../../../misc/types/type_format";
import InputCell, { ActionButton } from "../InputCell";
import { SpanFn } from "./ObjectView";

import styles from "./ObjectView.module.css";

export function FieldCell(props: {
  field: PacketJSON<ProtoFieldInfo>;
  colSize?: number;
  selected: ProtoDataPayload;
  spanFn?: SpanFn;
  initVal?: ProtoDataSegment;
}) {
  // update element on resize
  let element: HTMLDivElement | undefined;
  createEffect(() => {
    if (element) props.spanFn?.(element, props.colSize!);
  });

  // field getting
  const [value, valueLoading, requestValue] =
    useRequestAndResponsePacket<GetFieldResult>();
  function refresh() {
    console.log(
      `Requesting ${props.field.id} ${protoDataToString(props.selected)}`
    );
    requestValue({
      $case: "getField",
      getField: {
        fieldId: props.field.id,
        inst: props.selected,
      },
    });
  }

  const valData = createMemo(() => {
    const gotVal = value();
    if (gotVal) return gotVal.value;

    if (!props.initVal) return undefined;

    return ProtoDataPayload.fromPartial({
      typeInfo: props.field.type,
      data: props.initVal,
    });
  });

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
        inst: props.selected,
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
        value={protoDataToString(valData())}
        type={props.field.type!}
      />
      <ActionButton
        class={"small-button"}
        onClick={refresh}
        loading={valueLoading() || valueSetting()}
        img="refresh"
        tooltip="Refresh"
      />
    </span>
  );
}
