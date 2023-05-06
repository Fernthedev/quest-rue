/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { ProtoClassDetails, ProtoClassInfo, ProtoDataPayload, ProtoTypeInfo } from "./il2cpp";
import { ProtoComponent, ProtoGameObject, ProtoObject } from "./unity";

export const protobufPackage = "";

export interface SetField {
  fieldId: bigint;
  objectAddress: bigint;
  value: ProtoDataPayload | undefined;
}

export interface SetFieldResult {
  fieldId: bigint;
}

export interface GetField {
  fieldId: bigint;
  objectAddress: bigint;
}

export interface GetFieldResult {
  fieldId: bigint;
  value: ProtoDataPayload | undefined;
}

export interface InvokeMethod {
  methodId: bigint;
  objectAddress: bigint;
  generics: ProtoTypeInfo[];
  args: ProtoDataPayload[];
}

export interface InvokeMethodResult {
  status: InvokeMethodResult_Status;
  methodId: bigint;
  result:
    | ProtoDataPayload
    | undefined;
  /** map from parameter index */
  byrefChanges: { [key: number]: ProtoDataPayload };
  /** nullable */
  error?: string | undefined;
}

export enum InvokeMethodResult_Status {
  ERR = 0,
  OK = 1,
  UNRECOGNIZED = -1,
}

export function invokeMethodResult_StatusFromJSON(object: any): InvokeMethodResult_Status {
  switch (object) {
    case 0:
    case "ERR":
      return InvokeMethodResult_Status.ERR;
    case 1:
    case "OK":
      return InvokeMethodResult_Status.OK;
    case -1:
    case "UNRECOGNIZED":
    default:
      return InvokeMethodResult_Status.UNRECOGNIZED;
  }
}

export function invokeMethodResult_StatusToJSON(object: InvokeMethodResult_Status): string {
  switch (object) {
    case InvokeMethodResult_Status.ERR:
      return "ERR";
    case InvokeMethodResult_Status.OK:
      return "OK";
    case InvokeMethodResult_Status.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface InvokeMethodResult_ByrefChangesEntry {
  key: number;
  value: ProtoDataPayload | undefined;
}

export interface SearchObjects {
  componentClass:
    | ProtoClassInfo
    | undefined;
  /** nullable */
  name?: string | undefined;
}

export interface SearchObjectsResult {
  objects: ProtoObject[];
}

export interface GetAllGameObjects {
}

export interface GetAllGameObjectsResult {
  /** TODO: GameObject data such as hierarchy */
  objects: ProtoGameObject[];
}

export interface GetGameObjectComponents {
  /** / GameObject address */
  address: bigint;
}

export interface GetGameObjectComponentsResult {
  components: ProtoComponent[];
}

export interface ReadMemory {
  address: bigint;
  size: bigint;
}

export interface ReadMemoryResult {
  status: ReadMemoryResult_Status;
  address: bigint;
  data: Uint8Array;
}

export enum ReadMemoryResult_Status {
  ERR = 0,
  OK = 1,
  UNRECOGNIZED = -1,
}

export function readMemoryResult_StatusFromJSON(object: any): ReadMemoryResult_Status {
  switch (object) {
    case 0:
    case "ERR":
      return ReadMemoryResult_Status.ERR;
    case 1:
    case "OK":
      return ReadMemoryResult_Status.OK;
    case -1:
    case "UNRECOGNIZED":
    default:
      return ReadMemoryResult_Status.UNRECOGNIZED;
  }
}

export function readMemoryResult_StatusToJSON(object: ReadMemoryResult_Status): string {
  switch (object) {
    case ReadMemoryResult_Status.ERR:
      return "ERR";
    case ReadMemoryResult_Status.OK:
      return "OK";
    case ReadMemoryResult_Status.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface WriteMemory {
  address: bigint;
  data: Uint8Array;
}

export interface WriteMemoryResult {
  status: WriteMemoryResult_Status;
  address: bigint;
  size: bigint;
}

export enum WriteMemoryResult_Status {
  ERR = 0,
  OK = 1,
  UNRECOGNIZED = -1,
}

export function writeMemoryResult_StatusFromJSON(object: any): WriteMemoryResult_Status {
  switch (object) {
    case 0:
    case "ERR":
      return WriteMemoryResult_Status.ERR;
    case 1:
    case "OK":
      return WriteMemoryResult_Status.OK;
    case -1:
    case "UNRECOGNIZED":
    default:
      return WriteMemoryResult_Status.UNRECOGNIZED;
  }
}

export function writeMemoryResult_StatusToJSON(object: WriteMemoryResult_Status): string {
  switch (object) {
    case WriteMemoryResult_Status.ERR:
      return "ERR";
    case WriteMemoryResult_Status.OK:
      return "OK";
    case WriteMemoryResult_Status.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface GetClassDetails {
  /** TODO: Struct? */
  classInfo: ProtoClassInfo | undefined;
}

export interface GetClassDetailsResult {
  /** TODO: Struct? */
  classDetails: ProtoClassDetails | undefined;
}

export interface GetInstanceDetails {
  address: bigint;
}

export interface GetInstanceDetailsResult {
  classDetails:
    | ProtoClassDetails
    | undefined;
  /** nullable */
  fieldValues: { [key: bigint]: Uint8Array };
  /** nullable */
  propertyValues: { [key: bigint]: Uint8Array };
}

export interface GetInstanceDetailsResult_FieldValuesEntry {
  key: bigint;
  value: Uint8Array;
}

export interface GetInstanceDetailsResult_PropertyValuesEntry {
  key: bigint;
  value: Uint8Array;
}

/** TODO: Rename? */
export interface PacketWrapper {
  queryResultId: bigint;
  Packet?:
    | { $case: "setField"; setField: SetField }
    | { $case: "setFieldResult"; setFieldResult: SetFieldResult }
    | { $case: "getField"; getField: GetField }
    | { $case: "getFieldResult"; getFieldResult: GetFieldResult }
    | { $case: "invokeMethod"; invokeMethod: InvokeMethod }
    | { $case: "invokeMethodResult"; invokeMethodResult: InvokeMethodResult }
    | { $case: "searchObjects"; searchObjects: SearchObjects }
    | { $case: "searchObjectsResult"; searchObjectsResult: SearchObjectsResult }
    | { $case: "getAllGameObjects"; getAllGameObjects: GetAllGameObjects }
    | { $case: "getAllGameObjectsResult"; getAllGameObjectsResult: GetAllGameObjectsResult }
    | { $case: "getGameObjectComponents"; getGameObjectComponents: GetGameObjectComponents }
    | { $case: "getGameObjectComponentsResult"; getGameObjectComponentsResult: GetGameObjectComponentsResult }
    | { $case: "readMemory"; readMemory: ReadMemory }
    | { $case: "readMemoryResult"; readMemoryResult: ReadMemoryResult }
    | { $case: "writeMemory"; writeMemory: WriteMemory }
    | { $case: "writeMemoryResult"; writeMemoryResult: WriteMemoryResult }
    | { $case: "getClassDetails"; getClassDetails: GetClassDetails }
    | { $case: "getClassDetailsResult"; getClassDetailsResult: GetClassDetailsResult }
    | { $case: "getInstanceDetails"; getInstanceDetails: GetInstanceDetails }
    | { $case: "getInstanceDetailsResult"; getInstanceDetailsResult: GetInstanceDetailsResult };
}

function createBaseSetField(): SetField {
  return { fieldId: BigInt("0"), objectAddress: BigInt("0"), value: undefined };
}

export const SetField = {
  encode(message: SetField, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fieldId !== BigInt("0")) {
      writer.uint32(8).uint64(message.fieldId.toString());
    }
    if (message.objectAddress !== BigInt("0")) {
      writer.uint32(16).uint64(message.objectAddress.toString());
    }
    if (message.value !== undefined) {
      ProtoDataPayload.encode(message.value, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SetField {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSetField();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.fieldId = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.objectAddress = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.value = ProtoDataPayload.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SetField {
    return {
      fieldId: isSet(object.fieldId) ? BigInt(object.fieldId) : BigInt("0"),
      objectAddress: isSet(object.objectAddress) ? BigInt(object.objectAddress) : BigInt("0"),
      value: isSet(object.value) ? ProtoDataPayload.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: SetField): unknown {
    const obj: any = {};
    message.fieldId !== undefined && (obj.fieldId = message.fieldId.toString());
    message.objectAddress !== undefined && (obj.objectAddress = message.objectAddress.toString());
    message.value !== undefined && (obj.value = message.value ? ProtoDataPayload.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SetField>, I>>(base?: I): SetField {
    return SetField.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SetField>, I>>(object: I): SetField {
    const message = createBaseSetField();
    message.fieldId = object.fieldId ?? BigInt("0");
    message.objectAddress = object.objectAddress ?? BigInt("0");
    message.value = (object.value !== undefined && object.value !== null)
      ? ProtoDataPayload.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseSetFieldResult(): SetFieldResult {
  return { fieldId: BigInt("0") };
}

export const SetFieldResult = {
  encode(message: SetFieldResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fieldId !== BigInt("0")) {
      writer.uint32(8).uint64(message.fieldId.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SetFieldResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSetFieldResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.fieldId = longToBigint(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SetFieldResult {
    return { fieldId: isSet(object.fieldId) ? BigInt(object.fieldId) : BigInt("0") };
  },

  toJSON(message: SetFieldResult): unknown {
    const obj: any = {};
    message.fieldId !== undefined && (obj.fieldId = message.fieldId.toString());
    return obj;
  },

  create<I extends Exact<DeepPartial<SetFieldResult>, I>>(base?: I): SetFieldResult {
    return SetFieldResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SetFieldResult>, I>>(object: I): SetFieldResult {
    const message = createBaseSetFieldResult();
    message.fieldId = object.fieldId ?? BigInt("0");
    return message;
  },
};

function createBaseGetField(): GetField {
  return { fieldId: BigInt("0"), objectAddress: BigInt("0") };
}

export const GetField = {
  encode(message: GetField, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fieldId !== BigInt("0")) {
      writer.uint32(8).uint64(message.fieldId.toString());
    }
    if (message.objectAddress !== BigInt("0")) {
      writer.uint32(16).uint64(message.objectAddress.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetField {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetField();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.fieldId = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.objectAddress = longToBigint(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetField {
    return {
      fieldId: isSet(object.fieldId) ? BigInt(object.fieldId) : BigInt("0"),
      objectAddress: isSet(object.objectAddress) ? BigInt(object.objectAddress) : BigInt("0"),
    };
  },

  toJSON(message: GetField): unknown {
    const obj: any = {};
    message.fieldId !== undefined && (obj.fieldId = message.fieldId.toString());
    message.objectAddress !== undefined && (obj.objectAddress = message.objectAddress.toString());
    return obj;
  },

  create<I extends Exact<DeepPartial<GetField>, I>>(base?: I): GetField {
    return GetField.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetField>, I>>(object: I): GetField {
    const message = createBaseGetField();
    message.fieldId = object.fieldId ?? BigInt("0");
    message.objectAddress = object.objectAddress ?? BigInt("0");
    return message;
  },
};

function createBaseGetFieldResult(): GetFieldResult {
  return { fieldId: BigInt("0"), value: undefined };
}

export const GetFieldResult = {
  encode(message: GetFieldResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fieldId !== BigInt("0")) {
      writer.uint32(8).uint64(message.fieldId.toString());
    }
    if (message.value !== undefined) {
      ProtoDataPayload.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetFieldResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetFieldResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.fieldId = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = ProtoDataPayload.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetFieldResult {
    return {
      fieldId: isSet(object.fieldId) ? BigInt(object.fieldId) : BigInt("0"),
      value: isSet(object.value) ? ProtoDataPayload.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: GetFieldResult): unknown {
    const obj: any = {};
    message.fieldId !== undefined && (obj.fieldId = message.fieldId.toString());
    message.value !== undefined && (obj.value = message.value ? ProtoDataPayload.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetFieldResult>, I>>(base?: I): GetFieldResult {
    return GetFieldResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetFieldResult>, I>>(object: I): GetFieldResult {
    const message = createBaseGetFieldResult();
    message.fieldId = object.fieldId ?? BigInt("0");
    message.value = (object.value !== undefined && object.value !== null)
      ? ProtoDataPayload.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseInvokeMethod(): InvokeMethod {
  return { methodId: BigInt("0"), objectAddress: BigInt("0"), generics: [], args: [] };
}

export const InvokeMethod = {
  encode(message: InvokeMethod, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.methodId !== BigInt("0")) {
      writer.uint32(8).uint64(message.methodId.toString());
    }
    if (message.objectAddress !== BigInt("0")) {
      writer.uint32(16).uint64(message.objectAddress.toString());
    }
    for (const v of message.generics) {
      ProtoTypeInfo.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.args) {
      ProtoDataPayload.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InvokeMethod {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInvokeMethod();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.methodId = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.objectAddress = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.generics.push(ProtoTypeInfo.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.args.push(ProtoDataPayload.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): InvokeMethod {
    return {
      methodId: isSet(object.methodId) ? BigInt(object.methodId) : BigInt("0"),
      objectAddress: isSet(object.objectAddress) ? BigInt(object.objectAddress) : BigInt("0"),
      generics: Array.isArray(object?.generics) ? object.generics.map((e: any) => ProtoTypeInfo.fromJSON(e)) : [],
      args: Array.isArray(object?.args) ? object.args.map((e: any) => ProtoDataPayload.fromJSON(e)) : [],
    };
  },

  toJSON(message: InvokeMethod): unknown {
    const obj: any = {};
    message.methodId !== undefined && (obj.methodId = message.methodId.toString());
    message.objectAddress !== undefined && (obj.objectAddress = message.objectAddress.toString());
    if (message.generics) {
      obj.generics = message.generics.map((e) => e ? ProtoTypeInfo.toJSON(e) : undefined);
    } else {
      obj.generics = [];
    }
    if (message.args) {
      obj.args = message.args.map((e) => e ? ProtoDataPayload.toJSON(e) : undefined);
    } else {
      obj.args = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<InvokeMethod>, I>>(base?: I): InvokeMethod {
    return InvokeMethod.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<InvokeMethod>, I>>(object: I): InvokeMethod {
    const message = createBaseInvokeMethod();
    message.methodId = object.methodId ?? BigInt("0");
    message.objectAddress = object.objectAddress ?? BigInt("0");
    message.generics = object.generics?.map((e) => ProtoTypeInfo.fromPartial(e)) || [];
    message.args = object.args?.map((e) => ProtoDataPayload.fromPartial(e)) || [];
    return message;
  },
};

function createBaseInvokeMethodResult(): InvokeMethodResult {
  return { status: 0, methodId: BigInt("0"), result: undefined, byrefChanges: {}, error: undefined };
}

export const InvokeMethodResult = {
  encode(message: InvokeMethodResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.status !== 0) {
      writer.uint32(8).int32(message.status);
    }
    if (message.methodId !== BigInt("0")) {
      writer.uint32(16).uint64(message.methodId.toString());
    }
    if (message.result !== undefined) {
      ProtoDataPayload.encode(message.result, writer.uint32(26).fork()).ldelim();
    }
    Object.entries(message.byrefChanges).forEach(([key, value]) => {
      InvokeMethodResult_ByrefChangesEntry.encode({ key: key as any, value }, writer.uint32(34).fork()).ldelim();
    });
    if (message.error !== undefined) {
      writer.uint32(42).string(message.error);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InvokeMethodResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInvokeMethodResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.status = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.methodId = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.result = ProtoDataPayload.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          const entry4 = InvokeMethodResult_ByrefChangesEntry.decode(reader, reader.uint32());
          if (entry4.value !== undefined) {
            message.byrefChanges[entry4.key] = entry4.value;
          }
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.error = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): InvokeMethodResult {
    return {
      status: isSet(object.status) ? invokeMethodResult_StatusFromJSON(object.status) : 0,
      methodId: isSet(object.methodId) ? BigInt(object.methodId) : BigInt("0"),
      result: isSet(object.result) ? ProtoDataPayload.fromJSON(object.result) : undefined,
      byrefChanges: isObject(object.byrefChanges)
        ? Object.entries(object.byrefChanges).reduce<{ [key: number]: ProtoDataPayload }>((acc, [key, value]) => {
          acc[Number(key)] = ProtoDataPayload.fromJSON(value);
          return acc;
        }, {})
        : {},
      error: isSet(object.error) ? String(object.error) : undefined,
    };
  },

  toJSON(message: InvokeMethodResult): unknown {
    const obj: any = {};
    message.status !== undefined && (obj.status = invokeMethodResult_StatusToJSON(message.status));
    message.methodId !== undefined && (obj.methodId = message.methodId.toString());
    message.result !== undefined && (obj.result = message.result ? ProtoDataPayload.toJSON(message.result) : undefined);
    obj.byrefChanges = {};
    if (message.byrefChanges) {
      Object.entries(message.byrefChanges).forEach(([k, v]) => {
        obj.byrefChanges[k] = ProtoDataPayload.toJSON(v);
      });
    }
    message.error !== undefined && (obj.error = message.error);
    return obj;
  },

  create<I extends Exact<DeepPartial<InvokeMethodResult>, I>>(base?: I): InvokeMethodResult {
    return InvokeMethodResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<InvokeMethodResult>, I>>(object: I): InvokeMethodResult {
    const message = createBaseInvokeMethodResult();
    message.status = object.status ?? 0;
    message.methodId = object.methodId ?? BigInt("0");
    message.result = (object.result !== undefined && object.result !== null)
      ? ProtoDataPayload.fromPartial(object.result)
      : undefined;
    message.byrefChanges = Object.entries(object.byrefChanges ?? {}).reduce<{ [key: number]: ProtoDataPayload }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[Number(key)] = ProtoDataPayload.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    message.error = object.error ?? undefined;
    return message;
  },
};

function createBaseInvokeMethodResult_ByrefChangesEntry(): InvokeMethodResult_ByrefChangesEntry {
  return { key: 0, value: undefined };
}

export const InvokeMethodResult_ByrefChangesEntry = {
  encode(message: InvokeMethodResult_ByrefChangesEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int32(message.key);
    }
    if (message.value !== undefined) {
      ProtoDataPayload.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): InvokeMethodResult_ByrefChangesEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseInvokeMethodResult_ByrefChangesEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = reader.int32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = ProtoDataPayload.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): InvokeMethodResult_ByrefChangesEntry {
    return {
      key: isSet(object.key) ? Number(object.key) : 0,
      value: isSet(object.value) ? ProtoDataPayload.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: InvokeMethodResult_ByrefChangesEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = Math.round(message.key));
    message.value !== undefined && (obj.value = message.value ? ProtoDataPayload.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<InvokeMethodResult_ByrefChangesEntry>, I>>(
    base?: I,
  ): InvokeMethodResult_ByrefChangesEntry {
    return InvokeMethodResult_ByrefChangesEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<InvokeMethodResult_ByrefChangesEntry>, I>>(
    object: I,
  ): InvokeMethodResult_ByrefChangesEntry {
    const message = createBaseInvokeMethodResult_ByrefChangesEntry();
    message.key = object.key ?? 0;
    message.value = (object.value !== undefined && object.value !== null)
      ? ProtoDataPayload.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseSearchObjects(): SearchObjects {
  return { componentClass: undefined, name: undefined };
}

export const SearchObjects = {
  encode(message: SearchObjects, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.componentClass !== undefined) {
      ProtoClassInfo.encode(message.componentClass, writer.uint32(10).fork()).ldelim();
    }
    if (message.name !== undefined) {
      writer.uint32(18).string(message.name);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SearchObjects {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSearchObjects();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.componentClass = ProtoClassInfo.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.name = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SearchObjects {
    return {
      componentClass: isSet(object.componentClass) ? ProtoClassInfo.fromJSON(object.componentClass) : undefined,
      name: isSet(object.name) ? String(object.name) : undefined,
    };
  },

  toJSON(message: SearchObjects): unknown {
    const obj: any = {};
    message.componentClass !== undefined &&
      (obj.componentClass = message.componentClass ? ProtoClassInfo.toJSON(message.componentClass) : undefined);
    message.name !== undefined && (obj.name = message.name);
    return obj;
  },

  create<I extends Exact<DeepPartial<SearchObjects>, I>>(base?: I): SearchObjects {
    return SearchObjects.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SearchObjects>, I>>(object: I): SearchObjects {
    const message = createBaseSearchObjects();
    message.componentClass = (object.componentClass !== undefined && object.componentClass !== null)
      ? ProtoClassInfo.fromPartial(object.componentClass)
      : undefined;
    message.name = object.name ?? undefined;
    return message;
  },
};

function createBaseSearchObjectsResult(): SearchObjectsResult {
  return { objects: [] };
}

export const SearchObjectsResult = {
  encode(message: SearchObjectsResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.objects) {
      ProtoObject.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SearchObjectsResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSearchObjectsResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.objects.push(ProtoObject.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SearchObjectsResult {
    return { objects: Array.isArray(object?.objects) ? object.objects.map((e: any) => ProtoObject.fromJSON(e)) : [] };
  },

  toJSON(message: SearchObjectsResult): unknown {
    const obj: any = {};
    if (message.objects) {
      obj.objects = message.objects.map((e) => e ? ProtoObject.toJSON(e) : undefined);
    } else {
      obj.objects = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SearchObjectsResult>, I>>(base?: I): SearchObjectsResult {
    return SearchObjectsResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SearchObjectsResult>, I>>(object: I): SearchObjectsResult {
    const message = createBaseSearchObjectsResult();
    message.objects = object.objects?.map((e) => ProtoObject.fromPartial(e)) || [];
    return message;
  },
};

function createBaseGetAllGameObjects(): GetAllGameObjects {
  return {};
}

export const GetAllGameObjects = {
  encode(_: GetAllGameObjects, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetAllGameObjects {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetAllGameObjects();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetAllGameObjects {
    return {};
  },

  toJSON(_: GetAllGameObjects): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<GetAllGameObjects>, I>>(base?: I): GetAllGameObjects {
    return GetAllGameObjects.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetAllGameObjects>, I>>(_: I): GetAllGameObjects {
    const message = createBaseGetAllGameObjects();
    return message;
  },
};

function createBaseGetAllGameObjectsResult(): GetAllGameObjectsResult {
  return { objects: [] };
}

export const GetAllGameObjectsResult = {
  encode(message: GetAllGameObjectsResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.objects) {
      ProtoGameObject.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetAllGameObjectsResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetAllGameObjectsResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.objects.push(ProtoGameObject.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetAllGameObjectsResult {
    return {
      objects: Array.isArray(object?.objects) ? object.objects.map((e: any) => ProtoGameObject.fromJSON(e)) : [],
    };
  },

  toJSON(message: GetAllGameObjectsResult): unknown {
    const obj: any = {};
    if (message.objects) {
      obj.objects = message.objects.map((e) => e ? ProtoGameObject.toJSON(e) : undefined);
    } else {
      obj.objects = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetAllGameObjectsResult>, I>>(base?: I): GetAllGameObjectsResult {
    return GetAllGameObjectsResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetAllGameObjectsResult>, I>>(object: I): GetAllGameObjectsResult {
    const message = createBaseGetAllGameObjectsResult();
    message.objects = object.objects?.map((e) => ProtoGameObject.fromPartial(e)) || [];
    return message;
  },
};

function createBaseGetGameObjectComponents(): GetGameObjectComponents {
  return { address: BigInt("0") };
}

export const GetGameObjectComponents = {
  encode(message: GetGameObjectComponents, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== BigInt("0")) {
      writer.uint32(8).uint64(message.address.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetGameObjectComponents {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetGameObjectComponents();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.address = longToBigint(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetGameObjectComponents {
    return { address: isSet(object.address) ? BigInt(object.address) : BigInt("0") };
  },

  toJSON(message: GetGameObjectComponents): unknown {
    const obj: any = {};
    message.address !== undefined && (obj.address = message.address.toString());
    return obj;
  },

  create<I extends Exact<DeepPartial<GetGameObjectComponents>, I>>(base?: I): GetGameObjectComponents {
    return GetGameObjectComponents.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetGameObjectComponents>, I>>(object: I): GetGameObjectComponents {
    const message = createBaseGetGameObjectComponents();
    message.address = object.address ?? BigInt("0");
    return message;
  },
};

function createBaseGetGameObjectComponentsResult(): GetGameObjectComponentsResult {
  return { components: [] };
}

export const GetGameObjectComponentsResult = {
  encode(message: GetGameObjectComponentsResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.components) {
      ProtoComponent.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetGameObjectComponentsResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetGameObjectComponentsResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.components.push(ProtoComponent.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetGameObjectComponentsResult {
    return {
      components: Array.isArray(object?.components)
        ? object.components.map((e: any) => ProtoComponent.fromJSON(e))
        : [],
    };
  },

  toJSON(message: GetGameObjectComponentsResult): unknown {
    const obj: any = {};
    if (message.components) {
      obj.components = message.components.map((e) => e ? ProtoComponent.toJSON(e) : undefined);
    } else {
      obj.components = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetGameObjectComponentsResult>, I>>(base?: I): GetGameObjectComponentsResult {
    return GetGameObjectComponentsResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetGameObjectComponentsResult>, I>>(
    object: I,
  ): GetGameObjectComponentsResult {
    const message = createBaseGetGameObjectComponentsResult();
    message.components = object.components?.map((e) => ProtoComponent.fromPartial(e)) || [];
    return message;
  },
};

function createBaseReadMemory(): ReadMemory {
  return { address: BigInt("0"), size: BigInt("0") };
}

export const ReadMemory = {
  encode(message: ReadMemory, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== BigInt("0")) {
      writer.uint32(8).uint64(message.address.toString());
    }
    if (message.size !== BigInt("0")) {
      writer.uint32(16).uint64(message.size.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReadMemory {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReadMemory();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.address = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.size = longToBigint(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ReadMemory {
    return {
      address: isSet(object.address) ? BigInt(object.address) : BigInt("0"),
      size: isSet(object.size) ? BigInt(object.size) : BigInt("0"),
    };
  },

  toJSON(message: ReadMemory): unknown {
    const obj: any = {};
    message.address !== undefined && (obj.address = message.address.toString());
    message.size !== undefined && (obj.size = message.size.toString());
    return obj;
  },

  create<I extends Exact<DeepPartial<ReadMemory>, I>>(base?: I): ReadMemory {
    return ReadMemory.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReadMemory>, I>>(object: I): ReadMemory {
    const message = createBaseReadMemory();
    message.address = object.address ?? BigInt("0");
    message.size = object.size ?? BigInt("0");
    return message;
  },
};

function createBaseReadMemoryResult(): ReadMemoryResult {
  return { status: 0, address: BigInt("0"), data: new Uint8Array() };
}

export const ReadMemoryResult = {
  encode(message: ReadMemoryResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.status !== 0) {
      writer.uint32(8).int32(message.status);
    }
    if (message.address !== BigInt("0")) {
      writer.uint32(16).uint64(message.address.toString());
    }
    if (message.data.length !== 0) {
      writer.uint32(26).bytes(message.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReadMemoryResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReadMemoryResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.status = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.address = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.data = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ReadMemoryResult {
    return {
      status: isSet(object.status) ? readMemoryResult_StatusFromJSON(object.status) : 0,
      address: isSet(object.address) ? BigInt(object.address) : BigInt("0"),
      data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(),
    };
  },

  toJSON(message: ReadMemoryResult): unknown {
    const obj: any = {};
    message.status !== undefined && (obj.status = readMemoryResult_StatusToJSON(message.status));
    message.address !== undefined && (obj.address = message.address.toString());
    message.data !== undefined &&
      (obj.data = base64FromBytes(message.data !== undefined ? message.data : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<ReadMemoryResult>, I>>(base?: I): ReadMemoryResult {
    return ReadMemoryResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReadMemoryResult>, I>>(object: I): ReadMemoryResult {
    const message = createBaseReadMemoryResult();
    message.status = object.status ?? 0;
    message.address = object.address ?? BigInt("0");
    message.data = object.data ?? new Uint8Array();
    return message;
  },
};

function createBaseWriteMemory(): WriteMemory {
  return { address: BigInt("0"), data: new Uint8Array() };
}

export const WriteMemory = {
  encode(message: WriteMemory, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== BigInt("0")) {
      writer.uint32(8).uint64(message.address.toString());
    }
    if (message.data.length !== 0) {
      writer.uint32(18).bytes(message.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): WriteMemory {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseWriteMemory();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.address = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.data = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): WriteMemory {
    return {
      address: isSet(object.address) ? BigInt(object.address) : BigInt("0"),
      data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(),
    };
  },

  toJSON(message: WriteMemory): unknown {
    const obj: any = {};
    message.address !== undefined && (obj.address = message.address.toString());
    message.data !== undefined &&
      (obj.data = base64FromBytes(message.data !== undefined ? message.data : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<WriteMemory>, I>>(base?: I): WriteMemory {
    return WriteMemory.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<WriteMemory>, I>>(object: I): WriteMemory {
    const message = createBaseWriteMemory();
    message.address = object.address ?? BigInt("0");
    message.data = object.data ?? new Uint8Array();
    return message;
  },
};

function createBaseWriteMemoryResult(): WriteMemoryResult {
  return { status: 0, address: BigInt("0"), size: BigInt("0") };
}

export const WriteMemoryResult = {
  encode(message: WriteMemoryResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.status !== 0) {
      writer.uint32(8).int32(message.status);
    }
    if (message.address !== BigInt("0")) {
      writer.uint32(16).uint64(message.address.toString());
    }
    if (message.size !== BigInt("0")) {
      writer.uint32(24).uint64(message.size.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): WriteMemoryResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseWriteMemoryResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.status = reader.int32() as any;
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.address = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.size = longToBigint(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): WriteMemoryResult {
    return {
      status: isSet(object.status) ? writeMemoryResult_StatusFromJSON(object.status) : 0,
      address: isSet(object.address) ? BigInt(object.address) : BigInt("0"),
      size: isSet(object.size) ? BigInt(object.size) : BigInt("0"),
    };
  },

  toJSON(message: WriteMemoryResult): unknown {
    const obj: any = {};
    message.status !== undefined && (obj.status = writeMemoryResult_StatusToJSON(message.status));
    message.address !== undefined && (obj.address = message.address.toString());
    message.size !== undefined && (obj.size = message.size.toString());
    return obj;
  },

  create<I extends Exact<DeepPartial<WriteMemoryResult>, I>>(base?: I): WriteMemoryResult {
    return WriteMemoryResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<WriteMemoryResult>, I>>(object: I): WriteMemoryResult {
    const message = createBaseWriteMemoryResult();
    message.status = object.status ?? 0;
    message.address = object.address ?? BigInt("0");
    message.size = object.size ?? BigInt("0");
    return message;
  },
};

function createBaseGetClassDetails(): GetClassDetails {
  return { classInfo: undefined };
}

export const GetClassDetails = {
  encode(message: GetClassDetails, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.classInfo !== undefined) {
      ProtoClassInfo.encode(message.classInfo, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetClassDetails {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetClassDetails();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.classInfo = ProtoClassInfo.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetClassDetails {
    return { classInfo: isSet(object.classInfo) ? ProtoClassInfo.fromJSON(object.classInfo) : undefined };
  },

  toJSON(message: GetClassDetails): unknown {
    const obj: any = {};
    message.classInfo !== undefined &&
      (obj.classInfo = message.classInfo ? ProtoClassInfo.toJSON(message.classInfo) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetClassDetails>, I>>(base?: I): GetClassDetails {
    return GetClassDetails.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetClassDetails>, I>>(object: I): GetClassDetails {
    const message = createBaseGetClassDetails();
    message.classInfo = (object.classInfo !== undefined && object.classInfo !== null)
      ? ProtoClassInfo.fromPartial(object.classInfo)
      : undefined;
    return message;
  },
};

function createBaseGetClassDetailsResult(): GetClassDetailsResult {
  return { classDetails: undefined };
}

export const GetClassDetailsResult = {
  encode(message: GetClassDetailsResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.classDetails !== undefined) {
      ProtoClassDetails.encode(message.classDetails, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetClassDetailsResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetClassDetailsResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.classDetails = ProtoClassDetails.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetClassDetailsResult {
    return { classDetails: isSet(object.classDetails) ? ProtoClassDetails.fromJSON(object.classDetails) : undefined };
  },

  toJSON(message: GetClassDetailsResult): unknown {
    const obj: any = {};
    message.classDetails !== undefined &&
      (obj.classDetails = message.classDetails ? ProtoClassDetails.toJSON(message.classDetails) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetClassDetailsResult>, I>>(base?: I): GetClassDetailsResult {
    return GetClassDetailsResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetClassDetailsResult>, I>>(object: I): GetClassDetailsResult {
    const message = createBaseGetClassDetailsResult();
    message.classDetails = (object.classDetails !== undefined && object.classDetails !== null)
      ? ProtoClassDetails.fromPartial(object.classDetails)
      : undefined;
    return message;
  },
};

function createBaseGetInstanceDetails(): GetInstanceDetails {
  return { address: BigInt("0") };
}

export const GetInstanceDetails = {
  encode(message: GetInstanceDetails, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== BigInt("0")) {
      writer.uint32(8).uint64(message.address.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetInstanceDetails {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetInstanceDetails();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.address = longToBigint(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetInstanceDetails {
    return { address: isSet(object.address) ? BigInt(object.address) : BigInt("0") };
  },

  toJSON(message: GetInstanceDetails): unknown {
    const obj: any = {};
    message.address !== undefined && (obj.address = message.address.toString());
    return obj;
  },

  create<I extends Exact<DeepPartial<GetInstanceDetails>, I>>(base?: I): GetInstanceDetails {
    return GetInstanceDetails.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetInstanceDetails>, I>>(object: I): GetInstanceDetails {
    const message = createBaseGetInstanceDetails();
    message.address = object.address ?? BigInt("0");
    return message;
  },
};

function createBaseGetInstanceDetailsResult(): GetInstanceDetailsResult {
  return { classDetails: undefined, fieldValues: {}, propertyValues: {} };
}

export const GetInstanceDetailsResult = {
  encode(message: GetInstanceDetailsResult, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.classDetails !== undefined) {
      ProtoClassDetails.encode(message.classDetails, writer.uint32(10).fork()).ldelim();
    }
    Object.entries(message.fieldValues).forEach(([key, value]) => {
      GetInstanceDetailsResult_FieldValuesEntry.encode({ key: key as any, value }, writer.uint32(26).fork()).ldelim();
    });
    Object.entries(message.propertyValues).forEach(([key, value]) => {
      GetInstanceDetailsResult_PropertyValuesEntry.encode({ key: key as any, value }, writer.uint32(34).fork())
        .ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetInstanceDetailsResult {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetInstanceDetailsResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.classDetails = ProtoClassDetails.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          const entry3 = GetInstanceDetailsResult_FieldValuesEntry.decode(reader, reader.uint32());
          if (entry3.value !== undefined) {
            message.fieldValues[entry3.key] = entry3.value;
          }
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          const entry4 = GetInstanceDetailsResult_PropertyValuesEntry.decode(reader, reader.uint32());
          if (entry4.value !== undefined) {
            message.propertyValues[entry4.key] = entry4.value;
          }
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetInstanceDetailsResult {
    return {
      classDetails: isSet(object.classDetails) ? ProtoClassDetails.fromJSON(object.classDetails) : undefined,
      fieldValues: isObject(object.fieldValues)
        ? Object.entries(object.fieldValues).reduce<{ [key: bigint]: Uint8Array }>((acc, [key, value]) => {
          acc[Number(key)] = bytesFromBase64(value as string);
          return acc;
        }, {})
        : {},
      propertyValues: isObject(object.propertyValues)
        ? Object.entries(object.propertyValues).reduce<{ [key: bigint]: Uint8Array }>((acc, [key, value]) => {
          acc[Number(key)] = bytesFromBase64(value as string);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: GetInstanceDetailsResult): unknown {
    const obj: any = {};
    message.classDetails !== undefined &&
      (obj.classDetails = message.classDetails ? ProtoClassDetails.toJSON(message.classDetails) : undefined);
    obj.fieldValues = {};
    if (message.fieldValues) {
      Object.entries(message.fieldValues).forEach(([k, v]) => {
        obj.fieldValues[k] = base64FromBytes(v);
      });
    }
    obj.propertyValues = {};
    if (message.propertyValues) {
      Object.entries(message.propertyValues).forEach(([k, v]) => {
        obj.propertyValues[k] = base64FromBytes(v);
      });
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetInstanceDetailsResult>, I>>(base?: I): GetInstanceDetailsResult {
    return GetInstanceDetailsResult.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetInstanceDetailsResult>, I>>(object: I): GetInstanceDetailsResult {
    const message = createBaseGetInstanceDetailsResult();
    message.classDetails = (object.classDetails !== undefined && object.classDetails !== null)
      ? ProtoClassDetails.fromPartial(object.classDetails)
      : undefined;
    message.fieldValues = Object.entries(object.fieldValues ?? {}).reduce<{ [key: bigint]: Uint8Array }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[Number(key)] = value;
        }
        return acc;
      },
      {},
    );
    message.propertyValues = Object.entries(object.propertyValues ?? {}).reduce<{ [key: bigint]: Uint8Array }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[Number(key)] = value;
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseGetInstanceDetailsResult_FieldValuesEntry(): GetInstanceDetailsResult_FieldValuesEntry {
  return { key: BigInt("0"), value: new Uint8Array() };
}

export const GetInstanceDetailsResult_FieldValuesEntry = {
  encode(message: GetInstanceDetailsResult_FieldValuesEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== BigInt("0")) {
      writer.uint32(8).uint64(message.key.toString());
    }
    if (message.value.length !== 0) {
      writer.uint32(18).bytes(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetInstanceDetailsResult_FieldValuesEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetInstanceDetailsResult_FieldValuesEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetInstanceDetailsResult_FieldValuesEntry {
    return {
      key: isSet(object.key) ? BigInt(object.key) : BigInt("0"),
      value: isSet(object.value) ? bytesFromBase64(object.value) : new Uint8Array(),
    };
  },

  toJSON(message: GetInstanceDetailsResult_FieldValuesEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key.toString());
    message.value !== undefined &&
      (obj.value = base64FromBytes(message.value !== undefined ? message.value : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<GetInstanceDetailsResult_FieldValuesEntry>, I>>(
    base?: I,
  ): GetInstanceDetailsResult_FieldValuesEntry {
    return GetInstanceDetailsResult_FieldValuesEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetInstanceDetailsResult_FieldValuesEntry>, I>>(
    object: I,
  ): GetInstanceDetailsResult_FieldValuesEntry {
    const message = createBaseGetInstanceDetailsResult_FieldValuesEntry();
    message.key = object.key ?? BigInt("0");
    message.value = object.value ?? new Uint8Array();
    return message;
  },
};

function createBaseGetInstanceDetailsResult_PropertyValuesEntry(): GetInstanceDetailsResult_PropertyValuesEntry {
  return { key: BigInt("0"), value: new Uint8Array() };
}

export const GetInstanceDetailsResult_PropertyValuesEntry = {
  encode(message: GetInstanceDetailsResult_PropertyValuesEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== BigInt("0")) {
      writer.uint32(8).uint64(message.key.toString());
    }
    if (message.value.length !== 0) {
      writer.uint32(18).bytes(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetInstanceDetailsResult_PropertyValuesEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetInstanceDetailsResult_PropertyValuesEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.key = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetInstanceDetailsResult_PropertyValuesEntry {
    return {
      key: isSet(object.key) ? BigInt(object.key) : BigInt("0"),
      value: isSet(object.value) ? bytesFromBase64(object.value) : new Uint8Array(),
    };
  },

  toJSON(message: GetInstanceDetailsResult_PropertyValuesEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key.toString());
    message.value !== undefined &&
      (obj.value = base64FromBytes(message.value !== undefined ? message.value : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<GetInstanceDetailsResult_PropertyValuesEntry>, I>>(
    base?: I,
  ): GetInstanceDetailsResult_PropertyValuesEntry {
    return GetInstanceDetailsResult_PropertyValuesEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetInstanceDetailsResult_PropertyValuesEntry>, I>>(
    object: I,
  ): GetInstanceDetailsResult_PropertyValuesEntry {
    const message = createBaseGetInstanceDetailsResult_PropertyValuesEntry();
    message.key = object.key ?? BigInt("0");
    message.value = object.value ?? new Uint8Array();
    return message;
  },
};

function createBasePacketWrapper(): PacketWrapper {
  return { queryResultId: BigInt("0"), Packet: undefined };
}

export const PacketWrapper = {
  encode(message: PacketWrapper, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.queryResultId !== BigInt("0")) {
      writer.uint32(8).uint64(message.queryResultId.toString());
    }
    switch (message.Packet?.$case) {
      case "setField":
        SetField.encode(message.Packet.setField, writer.uint32(18).fork()).ldelim();
        break;
      case "setFieldResult":
        SetFieldResult.encode(message.Packet.setFieldResult, writer.uint32(26).fork()).ldelim();
        break;
      case "getField":
        GetField.encode(message.Packet.getField, writer.uint32(34).fork()).ldelim();
        break;
      case "getFieldResult":
        GetFieldResult.encode(message.Packet.getFieldResult, writer.uint32(42).fork()).ldelim();
        break;
      case "invokeMethod":
        InvokeMethod.encode(message.Packet.invokeMethod, writer.uint32(50).fork()).ldelim();
        break;
      case "invokeMethodResult":
        InvokeMethodResult.encode(message.Packet.invokeMethodResult, writer.uint32(58).fork()).ldelim();
        break;
      case "searchObjects":
        SearchObjects.encode(message.Packet.searchObjects, writer.uint32(66).fork()).ldelim();
        break;
      case "searchObjectsResult":
        SearchObjectsResult.encode(message.Packet.searchObjectsResult, writer.uint32(74).fork()).ldelim();
        break;
      case "getAllGameObjects":
        GetAllGameObjects.encode(message.Packet.getAllGameObjects, writer.uint32(82).fork()).ldelim();
        break;
      case "getAllGameObjectsResult":
        GetAllGameObjectsResult.encode(message.Packet.getAllGameObjectsResult, writer.uint32(90).fork()).ldelim();
        break;
      case "getGameObjectComponents":
        GetGameObjectComponents.encode(message.Packet.getGameObjectComponents, writer.uint32(98).fork()).ldelim();
        break;
      case "getGameObjectComponentsResult":
        GetGameObjectComponentsResult.encode(message.Packet.getGameObjectComponentsResult, writer.uint32(106).fork())
          .ldelim();
        break;
      case "readMemory":
        ReadMemory.encode(message.Packet.readMemory, writer.uint32(114).fork()).ldelim();
        break;
      case "readMemoryResult":
        ReadMemoryResult.encode(message.Packet.readMemoryResult, writer.uint32(122).fork()).ldelim();
        break;
      case "writeMemory":
        WriteMemory.encode(message.Packet.writeMemory, writer.uint32(130).fork()).ldelim();
        break;
      case "writeMemoryResult":
        WriteMemoryResult.encode(message.Packet.writeMemoryResult, writer.uint32(138).fork()).ldelim();
        break;
      case "getClassDetails":
        GetClassDetails.encode(message.Packet.getClassDetails, writer.uint32(146).fork()).ldelim();
        break;
      case "getClassDetailsResult":
        GetClassDetailsResult.encode(message.Packet.getClassDetailsResult, writer.uint32(154).fork()).ldelim();
        break;
      case "getInstanceDetails":
        GetInstanceDetails.encode(message.Packet.getInstanceDetails, writer.uint32(162).fork()).ldelim();
        break;
      case "getInstanceDetailsResult":
        GetInstanceDetailsResult.encode(message.Packet.getInstanceDetailsResult, writer.uint32(170).fork()).ldelim();
        break;
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PacketWrapper {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePacketWrapper();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.queryResultId = longToBigint(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.Packet = { $case: "setField", setField: SetField.decode(reader, reader.uint32()) };
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.Packet = { $case: "setFieldResult", setFieldResult: SetFieldResult.decode(reader, reader.uint32()) };
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.Packet = { $case: "getField", getField: GetField.decode(reader, reader.uint32()) };
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.Packet = { $case: "getFieldResult", getFieldResult: GetFieldResult.decode(reader, reader.uint32()) };
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.Packet = { $case: "invokeMethod", invokeMethod: InvokeMethod.decode(reader, reader.uint32()) };
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.Packet = {
            $case: "invokeMethodResult",
            invokeMethodResult: InvokeMethodResult.decode(reader, reader.uint32()),
          };
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.Packet = { $case: "searchObjects", searchObjects: SearchObjects.decode(reader, reader.uint32()) };
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.Packet = {
            $case: "searchObjectsResult",
            searchObjectsResult: SearchObjectsResult.decode(reader, reader.uint32()),
          };
          continue;
        case 10:
          if (tag !== 82) {
            break;
          }

          message.Packet = {
            $case: "getAllGameObjects",
            getAllGameObjects: GetAllGameObjects.decode(reader, reader.uint32()),
          };
          continue;
        case 11:
          if (tag !== 90) {
            break;
          }

          message.Packet = {
            $case: "getAllGameObjectsResult",
            getAllGameObjectsResult: GetAllGameObjectsResult.decode(reader, reader.uint32()),
          };
          continue;
        case 12:
          if (tag !== 98) {
            break;
          }

          message.Packet = {
            $case: "getGameObjectComponents",
            getGameObjectComponents: GetGameObjectComponents.decode(reader, reader.uint32()),
          };
          continue;
        case 13:
          if (tag !== 106) {
            break;
          }

          message.Packet = {
            $case: "getGameObjectComponentsResult",
            getGameObjectComponentsResult: GetGameObjectComponentsResult.decode(reader, reader.uint32()),
          };
          continue;
        case 14:
          if (tag !== 114) {
            break;
          }

          message.Packet = { $case: "readMemory", readMemory: ReadMemory.decode(reader, reader.uint32()) };
          continue;
        case 15:
          if (tag !== 122) {
            break;
          }

          message.Packet = {
            $case: "readMemoryResult",
            readMemoryResult: ReadMemoryResult.decode(reader, reader.uint32()),
          };
          continue;
        case 16:
          if (tag !== 130) {
            break;
          }

          message.Packet = { $case: "writeMemory", writeMemory: WriteMemory.decode(reader, reader.uint32()) };
          continue;
        case 17:
          if (tag !== 138) {
            break;
          }

          message.Packet = {
            $case: "writeMemoryResult",
            writeMemoryResult: WriteMemoryResult.decode(reader, reader.uint32()),
          };
          continue;
        case 18:
          if (tag !== 146) {
            break;
          }

          message.Packet = {
            $case: "getClassDetails",
            getClassDetails: GetClassDetails.decode(reader, reader.uint32()),
          };
          continue;
        case 19:
          if (tag !== 154) {
            break;
          }

          message.Packet = {
            $case: "getClassDetailsResult",
            getClassDetailsResult: GetClassDetailsResult.decode(reader, reader.uint32()),
          };
          continue;
        case 20:
          if (tag !== 162) {
            break;
          }

          message.Packet = {
            $case: "getInstanceDetails",
            getInstanceDetails: GetInstanceDetails.decode(reader, reader.uint32()),
          };
          continue;
        case 21:
          if (tag !== 170) {
            break;
          }

          message.Packet = {
            $case: "getInstanceDetailsResult",
            getInstanceDetailsResult: GetInstanceDetailsResult.decode(reader, reader.uint32()),
          };
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PacketWrapper {
    return {
      queryResultId: isSet(object.queryResultId) ? BigInt(object.queryResultId) : BigInt("0"),
      Packet: isSet(object.setField)
        ? { $case: "setField", setField: SetField.fromJSON(object.setField) }
        : isSet(object.setFieldResult)
        ? { $case: "setFieldResult", setFieldResult: SetFieldResult.fromJSON(object.setFieldResult) }
        : isSet(object.getField)
        ? { $case: "getField", getField: GetField.fromJSON(object.getField) }
        : isSet(object.getFieldResult)
        ? { $case: "getFieldResult", getFieldResult: GetFieldResult.fromJSON(object.getFieldResult) }
        : isSet(object.invokeMethod)
        ? { $case: "invokeMethod", invokeMethod: InvokeMethod.fromJSON(object.invokeMethod) }
        : isSet(object.invokeMethodResult)
        ? { $case: "invokeMethodResult", invokeMethodResult: InvokeMethodResult.fromJSON(object.invokeMethodResult) }
        : isSet(object.searchObjects)
        ? { $case: "searchObjects", searchObjects: SearchObjects.fromJSON(object.searchObjects) }
        : isSet(object.searchObjectsResult)
        ? {
          $case: "searchObjectsResult",
          searchObjectsResult: SearchObjectsResult.fromJSON(object.searchObjectsResult),
        }
        : isSet(object.getAllGameObjects)
        ? { $case: "getAllGameObjects", getAllGameObjects: GetAllGameObjects.fromJSON(object.getAllGameObjects) }
        : isSet(object.getAllGameObjectsResult)
        ? {
          $case: "getAllGameObjectsResult",
          getAllGameObjectsResult: GetAllGameObjectsResult.fromJSON(object.getAllGameObjectsResult),
        }
        : isSet(object.getGameObjectComponents)
        ? {
          $case: "getGameObjectComponents",
          getGameObjectComponents: GetGameObjectComponents.fromJSON(object.getGameObjectComponents),
        }
        : isSet(object.getGameObjectComponentsResult)
        ? {
          $case: "getGameObjectComponentsResult",
          getGameObjectComponentsResult: GetGameObjectComponentsResult.fromJSON(object.getGameObjectComponentsResult),
        }
        : isSet(object.readMemory)
        ? { $case: "readMemory", readMemory: ReadMemory.fromJSON(object.readMemory) }
        : isSet(object.readMemoryResult)
        ? { $case: "readMemoryResult", readMemoryResult: ReadMemoryResult.fromJSON(object.readMemoryResult) }
        : isSet(object.writeMemory)
        ? { $case: "writeMemory", writeMemory: WriteMemory.fromJSON(object.writeMemory) }
        : isSet(object.writeMemoryResult)
        ? { $case: "writeMemoryResult", writeMemoryResult: WriteMemoryResult.fromJSON(object.writeMemoryResult) }
        : isSet(object.getClassDetails)
        ? { $case: "getClassDetails", getClassDetails: GetClassDetails.fromJSON(object.getClassDetails) }
        : isSet(object.getClassDetailsResult)
        ? {
          $case: "getClassDetailsResult",
          getClassDetailsResult: GetClassDetailsResult.fromJSON(object.getClassDetailsResult),
        }
        : isSet(object.getInstanceDetails)
        ? { $case: "getInstanceDetails", getInstanceDetails: GetInstanceDetails.fromJSON(object.getInstanceDetails) }
        : isSet(object.getInstanceDetailsResult)
        ? {
          $case: "getInstanceDetailsResult",
          getInstanceDetailsResult: GetInstanceDetailsResult.fromJSON(object.getInstanceDetailsResult),
        }
        : undefined,
    };
  },

  toJSON(message: PacketWrapper): unknown {
    const obj: any = {};
    message.queryResultId !== undefined && (obj.queryResultId = message.queryResultId.toString());
    message.Packet?.$case === "setField" &&
      (obj.setField = message.Packet?.setField ? SetField.toJSON(message.Packet?.setField) : undefined);
    message.Packet?.$case === "setFieldResult" && (obj.setFieldResult = message.Packet?.setFieldResult
      ? SetFieldResult.toJSON(message.Packet?.setFieldResult)
      : undefined);
    message.Packet?.$case === "getField" &&
      (obj.getField = message.Packet?.getField ? GetField.toJSON(message.Packet?.getField) : undefined);
    message.Packet?.$case === "getFieldResult" && (obj.getFieldResult = message.Packet?.getFieldResult
      ? GetFieldResult.toJSON(message.Packet?.getFieldResult)
      : undefined);
    message.Packet?.$case === "invokeMethod" &&
      (obj.invokeMethod = message.Packet?.invokeMethod ? InvokeMethod.toJSON(message.Packet?.invokeMethod) : undefined);
    message.Packet?.$case === "invokeMethodResult" && (obj.invokeMethodResult = message.Packet?.invokeMethodResult
      ? InvokeMethodResult.toJSON(message.Packet?.invokeMethodResult)
      : undefined);
    message.Packet?.$case === "searchObjects" && (obj.searchObjects = message.Packet?.searchObjects
      ? SearchObjects.toJSON(message.Packet?.searchObjects)
      : undefined);
    message.Packet?.$case === "searchObjectsResult" && (obj.searchObjectsResult = message.Packet?.searchObjectsResult
      ? SearchObjectsResult.toJSON(message.Packet?.searchObjectsResult)
      : undefined);
    message.Packet?.$case === "getAllGameObjects" && (obj.getAllGameObjects = message.Packet?.getAllGameObjects
      ? GetAllGameObjects.toJSON(message.Packet?.getAllGameObjects)
      : undefined);
    message.Packet?.$case === "getAllGameObjectsResult" &&
      (obj.getAllGameObjectsResult = message.Packet?.getAllGameObjectsResult
        ? GetAllGameObjectsResult.toJSON(message.Packet?.getAllGameObjectsResult)
        : undefined);
    message.Packet?.$case === "getGameObjectComponents" &&
      (obj.getGameObjectComponents = message.Packet?.getGameObjectComponents
        ? GetGameObjectComponents.toJSON(message.Packet?.getGameObjectComponents)
        : undefined);
    message.Packet?.$case === "getGameObjectComponentsResult" &&
      (obj.getGameObjectComponentsResult = message.Packet?.getGameObjectComponentsResult
        ? GetGameObjectComponentsResult.toJSON(message.Packet?.getGameObjectComponentsResult)
        : undefined);
    message.Packet?.$case === "readMemory" &&
      (obj.readMemory = message.Packet?.readMemory ? ReadMemory.toJSON(message.Packet?.readMemory) : undefined);
    message.Packet?.$case === "readMemoryResult" && (obj.readMemoryResult = message.Packet?.readMemoryResult
      ? ReadMemoryResult.toJSON(message.Packet?.readMemoryResult)
      : undefined);
    message.Packet?.$case === "writeMemory" &&
      (obj.writeMemory = message.Packet?.writeMemory ? WriteMemory.toJSON(message.Packet?.writeMemory) : undefined);
    message.Packet?.$case === "writeMemoryResult" && (obj.writeMemoryResult = message.Packet?.writeMemoryResult
      ? WriteMemoryResult.toJSON(message.Packet?.writeMemoryResult)
      : undefined);
    message.Packet?.$case === "getClassDetails" && (obj.getClassDetails = message.Packet?.getClassDetails
      ? GetClassDetails.toJSON(message.Packet?.getClassDetails)
      : undefined);
    message.Packet?.$case === "getClassDetailsResult" &&
      (obj.getClassDetailsResult = message.Packet?.getClassDetailsResult
        ? GetClassDetailsResult.toJSON(message.Packet?.getClassDetailsResult)
        : undefined);
    message.Packet?.$case === "getInstanceDetails" && (obj.getInstanceDetails = message.Packet?.getInstanceDetails
      ? GetInstanceDetails.toJSON(message.Packet?.getInstanceDetails)
      : undefined);
    message.Packet?.$case === "getInstanceDetailsResult" &&
      (obj.getInstanceDetailsResult = message.Packet?.getInstanceDetailsResult
        ? GetInstanceDetailsResult.toJSON(message.Packet?.getInstanceDetailsResult)
        : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<PacketWrapper>, I>>(base?: I): PacketWrapper {
    return PacketWrapper.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<PacketWrapper>, I>>(object: I): PacketWrapper {
    const message = createBasePacketWrapper();
    message.queryResultId = object.queryResultId ?? BigInt("0");
    if (
      object.Packet?.$case === "setField" && object.Packet?.setField !== undefined && object.Packet?.setField !== null
    ) {
      message.Packet = { $case: "setField", setField: SetField.fromPartial(object.Packet.setField) };
    }
    if (
      object.Packet?.$case === "setFieldResult" &&
      object.Packet?.setFieldResult !== undefined &&
      object.Packet?.setFieldResult !== null
    ) {
      message.Packet = {
        $case: "setFieldResult",
        setFieldResult: SetFieldResult.fromPartial(object.Packet.setFieldResult),
      };
    }
    if (
      object.Packet?.$case === "getField" && object.Packet?.getField !== undefined && object.Packet?.getField !== null
    ) {
      message.Packet = { $case: "getField", getField: GetField.fromPartial(object.Packet.getField) };
    }
    if (
      object.Packet?.$case === "getFieldResult" &&
      object.Packet?.getFieldResult !== undefined &&
      object.Packet?.getFieldResult !== null
    ) {
      message.Packet = {
        $case: "getFieldResult",
        getFieldResult: GetFieldResult.fromPartial(object.Packet.getFieldResult),
      };
    }
    if (
      object.Packet?.$case === "invokeMethod" &&
      object.Packet?.invokeMethod !== undefined &&
      object.Packet?.invokeMethod !== null
    ) {
      message.Packet = { $case: "invokeMethod", invokeMethod: InvokeMethod.fromPartial(object.Packet.invokeMethod) };
    }
    if (
      object.Packet?.$case === "invokeMethodResult" &&
      object.Packet?.invokeMethodResult !== undefined &&
      object.Packet?.invokeMethodResult !== null
    ) {
      message.Packet = {
        $case: "invokeMethodResult",
        invokeMethodResult: InvokeMethodResult.fromPartial(object.Packet.invokeMethodResult),
      };
    }
    if (
      object.Packet?.$case === "searchObjects" &&
      object.Packet?.searchObjects !== undefined &&
      object.Packet?.searchObjects !== null
    ) {
      message.Packet = {
        $case: "searchObjects",
        searchObjects: SearchObjects.fromPartial(object.Packet.searchObjects),
      };
    }
    if (
      object.Packet?.$case === "searchObjectsResult" &&
      object.Packet?.searchObjectsResult !== undefined &&
      object.Packet?.searchObjectsResult !== null
    ) {
      message.Packet = {
        $case: "searchObjectsResult",
        searchObjectsResult: SearchObjectsResult.fromPartial(object.Packet.searchObjectsResult),
      };
    }
    if (
      object.Packet?.$case === "getAllGameObjects" &&
      object.Packet?.getAllGameObjects !== undefined &&
      object.Packet?.getAllGameObjects !== null
    ) {
      message.Packet = {
        $case: "getAllGameObjects",
        getAllGameObjects: GetAllGameObjects.fromPartial(object.Packet.getAllGameObjects),
      };
    }
    if (
      object.Packet?.$case === "getAllGameObjectsResult" &&
      object.Packet?.getAllGameObjectsResult !== undefined &&
      object.Packet?.getAllGameObjectsResult !== null
    ) {
      message.Packet = {
        $case: "getAllGameObjectsResult",
        getAllGameObjectsResult: GetAllGameObjectsResult.fromPartial(object.Packet.getAllGameObjectsResult),
      };
    }
    if (
      object.Packet?.$case === "getGameObjectComponents" &&
      object.Packet?.getGameObjectComponents !== undefined &&
      object.Packet?.getGameObjectComponents !== null
    ) {
      message.Packet = {
        $case: "getGameObjectComponents",
        getGameObjectComponents: GetGameObjectComponents.fromPartial(object.Packet.getGameObjectComponents),
      };
    }
    if (
      object.Packet?.$case === "getGameObjectComponentsResult" &&
      object.Packet?.getGameObjectComponentsResult !== undefined &&
      object.Packet?.getGameObjectComponentsResult !== null
    ) {
      message.Packet = {
        $case: "getGameObjectComponentsResult",
        getGameObjectComponentsResult: GetGameObjectComponentsResult.fromPartial(
          object.Packet.getGameObjectComponentsResult,
        ),
      };
    }
    if (
      object.Packet?.$case === "readMemory" &&
      object.Packet?.readMemory !== undefined &&
      object.Packet?.readMemory !== null
    ) {
      message.Packet = { $case: "readMemory", readMemory: ReadMemory.fromPartial(object.Packet.readMemory) };
    }
    if (
      object.Packet?.$case === "readMemoryResult" &&
      object.Packet?.readMemoryResult !== undefined &&
      object.Packet?.readMemoryResult !== null
    ) {
      message.Packet = {
        $case: "readMemoryResult",
        readMemoryResult: ReadMemoryResult.fromPartial(object.Packet.readMemoryResult),
      };
    }
    if (
      object.Packet?.$case === "writeMemory" &&
      object.Packet?.writeMemory !== undefined &&
      object.Packet?.writeMemory !== null
    ) {
      message.Packet = { $case: "writeMemory", writeMemory: WriteMemory.fromPartial(object.Packet.writeMemory) };
    }
    if (
      object.Packet?.$case === "writeMemoryResult" &&
      object.Packet?.writeMemoryResult !== undefined &&
      object.Packet?.writeMemoryResult !== null
    ) {
      message.Packet = {
        $case: "writeMemoryResult",
        writeMemoryResult: WriteMemoryResult.fromPartial(object.Packet.writeMemoryResult),
      };
    }
    if (
      object.Packet?.$case === "getClassDetails" &&
      object.Packet?.getClassDetails !== undefined &&
      object.Packet?.getClassDetails !== null
    ) {
      message.Packet = {
        $case: "getClassDetails",
        getClassDetails: GetClassDetails.fromPartial(object.Packet.getClassDetails),
      };
    }
    if (
      object.Packet?.$case === "getClassDetailsResult" &&
      object.Packet?.getClassDetailsResult !== undefined &&
      object.Packet?.getClassDetailsResult !== null
    ) {
      message.Packet = {
        $case: "getClassDetailsResult",
        getClassDetailsResult: GetClassDetailsResult.fromPartial(object.Packet.getClassDetailsResult),
      };
    }
    if (
      object.Packet?.$case === "getInstanceDetails" &&
      object.Packet?.getInstanceDetails !== undefined &&
      object.Packet?.getInstanceDetails !== null
    ) {
      message.Packet = {
        $case: "getInstanceDetails",
        getInstanceDetails: GetInstanceDetails.fromPartial(object.Packet.getInstanceDetails),
      };
    }
    if (
      object.Packet?.$case === "getInstanceDetailsResult" &&
      object.Packet?.getInstanceDetailsResult !== undefined &&
      object.Packet?.getInstanceDetailsResult !== null
    ) {
      message.Packet = {
        $case: "getInstanceDetailsResult",
        getInstanceDetailsResult: GetInstanceDetailsResult.fromPartial(object.Packet.getInstanceDetailsResult),
      };
    }
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = tsProtoGlobalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (tsProtoGlobalThis.Buffer) {
    return tsProtoGlobalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | bigint | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends { $case: string } ? { [K in keyof Omit<T, "$case">]?: DeepPartial<T[K]> } & { $case: T["$case"] }
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function longToBigint(long: Long) {
  return BigInt(long.toString());
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
