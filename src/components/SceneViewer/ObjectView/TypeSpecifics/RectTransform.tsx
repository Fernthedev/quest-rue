import { Store } from "solid-js/store";
import { PacketJSON } from "../../../../misc/events";
import {
  ProtoDataPayload,
  ProtoClassDetails,
} from "../../../../misc/proto/il2cpp";
import { GetInstanceValuesResult } from "../../../../misc/proto/qrue";
import { FilterSettings } from "../FilterSettings";
import { PropertyCellByName, MethodCellByName } from "./TypeSpecifics";

export function RectTransformSection(
  selected: ProtoDataPayload,
  search: string,
  filters: Store<FilterSettings>,
  details: PacketJSON<ProtoClassDetails>,
  initVals?: GetInstanceValuesResult,
) {
  return (
    <div class="flex flex-col gap-1 my-1 content-stretch">
      <span class="flex gap-2">
        <PropertyCellByName
          propertyName="anchorMin"
          instance={selected}
          instanceDetails={details}
          initVals={initVals}
          class="flex-1"
        />
        <PropertyCellByName
          propertyName="anchorMax"
          instance={selected}
          instanceDetails={details}
          initVals={initVals}
          class="flex-1"
        />
      </span>
      <span class="flex gap-2">
        <PropertyCellByName
          propertyName="anchoredPosition"
          instance={selected}
          instanceDetails={details}
          initVals={initVals}
          class="flex-1"
        />
        <PropertyCellByName
          propertyName="sizeDelta"
          instance={selected}
          instanceDetails={details}
          initVals={initVals}
          class="flex-1"
        />
      </span>
      <PropertyCellByName
        propertyName="rect"
        instance={selected}
        instanceDetails={details}
        initVals={initVals}
        class="flex-1"
      />
      <MethodCellByName
        methodName="GetParentSize"
        instance={selected}
        instanceDetails={details}
      />
    </div>
  );
}
