import { Store } from "solid-js/store";
import {
  PacketJSON,
  useRequestAndResponsePacket,
} from "../../../../misc/events";
import {
  ProtoDataPayload,
  ProtoClassDetails,
  ProtoTypeInfo,
} from "../../../../misc/proto/il2cpp";
import {
  GetClassDetailsResult,
  GetInstanceClassResult,
  GetInstanceValuesResult,
  InvokeMethodResult,
} from "../../../../misc/proto/qrue";
import { FilterSettings } from "../FilterSettings";
import { Show, createEffect, createMemo, For, createSignal } from "solid-js";
import {
  protoTypeToString,
  stringToProtoData,
  stringToProtoType,
} from "../../../../misc/types/type_format";
import { createAsyncMemo, createUpdatingSignal } from "../../../../misc/utils";
import { sendPacketResult } from "../../../../misc/commands";
import {
  MethodCellByName,
  PropertyCellByName,
  searchSelfAndParents,
} from "./TypeSpecifics";
import { protoDataToRealValue } from "../../../../misc/types/type_serialization";
import styles from "../ObjectView.module.css";
import InputCell, { ActionButton } from "../../InputCell";
import { protoClassInfoToTypeInfo } from "../../../../misc/types/type_matching";

export function GameObjectSection(
  selected: ProtoDataPayload,
  search: string,
  filters: Store<FilterSettings>,
  details: PacketJSON<ProtoClassDetails>,
  initVals?: GetInstanceValuesResult,
) {
  const isTransform = createMemo(() =>
    protoTypeToString(selected.typeInfo).includes("Transform"),
  );

  const otherClassInfo = createMemo(() => {
    return {
      namespaze: "UnityEngine",
      clazz: isTransform() ? "GameObject" : "Transform",
      generics: [],
    };
  });

  const [otherDetails, , requestDetails] =
    useRequestAndResponsePacket<GetClassDetailsResult>();

  createEffect(() => {
    // get the class details of the other type between gameobject and transform
    requestDetails({
      $case: "getClassDetails",
      getClassDetails: {
        classInfo: otherClassInfo(),
      },
    });
  });

  const transformDetails = createMemo(() =>
    isTransform() ? details : otherDetails()?.classDetails,
  );
  const gameObjectDetails = createMemo(() =>
    isTransform() ? otherDetails()?.classDetails : details,
  );

  const [transformInst, setTransformInst] = createUpdatingSignal(() =>
    isTransform() ? selected : undefined,
  );
  const [gameObjectInst, setGameObjectInst] = createUpdatingSignal(() =>
    isTransform() ? undefined : selected,
  );

  createEffect(() => {
    const transform = isTransform();
    const search = transform ? "gameObject" : "transform";
    const methodId = () =>
      searchSelfAndParents(details, (classDetails) =>
        classDetails.properties.find(({ name }) => name == search),
      );

    const [getOtherPromise] = sendPacketResult<InvokeMethodResult>({
      $case: "invokeMethod",
      invokeMethod: {
        methodId: methodId()!.getterId!,
        inst: selected,
        generics: [],
        args: [],
      },
    });
    getOtherPromise.then((other) => {
      if (transform) setGameObjectInst(other.result!);
      else setTransformInst(other.result!);
    });
  });

  const ready = createMemo(
    () =>
      otherDetails() != undefined &&
      transformInst() != undefined &&
      gameObjectInst() != undefined,
  );

  const [componentsLoading, setCompsLoading] = createSignal(true);
  const [components, updateComponents] = createAsyncMemo(async () => {
    const inst = gameObjectInst();
    const dets = gameObjectDetails();
    if (!inst || !dets) return undefined;

    const method = searchSelfAndParents(dets, (classDetails) =>
      classDetails.methods.find(
        ({ name, returnType }) =>
          name == "GetComponents" &&
          protoTypeToString(returnType) == "UnityEngine::Component[]",
      ),
    );
    if (!method) return undefined;

    setCompsLoading(true);

    const [runMethod] = sendPacketResult<InvokeMethodResult>({
      $case: "invokeMethod",
      invokeMethod: {
        methodId: method.id,
        inst: inst,
        generics: [],
        args: [
          stringToProtoData(
            "UnityEngine::Component",
            stringToProtoType("type")!,
          ),
        ],
      },
    });
    const result = await runMethod;
    setCompsLoading(false);
    if (!result.result) return undefined;
    const arr = protoDataToRealValue(
      result.result.typeInfo!,
      result.result.data,
    );
    if (!Array.isArray(arr)) return [];
    if (arr.length == 0 || typeof arr[0] != "bigint") return [];
    return arr as bigint[];
  });

  return (
    <Show when={ready()}>
      <div class="flex flex-col gap-1 my-1 content-stretch">
        <PropertyCellByName
          propertyName="name"
          instance={gameObjectInst()!}
          instanceDetails={gameObjectDetails()!}
          initVals={initVals}
        />
        <Show
          when={isTransform()}
          fallback={
            <PropertyCellByName
              propertyName="transform"
              instance={gameObjectInst()!}
              instanceDetails={gameObjectDetails()!}
              initVals={initVals}
            />
          }
        >
          <PropertyCellByName
            propertyName="gameObject"
            instance={transformInst()!}
            instanceDetails={transformDetails()!}
            initVals={initVals}
          />
        </Show>
        <span class="flex gap-2">
          <PropertyCellByName
            propertyName="position"
            instance={transformInst()!}
            instanceDetails={transformDetails()!}
            initVals={initVals}
            class="flex-1"
          />
          <PropertyCellByName
            propertyName="localPosition"
            instance={transformInst()!}
            instanceDetails={transformDetails()!}
            initVals={initVals}
            class="flex-1"
          />
        </span>
        <span class="flex gap-2">
          <PropertyCellByName
            propertyName="eulerAngles"
            instance={transformInst()!}
            instanceDetails={transformDetails()!}
            initVals={initVals}
            class="flex-1"
          />
          <PropertyCellByName
            propertyName="localEulerAngles"
            instance={transformInst()!}
            instanceDetails={transformDetails()!}
            initVals={initVals}
            class="flex-1"
          />
        </span>
        <span class="flex gap-2">
          <PropertyCellByName
            propertyName="localScale"
            instance={transformInst()!}
            instanceDetails={transformDetails()!}
            initVals={initVals}
            class="flex-1"
          />
          <PropertyCellByName
            propertyName="lossyScale"
            instance={transformInst()!}
            instanceDetails={transformDetails()!}
            initVals={initVals}
            class="flex-1"
          />
        </span>
        <div class={`${styles.method} flex font-mono border-l-4 items-center`}>
          <text class="pr-2 pl-1 flex-none">GetComponents = </text>
          <div class="flex flex-1 min-w-min gap-1 flex-wrap">
            <For each={components()}>
              {(addr) => {
                const [componentType] = createAsyncMemo(async () => {
                  const [getClass] = sendPacketResult<GetInstanceClassResult>({
                    $case: "getInstanceClass",
                    getInstanceClass: {
                      address: addr,
                    },
                  });
                  const compClass = await getClass;
                  return protoClassInfoToTypeInfo(compClass.classInfo!);
                });

                return (
                  <span class="flex" style={{ width: "175px" }}>
                    <InputCell
                      type={componentType() ?? ProtoTypeInfo.fromPartial({})}
                      value={`0x${addr.toString(16)}`}
                      isOutput
                    />
                  </span>
                );
              }}
            </For>
            <ActionButton
              class="small-button"
              img="refresh"
              tooltip="Refresh Components"
              onClick={() => updateComponents()}
              loading={componentsLoading()}
            />
          </div>
        </div>
        <MethodCellByName
          methodName="AddComponent"
          instance={gameObjectInst()!}
          instanceDetails={gameObjectDetails()!}
          extraFilter={(info) => info.returnType?.Info?.$case == "genericInfo"}
        />
      </div>
    </Show>
  );
}
