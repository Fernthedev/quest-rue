import { Show, For, createEffect, createMemo, Index } from "solid-js";
import { PacketJSON, useRequestAndResponsePacket } from "../../../misc/events";
import { InvokeMethodResult } from "../../../misc/proto/qrue";
import {
  ProtoDataPayload,
  ProtoMethodInfo,
  ProtoMethodInfo_Argument,
  ProtoTypeInfo,
} from "../../../misc/proto/il2cpp";
import { createUpdatingSignal } from "../../../misc/utils";
import { stringToProtoData } from "../../../misc/types/type_format";
import {
  protoDataToString,
  stringToProtoType,
} from "../../../misc/types/type_format";
import {
  getGenerics,
  getInstantiation,
} from "../../../misc/types/type_generics";
import InputCell, { ActionButton } from "../InputCell";
import toast from "solid-toast";

import styles from "./ObjectView.module.css";
import { SpanFn } from "./ObjectView";

export function MethodCell(props: {
  method: PacketJSON<ProtoMethodInfo>;
  colSize?: number;
  selected?: ProtoDataPayload;
  spanFn?: SpanFn;
  highlight: boolean;
}) {
  // update element size
  let element: HTMLDivElement | undefined;
  createEffect(() => {
    if (element) props.spanFn?.(element, props.colSize!);
  });

  // args and return type
  const args = createMemo(() =>
    props.method.args.concat(
      ProtoMethodInfo_Argument.fromPartial({
        name: "ret",
        type: props.method.returnType,
      }),
    ),
  );

  // args with types updated to the latest inputs for generics
  const [latestArgs, setLatestArgs] = createUpdatingSignal(args, {
    equals: false,
  });

  // set latestArgs types to the current generic inputs
  function updateGenerics(requireValid: boolean) {
    const genericsData = genericInputs().map<[bigint, ProtoTypeInfo]>(
      ([index, str]) => [
        index,
        stringToProtoType(str, requireValid) ?? genericArgsMap().get(index)!,
      ],
    );
    const generics = genericsData.reduce(
      (map, [index, type]) => map.set(index, type),
      new Map<bigint, ProtoTypeInfo>(),
    );
    // set from base args, not latest args
    setLatestArgs(
      args().map(({ name, type }) =>
        ProtoMethodInfo_Argument.fromPartial({
          name: name,
          type: getInstantiation(type!, generics),
        }),
      ),
    );
    return genericsData;
  }

  const argInputs = createMemo(() =>
    args()
      .slice(0, -1)
      .map(() => ""),
  );
  const [result, resultLoading, runMethod] =
    useRequestAndResponsePacket<InvokeMethodResult>();

  function run() {
    if (!props.selected) return;
    const genericsData = updateGenerics(true);
    const argsData = argInputs().map((str, index) =>
      stringToProtoData(str, latestArgs()[index].type!),
    );
    runMethod({
      $case: "invokeMethod",
      invokeMethod: {
        methodId: props.method.id,
        inst: props.selected,
        generics: genericsData.map(([, t]) => t),
        args: argsData,
      },
    });
  }

  // genericParameterIndex -> ProtoTypeInfo
  const genericArgsMap = createMemo(() => {
    return (
      args()
        .flatMap(({ type }) => getGenerics(type))
        // eslint-disable-next-line solid/reactivity
        .reduce((map, t) => {
          if (t.Info?.$case != "genericInfo") {
            console.log("bad type", t, args());
            throw "Non generic ProtoTypeInfo in generics";
          }
          const index = t.Info.genericInfo.genericHandle;
          return map.set(index, t);
        }, new Map<bigint, ProtoTypeInfo>())
    );
  });
  // all generic ProtoTypeInfos in order
  const genericArgs = createMemo(() => Array.from(genericArgsMap().values()));
  // [genericParameterIndex, input value][]
  const genericInputs = createMemo(() =>
    genericArgs().map<[bigint, string]>((t: ProtoTypeInfo) => [
      // the case should always be this but typescript moment
      t.Info?.$case == "genericInfo"
        ? t.Info.genericInfo.genericHandle
        : BigInt(-1),
      "",
    ]),
  );

  createEffect(() => {
    const resultData = result();
    if (!resultData?.error) return;

    toast.error(`${props.method.name} threw an exception: ${resultData.error}`);
  });

  return (
    <span
      ref={element}
      class={`mono method overflow-visible ${styles.method} ${styles.gridElement}`}
      classList={{ [styles.highlighted]: props.highlight }}
    >
      <text class="pr-1 pl-2 -mx-2">{props.method.name}</text>
      <Show when={genericArgs().length > 0}>
        {"<"}
        <For each={genericArgs()}>
          {(type, index) => (
            <InputCell
              isInput
              type={type}
              onInput={(str) => (genericInputs()[index()][1] = str)}
              onFocusExit={() => updateGenerics(false)}
              onEnter={run} // TODO: should generic inputs run on enter?
            />
          )}
        </For>
        {">"}
      </Show>
      {"("}
      {/* make sure to use latestArgs so that it updates with generic types */}
      <Index each={latestArgs().slice(0, -1)}>
        {(arg, index) => (
          <InputCell
            isInput
            placeholder={arg().name}
            type={arg().type!}
            onInput={(str) => (argInputs()[index] = str)}
            onEnter={run}
          />
        )}
      </Index>
      {") "}
      <ActionButton
        class={"small-button"}
        onClick={run}
        loading={resultLoading()}
        img="enter"
        tooltip="Invoke"
      />
      <InputCell
        isOutput
        value={protoDataToString(result()?.result)}
        type={latestArgs().at(-1)!.type!}
      />
    </span>
  );
}
