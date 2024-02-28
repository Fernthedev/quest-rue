/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

/** Type Identification */
export interface ProtoClassInfo {
  namespaze: string;
  clazz: string;
  generics: ProtoTypeInfo[];
}

export interface ProtoStructInfo {
  clazz: ProtoClassInfo | undefined;
  fieldOffsets: { [key: number]: ProtoFieldInfo };
}

export interface ProtoStructInfo_FieldOffsetsEntry {
  key: number;
  value: ProtoFieldInfo | undefined;
}

export interface ProtoArrayInfo {
  memberType: ProtoTypeInfo | undefined;
}

export interface ProtoGenericInfo {
  genericIndex: number;
  name: string;
}

export interface ProtoTypeInfo {
  Info?:
    | { $case: "primitiveInfo"; primitiveInfo: ProtoTypeInfo_Primitive }
    | { $case: "arrayInfo"; arrayInfo: ProtoArrayInfo }
    | { $case: "structInfo"; structInfo: ProtoStructInfo }
    | { $case: "classInfo"; classInfo: ProtoClassInfo }
    | { $case: "genericInfo"; genericInfo: ProtoGenericInfo }
    | undefined;
  size: number;
  isByref: boolean;
}

/** TODO: maybe add more primitives */
export enum ProtoTypeInfo_Primitive {
  BOOLEAN = 0,
  CHAR = 1,
  BYTE = 2,
  SHORT = 3,
  INT = 4,
  LONG = 5,
  FLOAT = 6,
  DOUBLE = 7,
  STRING = 8,
  TYPE = 9,
  /** PTR - TODO: maybe separate and add pointed to type */
  PTR = 10,
  VOID = 11,
  UNKNOWN = 12,
  UNRECOGNIZED = -1,
}

export function protoTypeInfo_PrimitiveFromJSON(object: any): ProtoTypeInfo_Primitive {
  switch (object) {
    case 0:
    case "BOOLEAN":
      return ProtoTypeInfo_Primitive.BOOLEAN;
    case 1:
    case "CHAR":
      return ProtoTypeInfo_Primitive.CHAR;
    case 2:
    case "BYTE":
      return ProtoTypeInfo_Primitive.BYTE;
    case 3:
    case "SHORT":
      return ProtoTypeInfo_Primitive.SHORT;
    case 4:
    case "INT":
      return ProtoTypeInfo_Primitive.INT;
    case 5:
    case "LONG":
      return ProtoTypeInfo_Primitive.LONG;
    case 6:
    case "FLOAT":
      return ProtoTypeInfo_Primitive.FLOAT;
    case 7:
    case "DOUBLE":
      return ProtoTypeInfo_Primitive.DOUBLE;
    case 8:
    case "STRING":
      return ProtoTypeInfo_Primitive.STRING;
    case 9:
    case "TYPE":
      return ProtoTypeInfo_Primitive.TYPE;
    case 10:
    case "PTR":
      return ProtoTypeInfo_Primitive.PTR;
    case 11:
    case "VOID":
      return ProtoTypeInfo_Primitive.VOID;
    case 12:
    case "UNKNOWN":
      return ProtoTypeInfo_Primitive.UNKNOWN;
    case -1:
    case "UNRECOGNIZED":
    default:
      return ProtoTypeInfo_Primitive.UNRECOGNIZED;
  }
}

export function protoTypeInfo_PrimitiveToJSON(object: ProtoTypeInfo_Primitive): string {
  switch (object) {
    case ProtoTypeInfo_Primitive.BOOLEAN:
      return "BOOLEAN";
    case ProtoTypeInfo_Primitive.CHAR:
      return "CHAR";
    case ProtoTypeInfo_Primitive.BYTE:
      return "BYTE";
    case ProtoTypeInfo_Primitive.SHORT:
      return "SHORT";
    case ProtoTypeInfo_Primitive.INT:
      return "INT";
    case ProtoTypeInfo_Primitive.LONG:
      return "LONG";
    case ProtoTypeInfo_Primitive.FLOAT:
      return "FLOAT";
    case ProtoTypeInfo_Primitive.DOUBLE:
      return "DOUBLE";
    case ProtoTypeInfo_Primitive.STRING:
      return "STRING";
    case ProtoTypeInfo_Primitive.TYPE:
      return "TYPE";
    case ProtoTypeInfo_Primitive.PTR:
      return "PTR";
    case ProtoTypeInfo_Primitive.VOID:
      return "VOID";
    case ProtoTypeInfo_Primitive.UNKNOWN:
      return "UNKNOWN";
    case ProtoTypeInfo_Primitive.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

/**
 * Type Details
 * id = pointer address of info
 */
export interface ProtoFieldInfo {
  name: string;
  id: bigint;
  type:
    | ProtoTypeInfo
    | undefined;
  /** means the field cannot be set */
  literal: boolean;
}

export interface ProtoPropertyInfo {
  name: string;
  /** nullable */
  getterId?:
    | bigint
    | undefined;
  /** nullable */
  setterId?:
    | bigint
    | undefined;
  /** nullable */
  backingFieldId?: bigint | undefined;
  type: ProtoTypeInfo | undefined;
}

export interface ProtoMethodInfo {
  name: string;
  id: bigint;
  args: ProtoMethodInfo_Argument[];
  returnType: ProtoTypeInfo | undefined;
}

export interface ProtoMethodInfo_Argument {
  name: string;
  type: ProtoTypeInfo | undefined;
}

/**
 * / Contains the class data in its entirety
 * NOT APPLICABLE TO PRIMITIVES
 */
export interface ProtoClassDetails {
  clazz: ProtoClassInfo | undefined;
  fields: ProtoFieldInfo[];
  properties: ProtoPropertyInfo[];
  methods: ProtoMethodInfo[];
  staticFields: ProtoFieldInfo[];
  staticProperties: ProtoPropertyInfo[];
  staticMethods: ProtoMethodInfo[];
  /** nullable */
  interfaces: ProtoClassInfo[];
  /** nullable */
  parent?: ProtoClassDetails | undefined;
}

/** separate from payload because the typeInfo never needs to be nested */
export interface ProtoDataSegment {
  Data?:
    | { $case: "primitiveData"; primitiveData: Uint8Array }
    | { $case: "arrayData"; arrayData: ProtoDataSegment_ArrayData }
    | { $case: "structData"; structData: ProtoDataSegment_StructData }
    | { $case: "classData"; classData: bigint }
    | { $case: "genericData"; genericData: Uint8Array }
    | undefined;
}

/** repeated fields aren't allowed directly in oneOf */
export interface ProtoDataSegment_ArrayData {
  data: ProtoDataSegment[];
}

export interface ProtoDataSegment_StructData {
  data: { [key: number]: ProtoDataSegment };
}

export interface ProtoDataSegment_StructData_DataEntry {
  key: number;
  value: ProtoDataSegment | undefined;
}

/** Data Sending */
export interface ProtoDataPayload {
  /** nullable */
  typeInfo?: ProtoTypeInfo | undefined;
  data: ProtoDataSegment | undefined;
}

function createBaseProtoClassInfo(): ProtoClassInfo {
  return { namespaze: "", clazz: "", generics: [] };
}

export const ProtoClassInfo = {
  encode(message: ProtoClassInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.namespaze !== "") {
      writer.uint32(10).string(message.namespaze);
    }
    if (message.clazz !== "") {
      writer.uint32(18).string(message.clazz);
    }
    for (const v of message.generics) {
      ProtoTypeInfo.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoClassInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoClassInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.namespaze = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.clazz = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.generics.push(ProtoTypeInfo.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoClassInfo {
    return {
      namespaze: isSet(object.namespaze) ? globalThis.String(object.namespaze) : "",
      clazz: isSet(object.clazz) ? globalThis.String(object.clazz) : "",
      generics: globalThis.Array.isArray(object?.generics)
        ? object.generics.map((e: any) => ProtoTypeInfo.fromJSON(e))
        : [],
    };
  },

  toJSON(message: ProtoClassInfo): unknown {
    const obj: any = {};
    if (message.namespaze !== "") {
      obj.namespaze = message.namespaze;
    }
    if (message.clazz !== "") {
      obj.clazz = message.clazz;
    }
    if (message.generics?.length) {
      obj.generics = message.generics.map((e) => ProtoTypeInfo.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoClassInfo>, I>>(base?: I): ProtoClassInfo {
    return ProtoClassInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoClassInfo>, I>>(object: I): ProtoClassInfo {
    const message = createBaseProtoClassInfo();
    message.namespaze = object.namespaze ?? "";
    message.clazz = object.clazz ?? "";
    message.generics = object.generics?.map((e) => ProtoTypeInfo.fromPartial(e)) || [];
    return message;
  },
};

function createBaseProtoStructInfo(): ProtoStructInfo {
  return { clazz: undefined, fieldOffsets: {} };
}

export const ProtoStructInfo = {
  encode(message: ProtoStructInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.clazz !== undefined) {
      ProtoClassInfo.encode(message.clazz, writer.uint32(10).fork()).ldelim();
    }
    Object.entries(message.fieldOffsets).forEach(([key, value]) => {
      ProtoStructInfo_FieldOffsetsEntry.encode({ key: key as any, value }, writer.uint32(18).fork()).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoStructInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoStructInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.clazz = ProtoClassInfo.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          const entry2 = ProtoStructInfo_FieldOffsetsEntry.decode(reader, reader.uint32());
          if (entry2.value !== undefined) {
            message.fieldOffsets[entry2.key] = entry2.value;
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

  fromJSON(object: any): ProtoStructInfo {
    return {
      clazz: isSet(object.clazz) ? ProtoClassInfo.fromJSON(object.clazz) : undefined,
      fieldOffsets: isObject(object.fieldOffsets)
        ? Object.entries(object.fieldOffsets).reduce<{ [key: number]: ProtoFieldInfo }>((acc, [key, value]) => {
          acc[globalThis.Number(key)] = ProtoFieldInfo.fromJSON(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: ProtoStructInfo): unknown {
    const obj: any = {};
    if (message.clazz !== undefined) {
      obj.clazz = ProtoClassInfo.toJSON(message.clazz);
    }
    if (message.fieldOffsets) {
      const entries = Object.entries(message.fieldOffsets);
      if (entries.length > 0) {
        obj.fieldOffsets = {};
        entries.forEach(([k, v]) => {
          obj.fieldOffsets[k] = ProtoFieldInfo.toJSON(v);
        });
      }
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoStructInfo>, I>>(base?: I): ProtoStructInfo {
    return ProtoStructInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoStructInfo>, I>>(object: I): ProtoStructInfo {
    const message = createBaseProtoStructInfo();
    message.clazz = (object.clazz !== undefined && object.clazz !== null)
      ? ProtoClassInfo.fromPartial(object.clazz)
      : undefined;
    message.fieldOffsets = Object.entries(object.fieldOffsets ?? {}).reduce<{ [key: number]: ProtoFieldInfo }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[globalThis.Number(key)] = ProtoFieldInfo.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseProtoStructInfo_FieldOffsetsEntry(): ProtoStructInfo_FieldOffsetsEntry {
  return { key: 0, value: undefined };
}

export const ProtoStructInfo_FieldOffsetsEntry = {
  encode(message: ProtoStructInfo_FieldOffsetsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int32(message.key);
    }
    if (message.value !== undefined) {
      ProtoFieldInfo.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoStructInfo_FieldOffsetsEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoStructInfo_FieldOffsetsEntry();
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

          message.value = ProtoFieldInfo.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoStructInfo_FieldOffsetsEntry {
    return {
      key: isSet(object.key) ? globalThis.Number(object.key) : 0,
      value: isSet(object.value) ? ProtoFieldInfo.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: ProtoStructInfo_FieldOffsetsEntry): unknown {
    const obj: any = {};
    if (message.key !== 0) {
      obj.key = Math.round(message.key);
    }
    if (message.value !== undefined) {
      obj.value = ProtoFieldInfo.toJSON(message.value);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoStructInfo_FieldOffsetsEntry>, I>>(
    base?: I,
  ): ProtoStructInfo_FieldOffsetsEntry {
    return ProtoStructInfo_FieldOffsetsEntry.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoStructInfo_FieldOffsetsEntry>, I>>(
    object: I,
  ): ProtoStructInfo_FieldOffsetsEntry {
    const message = createBaseProtoStructInfo_FieldOffsetsEntry();
    message.key = object.key ?? 0;
    message.value = (object.value !== undefined && object.value !== null)
      ? ProtoFieldInfo.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseProtoArrayInfo(): ProtoArrayInfo {
  return { memberType: undefined };
}

export const ProtoArrayInfo = {
  encode(message: ProtoArrayInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.memberType !== undefined) {
      ProtoTypeInfo.encode(message.memberType, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoArrayInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoArrayInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.memberType = ProtoTypeInfo.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoArrayInfo {
    return { memberType: isSet(object.memberType) ? ProtoTypeInfo.fromJSON(object.memberType) : undefined };
  },

  toJSON(message: ProtoArrayInfo): unknown {
    const obj: any = {};
    if (message.memberType !== undefined) {
      obj.memberType = ProtoTypeInfo.toJSON(message.memberType);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoArrayInfo>, I>>(base?: I): ProtoArrayInfo {
    return ProtoArrayInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoArrayInfo>, I>>(object: I): ProtoArrayInfo {
    const message = createBaseProtoArrayInfo();
    message.memberType = (object.memberType !== undefined && object.memberType !== null)
      ? ProtoTypeInfo.fromPartial(object.memberType)
      : undefined;
    return message;
  },
};

function createBaseProtoGenericInfo(): ProtoGenericInfo {
  return { genericIndex: 0, name: "" };
}

export const ProtoGenericInfo = {
  encode(message: ProtoGenericInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.genericIndex !== 0) {
      writer.uint32(8).int32(message.genericIndex);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoGenericInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoGenericInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.genericIndex = reader.int32();
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

  fromJSON(object: any): ProtoGenericInfo {
    return {
      genericIndex: isSet(object.genericIndex) ? globalThis.Number(object.genericIndex) : 0,
      name: isSet(object.name) ? globalThis.String(object.name) : "",
    };
  },

  toJSON(message: ProtoGenericInfo): unknown {
    const obj: any = {};
    if (message.genericIndex !== 0) {
      obj.genericIndex = Math.round(message.genericIndex);
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoGenericInfo>, I>>(base?: I): ProtoGenericInfo {
    return ProtoGenericInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoGenericInfo>, I>>(object: I): ProtoGenericInfo {
    const message = createBaseProtoGenericInfo();
    message.genericIndex = object.genericIndex ?? 0;
    message.name = object.name ?? "";
    return message;
  },
};

function createBaseProtoTypeInfo(): ProtoTypeInfo {
  return { Info: undefined, size: 0, isByref: false };
}

export const ProtoTypeInfo = {
  encode(message: ProtoTypeInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    switch (message.Info?.$case) {
      case "primitiveInfo":
        writer.uint32(8).int32(message.Info.primitiveInfo);
        break;
      case "arrayInfo":
        ProtoArrayInfo.encode(message.Info.arrayInfo, writer.uint32(18).fork()).ldelim();
        break;
      case "structInfo":
        ProtoStructInfo.encode(message.Info.structInfo, writer.uint32(26).fork()).ldelim();
        break;
      case "classInfo":
        ProtoClassInfo.encode(message.Info.classInfo, writer.uint32(34).fork()).ldelim();
        break;
      case "genericInfo":
        ProtoGenericInfo.encode(message.Info.genericInfo, writer.uint32(42).fork()).ldelim();
        break;
    }
    if (message.size !== 0) {
      writer.uint32(48).int32(message.size);
    }
    if (message.isByref === true) {
      writer.uint32(56).bool(message.isByref);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoTypeInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoTypeInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.Info = { $case: "primitiveInfo", primitiveInfo: reader.int32() as any };
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.Info = { $case: "arrayInfo", arrayInfo: ProtoArrayInfo.decode(reader, reader.uint32()) };
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.Info = { $case: "structInfo", structInfo: ProtoStructInfo.decode(reader, reader.uint32()) };
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.Info = { $case: "classInfo", classInfo: ProtoClassInfo.decode(reader, reader.uint32()) };
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.Info = { $case: "genericInfo", genericInfo: ProtoGenericInfo.decode(reader, reader.uint32()) };
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.size = reader.int32();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.isByref = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoTypeInfo {
    return {
      Info: isSet(object.primitiveInfo)
        ? { $case: "primitiveInfo", primitiveInfo: protoTypeInfo_PrimitiveFromJSON(object.primitiveInfo) }
        : isSet(object.arrayInfo)
        ? { $case: "arrayInfo", arrayInfo: ProtoArrayInfo.fromJSON(object.arrayInfo) }
        : isSet(object.structInfo)
        ? { $case: "structInfo", structInfo: ProtoStructInfo.fromJSON(object.structInfo) }
        : isSet(object.classInfo)
        ? { $case: "classInfo", classInfo: ProtoClassInfo.fromJSON(object.classInfo) }
        : isSet(object.genericInfo)
        ? { $case: "genericInfo", genericInfo: ProtoGenericInfo.fromJSON(object.genericInfo) }
        : undefined,
      size: isSet(object.size) ? globalThis.Number(object.size) : 0,
      isByref: isSet(object.isByref) ? globalThis.Boolean(object.isByref) : false,
    };
  },

  toJSON(message: ProtoTypeInfo): unknown {
    const obj: any = {};
    if (message.Info?.$case === "primitiveInfo") {
      obj.primitiveInfo = protoTypeInfo_PrimitiveToJSON(message.Info.primitiveInfo);
    }
    if (message.Info?.$case === "arrayInfo") {
      obj.arrayInfo = ProtoArrayInfo.toJSON(message.Info.arrayInfo);
    }
    if (message.Info?.$case === "structInfo") {
      obj.structInfo = ProtoStructInfo.toJSON(message.Info.structInfo);
    }
    if (message.Info?.$case === "classInfo") {
      obj.classInfo = ProtoClassInfo.toJSON(message.Info.classInfo);
    }
    if (message.Info?.$case === "genericInfo") {
      obj.genericInfo = ProtoGenericInfo.toJSON(message.Info.genericInfo);
    }
    if (message.size !== 0) {
      obj.size = Math.round(message.size);
    }
    if (message.isByref === true) {
      obj.isByref = message.isByref;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoTypeInfo>, I>>(base?: I): ProtoTypeInfo {
    return ProtoTypeInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoTypeInfo>, I>>(object: I): ProtoTypeInfo {
    const message = createBaseProtoTypeInfo();
    if (
      object.Info?.$case === "primitiveInfo" &&
      object.Info?.primitiveInfo !== undefined &&
      object.Info?.primitiveInfo !== null
    ) {
      message.Info = { $case: "primitiveInfo", primitiveInfo: object.Info.primitiveInfo };
    }
    if (object.Info?.$case === "arrayInfo" && object.Info?.arrayInfo !== undefined && object.Info?.arrayInfo !== null) {
      message.Info = { $case: "arrayInfo", arrayInfo: ProtoArrayInfo.fromPartial(object.Info.arrayInfo) };
    }
    if (
      object.Info?.$case === "structInfo" && object.Info?.structInfo !== undefined && object.Info?.structInfo !== null
    ) {
      message.Info = { $case: "structInfo", structInfo: ProtoStructInfo.fromPartial(object.Info.structInfo) };
    }
    if (object.Info?.$case === "classInfo" && object.Info?.classInfo !== undefined && object.Info?.classInfo !== null) {
      message.Info = { $case: "classInfo", classInfo: ProtoClassInfo.fromPartial(object.Info.classInfo) };
    }
    if (
      object.Info?.$case === "genericInfo" &&
      object.Info?.genericInfo !== undefined &&
      object.Info?.genericInfo !== null
    ) {
      message.Info = { $case: "genericInfo", genericInfo: ProtoGenericInfo.fromPartial(object.Info.genericInfo) };
    }
    message.size = object.size ?? 0;
    message.isByref = object.isByref ?? false;
    return message;
  },
};

function createBaseProtoFieldInfo(): ProtoFieldInfo {
  return { name: "", id: BigInt("0"), type: undefined, literal: false };
}

export const ProtoFieldInfo = {
  encode(message: ProtoFieldInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.id !== BigInt("0")) {
      if (BigInt.asUintN(64, message.id) !== message.id) {
        throw new globalThis.Error("value provided for field message.id of type uint64 too large");
      }
      writer.uint32(16).uint64(message.id.toString());
    }
    if (message.type !== undefined) {
      ProtoTypeInfo.encode(message.type, writer.uint32(26).fork()).ldelim();
    }
    if (message.literal === true) {
      writer.uint32(32).bool(message.literal);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoFieldInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoFieldInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.id = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.type = ProtoTypeInfo.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.literal = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoFieldInfo {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      id: isSet(object.id) ? BigInt(object.id) : BigInt("0"),
      type: isSet(object.type) ? ProtoTypeInfo.fromJSON(object.type) : undefined,
      literal: isSet(object.literal) ? globalThis.Boolean(object.literal) : false,
    };
  },

  toJSON(message: ProtoFieldInfo): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.id !== BigInt("0")) {
      obj.id = message.id.toString();
    }
    if (message.type !== undefined) {
      obj.type = ProtoTypeInfo.toJSON(message.type);
    }
    if (message.literal === true) {
      obj.literal = message.literal;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoFieldInfo>, I>>(base?: I): ProtoFieldInfo {
    return ProtoFieldInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoFieldInfo>, I>>(object: I): ProtoFieldInfo {
    const message = createBaseProtoFieldInfo();
    message.name = object.name ?? "";
    message.id = object.id ?? BigInt("0");
    message.type = (object.type !== undefined && object.type !== null)
      ? ProtoTypeInfo.fromPartial(object.type)
      : undefined;
    message.literal = object.literal ?? false;
    return message;
  },
};

function createBaseProtoPropertyInfo(): ProtoPropertyInfo {
  return { name: "", getterId: undefined, setterId: undefined, backingFieldId: undefined, type: undefined };
}

export const ProtoPropertyInfo = {
  encode(message: ProtoPropertyInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.getterId !== undefined) {
      if (BigInt.asUintN(64, message.getterId) !== message.getterId) {
        throw new globalThis.Error("value provided for field message.getterId of type uint64 too large");
      }
      writer.uint32(16).uint64(message.getterId.toString());
    }
    if (message.setterId !== undefined) {
      if (BigInt.asUintN(64, message.setterId) !== message.setterId) {
        throw new globalThis.Error("value provided for field message.setterId of type uint64 too large");
      }
      writer.uint32(24).uint64(message.setterId.toString());
    }
    if (message.backingFieldId !== undefined) {
      if (BigInt.asUintN(64, message.backingFieldId) !== message.backingFieldId) {
        throw new globalThis.Error("value provided for field message.backingFieldId of type uint64 too large");
      }
      writer.uint32(32).uint64(message.backingFieldId.toString());
    }
    if (message.type !== undefined) {
      ProtoTypeInfo.encode(message.type, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoPropertyInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoPropertyInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.getterId = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.setterId = longToBigint(reader.uint64() as Long);
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.backingFieldId = longToBigint(reader.uint64() as Long);
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.type = ProtoTypeInfo.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoPropertyInfo {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      getterId: isSet(object.getterId) ? BigInt(object.getterId) : undefined,
      setterId: isSet(object.setterId) ? BigInt(object.setterId) : undefined,
      backingFieldId: isSet(object.backingFieldId) ? BigInt(object.backingFieldId) : undefined,
      type: isSet(object.type) ? ProtoTypeInfo.fromJSON(object.type) : undefined,
    };
  },

  toJSON(message: ProtoPropertyInfo): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.getterId !== undefined) {
      obj.getterId = message.getterId.toString();
    }
    if (message.setterId !== undefined) {
      obj.setterId = message.setterId.toString();
    }
    if (message.backingFieldId !== undefined) {
      obj.backingFieldId = message.backingFieldId.toString();
    }
    if (message.type !== undefined) {
      obj.type = ProtoTypeInfo.toJSON(message.type);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoPropertyInfo>, I>>(base?: I): ProtoPropertyInfo {
    return ProtoPropertyInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoPropertyInfo>, I>>(object: I): ProtoPropertyInfo {
    const message = createBaseProtoPropertyInfo();
    message.name = object.name ?? "";
    message.getterId = object.getterId ?? undefined;
    message.setterId = object.setterId ?? undefined;
    message.backingFieldId = object.backingFieldId ?? undefined;
    message.type = (object.type !== undefined && object.type !== null)
      ? ProtoTypeInfo.fromPartial(object.type)
      : undefined;
    return message;
  },
};

function createBaseProtoMethodInfo(): ProtoMethodInfo {
  return { name: "", id: BigInt("0"), args: [], returnType: undefined };
}

export const ProtoMethodInfo = {
  encode(message: ProtoMethodInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.id !== BigInt("0")) {
      if (BigInt.asUintN(64, message.id) !== message.id) {
        throw new globalThis.Error("value provided for field message.id of type uint64 too large");
      }
      writer.uint32(16).uint64(message.id.toString());
    }
    for (const v of message.args) {
      ProtoMethodInfo_Argument.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.returnType !== undefined) {
      ProtoTypeInfo.encode(message.returnType, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoMethodInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoMethodInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.id = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.args.push(ProtoMethodInfo_Argument.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.returnType = ProtoTypeInfo.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoMethodInfo {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      id: isSet(object.id) ? BigInt(object.id) : BigInt("0"),
      args: globalThis.Array.isArray(object?.args)
        ? object.args.map((e: any) => ProtoMethodInfo_Argument.fromJSON(e))
        : [],
      returnType: isSet(object.returnType) ? ProtoTypeInfo.fromJSON(object.returnType) : undefined,
    };
  },

  toJSON(message: ProtoMethodInfo): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.id !== BigInt("0")) {
      obj.id = message.id.toString();
    }
    if (message.args?.length) {
      obj.args = message.args.map((e) => ProtoMethodInfo_Argument.toJSON(e));
    }
    if (message.returnType !== undefined) {
      obj.returnType = ProtoTypeInfo.toJSON(message.returnType);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoMethodInfo>, I>>(base?: I): ProtoMethodInfo {
    return ProtoMethodInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoMethodInfo>, I>>(object: I): ProtoMethodInfo {
    const message = createBaseProtoMethodInfo();
    message.name = object.name ?? "";
    message.id = object.id ?? BigInt("0");
    message.args = object.args?.map((e) => ProtoMethodInfo_Argument.fromPartial(e)) || [];
    message.returnType = (object.returnType !== undefined && object.returnType !== null)
      ? ProtoTypeInfo.fromPartial(object.returnType)
      : undefined;
    return message;
  },
};

function createBaseProtoMethodInfo_Argument(): ProtoMethodInfo_Argument {
  return { name: "", type: undefined };
}

export const ProtoMethodInfo_Argument = {
  encode(message: ProtoMethodInfo_Argument, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.type !== undefined) {
      ProtoTypeInfo.encode(message.type, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoMethodInfo_Argument {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoMethodInfo_Argument();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.type = ProtoTypeInfo.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoMethodInfo_Argument {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      type: isSet(object.type) ? ProtoTypeInfo.fromJSON(object.type) : undefined,
    };
  },

  toJSON(message: ProtoMethodInfo_Argument): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.type !== undefined) {
      obj.type = ProtoTypeInfo.toJSON(message.type);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoMethodInfo_Argument>, I>>(base?: I): ProtoMethodInfo_Argument {
    return ProtoMethodInfo_Argument.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoMethodInfo_Argument>, I>>(object: I): ProtoMethodInfo_Argument {
    const message = createBaseProtoMethodInfo_Argument();
    message.name = object.name ?? "";
    message.type = (object.type !== undefined && object.type !== null)
      ? ProtoTypeInfo.fromPartial(object.type)
      : undefined;
    return message;
  },
};

function createBaseProtoClassDetails(): ProtoClassDetails {
  return {
    clazz: undefined,
    fields: [],
    properties: [],
    methods: [],
    staticFields: [],
    staticProperties: [],
    staticMethods: [],
    interfaces: [],
    parent: undefined,
  };
}

export const ProtoClassDetails = {
  encode(message: ProtoClassDetails, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.clazz !== undefined) {
      ProtoClassInfo.encode(message.clazz, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.fields) {
      ProtoFieldInfo.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.properties) {
      ProtoPropertyInfo.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.methods) {
      ProtoMethodInfo.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.staticFields) {
      ProtoFieldInfo.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    for (const v of message.staticProperties) {
      ProtoPropertyInfo.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    for (const v of message.staticMethods) {
      ProtoMethodInfo.encode(v!, writer.uint32(58).fork()).ldelim();
    }
    for (const v of message.interfaces) {
      ProtoClassInfo.encode(v!, writer.uint32(66).fork()).ldelim();
    }
    if (message.parent !== undefined) {
      ProtoClassDetails.encode(message.parent, writer.uint32(74).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoClassDetails {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoClassDetails();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.clazz = ProtoClassInfo.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.fields.push(ProtoFieldInfo.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.properties.push(ProtoPropertyInfo.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.methods.push(ProtoMethodInfo.decode(reader, reader.uint32()));
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.staticFields.push(ProtoFieldInfo.decode(reader, reader.uint32()));
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.staticProperties.push(ProtoPropertyInfo.decode(reader, reader.uint32()));
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.staticMethods.push(ProtoMethodInfo.decode(reader, reader.uint32()));
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.interfaces.push(ProtoClassInfo.decode(reader, reader.uint32()));
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.parent = ProtoClassDetails.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoClassDetails {
    return {
      clazz: isSet(object.clazz) ? ProtoClassInfo.fromJSON(object.clazz) : undefined,
      fields: globalThis.Array.isArray(object?.fields) ? object.fields.map((e: any) => ProtoFieldInfo.fromJSON(e)) : [],
      properties: globalThis.Array.isArray(object?.properties)
        ? object.properties.map((e: any) => ProtoPropertyInfo.fromJSON(e))
        : [],
      methods: globalThis.Array.isArray(object?.methods)
        ? object.methods.map((e: any) => ProtoMethodInfo.fromJSON(e))
        : [],
      staticFields: globalThis.Array.isArray(object?.staticFields)
        ? object.staticFields.map((e: any) => ProtoFieldInfo.fromJSON(e))
        : [],
      staticProperties: globalThis.Array.isArray(object?.staticProperties)
        ? object.staticProperties.map((e: any) => ProtoPropertyInfo.fromJSON(e))
        : [],
      staticMethods: globalThis.Array.isArray(object?.staticMethods)
        ? object.staticMethods.map((e: any) => ProtoMethodInfo.fromJSON(e))
        : [],
      interfaces: globalThis.Array.isArray(object?.interfaces)
        ? object.interfaces.map((e: any) => ProtoClassInfo.fromJSON(e))
        : [],
      parent: isSet(object.parent) ? ProtoClassDetails.fromJSON(object.parent) : undefined,
    };
  },

  toJSON(message: ProtoClassDetails): unknown {
    const obj: any = {};
    if (message.clazz !== undefined) {
      obj.clazz = ProtoClassInfo.toJSON(message.clazz);
    }
    if (message.fields?.length) {
      obj.fields = message.fields.map((e) => ProtoFieldInfo.toJSON(e));
    }
    if (message.properties?.length) {
      obj.properties = message.properties.map((e) => ProtoPropertyInfo.toJSON(e));
    }
    if (message.methods?.length) {
      obj.methods = message.methods.map((e) => ProtoMethodInfo.toJSON(e));
    }
    if (message.staticFields?.length) {
      obj.staticFields = message.staticFields.map((e) => ProtoFieldInfo.toJSON(e));
    }
    if (message.staticProperties?.length) {
      obj.staticProperties = message.staticProperties.map((e) => ProtoPropertyInfo.toJSON(e));
    }
    if (message.staticMethods?.length) {
      obj.staticMethods = message.staticMethods.map((e) => ProtoMethodInfo.toJSON(e));
    }
    if (message.interfaces?.length) {
      obj.interfaces = message.interfaces.map((e) => ProtoClassInfo.toJSON(e));
    }
    if (message.parent !== undefined) {
      obj.parent = ProtoClassDetails.toJSON(message.parent);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoClassDetails>, I>>(base?: I): ProtoClassDetails {
    return ProtoClassDetails.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoClassDetails>, I>>(object: I): ProtoClassDetails {
    const message = createBaseProtoClassDetails();
    message.clazz = (object.clazz !== undefined && object.clazz !== null)
      ? ProtoClassInfo.fromPartial(object.clazz)
      : undefined;
    message.fields = object.fields?.map((e) => ProtoFieldInfo.fromPartial(e)) || [];
    message.properties = object.properties?.map((e) => ProtoPropertyInfo.fromPartial(e)) || [];
    message.methods = object.methods?.map((e) => ProtoMethodInfo.fromPartial(e)) || [];
    message.staticFields = object.staticFields?.map((e) => ProtoFieldInfo.fromPartial(e)) || [];
    message.staticProperties = object.staticProperties?.map((e) => ProtoPropertyInfo.fromPartial(e)) || [];
    message.staticMethods = object.staticMethods?.map((e) => ProtoMethodInfo.fromPartial(e)) || [];
    message.interfaces = object.interfaces?.map((e) => ProtoClassInfo.fromPartial(e)) || [];
    message.parent = (object.parent !== undefined && object.parent !== null)
      ? ProtoClassDetails.fromPartial(object.parent)
      : undefined;
    return message;
  },
};

function createBaseProtoDataSegment(): ProtoDataSegment {
  return { Data: undefined };
}

export const ProtoDataSegment = {
  encode(message: ProtoDataSegment, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    switch (message.Data?.$case) {
      case "primitiveData":
        writer.uint32(10).bytes(message.Data.primitiveData);
        break;
      case "arrayData":
        ProtoDataSegment_ArrayData.encode(message.Data.arrayData, writer.uint32(18).fork()).ldelim();
        break;
      case "structData":
        ProtoDataSegment_StructData.encode(message.Data.structData, writer.uint32(26).fork()).ldelim();
        break;
      case "classData":
        if (BigInt.asUintN(64, message.Data.classData) !== message.Data.classData) {
          throw new globalThis.Error("value provided for field message.Data.classData of type uint64 too large");
        }
        writer.uint32(32).uint64(message.Data.classData.toString());
        break;
      case "genericData":
        writer.uint32(42).bytes(message.Data.genericData);
        break;
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoDataSegment {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoDataSegment();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.Data = { $case: "primitiveData", primitiveData: reader.bytes() };
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.Data = { $case: "arrayData", arrayData: ProtoDataSegment_ArrayData.decode(reader, reader.uint32()) };
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.Data = {
            $case: "structData",
            structData: ProtoDataSegment_StructData.decode(reader, reader.uint32()),
          };
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.Data = { $case: "classData", classData: longToBigint(reader.uint64() as Long) };
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.Data = { $case: "genericData", genericData: reader.bytes() };
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoDataSegment {
    return {
      Data: isSet(object.primitiveData)
        ? { $case: "primitiveData", primitiveData: bytesFromBase64(object.primitiveData) }
        : isSet(object.arrayData)
        ? { $case: "arrayData", arrayData: ProtoDataSegment_ArrayData.fromJSON(object.arrayData) }
        : isSet(object.structData)
        ? { $case: "structData", structData: ProtoDataSegment_StructData.fromJSON(object.structData) }
        : isSet(object.classData)
        ? { $case: "classData", classData: BigInt(object.classData) }
        : isSet(object.genericData)
        ? { $case: "genericData", genericData: bytesFromBase64(object.genericData) }
        : undefined,
    };
  },

  toJSON(message: ProtoDataSegment): unknown {
    const obj: any = {};
    if (message.Data?.$case === "primitiveData") {
      obj.primitiveData = base64FromBytes(message.Data.primitiveData);
    }
    if (message.Data?.$case === "arrayData") {
      obj.arrayData = ProtoDataSegment_ArrayData.toJSON(message.Data.arrayData);
    }
    if (message.Data?.$case === "structData") {
      obj.structData = ProtoDataSegment_StructData.toJSON(message.Data.structData);
    }
    if (message.Data?.$case === "classData") {
      obj.classData = message.Data.classData.toString();
    }
    if (message.Data?.$case === "genericData") {
      obj.genericData = base64FromBytes(message.Data.genericData);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoDataSegment>, I>>(base?: I): ProtoDataSegment {
    return ProtoDataSegment.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoDataSegment>, I>>(object: I): ProtoDataSegment {
    const message = createBaseProtoDataSegment();
    if (
      object.Data?.$case === "primitiveData" &&
      object.Data?.primitiveData !== undefined &&
      object.Data?.primitiveData !== null
    ) {
      message.Data = { $case: "primitiveData", primitiveData: object.Data.primitiveData };
    }
    if (object.Data?.$case === "arrayData" && object.Data?.arrayData !== undefined && object.Data?.arrayData !== null) {
      message.Data = { $case: "arrayData", arrayData: ProtoDataSegment_ArrayData.fromPartial(object.Data.arrayData) };
    }
    if (
      object.Data?.$case === "structData" && object.Data?.structData !== undefined && object.Data?.structData !== null
    ) {
      message.Data = {
        $case: "structData",
        structData: ProtoDataSegment_StructData.fromPartial(object.Data.structData),
      };
    }
    if (object.Data?.$case === "classData" && object.Data?.classData !== undefined && object.Data?.classData !== null) {
      message.Data = { $case: "classData", classData: object.Data.classData };
    }
    if (
      object.Data?.$case === "genericData" &&
      object.Data?.genericData !== undefined &&
      object.Data?.genericData !== null
    ) {
      message.Data = { $case: "genericData", genericData: object.Data.genericData };
    }
    return message;
  },
};

function createBaseProtoDataSegment_ArrayData(): ProtoDataSegment_ArrayData {
  return { data: [] };
}

export const ProtoDataSegment_ArrayData = {
  encode(message: ProtoDataSegment_ArrayData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.data) {
      ProtoDataSegment.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoDataSegment_ArrayData {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoDataSegment_ArrayData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.data.push(ProtoDataSegment.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoDataSegment_ArrayData {
    return {
      data: globalThis.Array.isArray(object?.data) ? object.data.map((e: any) => ProtoDataSegment.fromJSON(e)) : [],
    };
  },

  toJSON(message: ProtoDataSegment_ArrayData): unknown {
    const obj: any = {};
    if (message.data?.length) {
      obj.data = message.data.map((e) => ProtoDataSegment.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoDataSegment_ArrayData>, I>>(base?: I): ProtoDataSegment_ArrayData {
    return ProtoDataSegment_ArrayData.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoDataSegment_ArrayData>, I>>(object: I): ProtoDataSegment_ArrayData {
    const message = createBaseProtoDataSegment_ArrayData();
    message.data = object.data?.map((e) => ProtoDataSegment.fromPartial(e)) || [];
    return message;
  },
};

function createBaseProtoDataSegment_StructData(): ProtoDataSegment_StructData {
  return { data: {} };
}

export const ProtoDataSegment_StructData = {
  encode(message: ProtoDataSegment_StructData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.data).forEach(([key, value]) => {
      ProtoDataSegment_StructData_DataEntry.encode({ key: key as any, value }, writer.uint32(10).fork()).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoDataSegment_StructData {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoDataSegment_StructData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          const entry1 = ProtoDataSegment_StructData_DataEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.data[entry1.key] = entry1.value;
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

  fromJSON(object: any): ProtoDataSegment_StructData {
    return {
      data: isObject(object.data)
        ? Object.entries(object.data).reduce<{ [key: number]: ProtoDataSegment }>((acc, [key, value]) => {
          acc[globalThis.Number(key)] = ProtoDataSegment.fromJSON(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: ProtoDataSegment_StructData): unknown {
    const obj: any = {};
    if (message.data) {
      const entries = Object.entries(message.data);
      if (entries.length > 0) {
        obj.data = {};
        entries.forEach(([k, v]) => {
          obj.data[k] = ProtoDataSegment.toJSON(v);
        });
      }
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoDataSegment_StructData>, I>>(base?: I): ProtoDataSegment_StructData {
    return ProtoDataSegment_StructData.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoDataSegment_StructData>, I>>(object: I): ProtoDataSegment_StructData {
    const message = createBaseProtoDataSegment_StructData();
    message.data = Object.entries(object.data ?? {}).reduce<{ [key: number]: ProtoDataSegment }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[globalThis.Number(key)] = ProtoDataSegment.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseProtoDataSegment_StructData_DataEntry(): ProtoDataSegment_StructData_DataEntry {
  return { key: 0, value: undefined };
}

export const ProtoDataSegment_StructData_DataEntry = {
  encode(message: ProtoDataSegment_StructData_DataEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).int32(message.key);
    }
    if (message.value !== undefined) {
      ProtoDataSegment.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoDataSegment_StructData_DataEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoDataSegment_StructData_DataEntry();
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

          message.value = ProtoDataSegment.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoDataSegment_StructData_DataEntry {
    return {
      key: isSet(object.key) ? globalThis.Number(object.key) : 0,
      value: isSet(object.value) ? ProtoDataSegment.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: ProtoDataSegment_StructData_DataEntry): unknown {
    const obj: any = {};
    if (message.key !== 0) {
      obj.key = Math.round(message.key);
    }
    if (message.value !== undefined) {
      obj.value = ProtoDataSegment.toJSON(message.value);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoDataSegment_StructData_DataEntry>, I>>(
    base?: I,
  ): ProtoDataSegment_StructData_DataEntry {
    return ProtoDataSegment_StructData_DataEntry.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoDataSegment_StructData_DataEntry>, I>>(
    object: I,
  ): ProtoDataSegment_StructData_DataEntry {
    const message = createBaseProtoDataSegment_StructData_DataEntry();
    message.key = object.key ?? 0;
    message.value = (object.value !== undefined && object.value !== null)
      ? ProtoDataSegment.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseProtoDataPayload(): ProtoDataPayload {
  return { typeInfo: undefined, data: undefined };
}

export const ProtoDataPayload = {
  encode(message: ProtoDataPayload, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.typeInfo !== undefined) {
      ProtoTypeInfo.encode(message.typeInfo, writer.uint32(10).fork()).ldelim();
    }
    if (message.data !== undefined) {
      ProtoDataSegment.encode(message.data, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoDataPayload {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoDataPayload();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.typeInfo = ProtoTypeInfo.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.data = ProtoDataSegment.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoDataPayload {
    return {
      typeInfo: isSet(object.typeInfo) ? ProtoTypeInfo.fromJSON(object.typeInfo) : undefined,
      data: isSet(object.data) ? ProtoDataSegment.fromJSON(object.data) : undefined,
    };
  },

  toJSON(message: ProtoDataPayload): unknown {
    const obj: any = {};
    if (message.typeInfo !== undefined) {
      obj.typeInfo = ProtoTypeInfo.toJSON(message.typeInfo);
    }
    if (message.data !== undefined) {
      obj.data = ProtoDataSegment.toJSON(message.data);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoDataPayload>, I>>(base?: I): ProtoDataPayload {
    return ProtoDataPayload.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoDataPayload>, I>>(object: I): ProtoDataPayload {
    const message = createBaseProtoDataPayload();
    message.typeInfo = (object.typeInfo !== undefined && object.typeInfo !== null)
      ? ProtoTypeInfo.fromPartial(object.typeInfo)
      : undefined;
    message.data = (object.data !== undefined && object.data !== null)
      ? ProtoDataSegment.fromPartial(object.data)
      : undefined;
    return message;
  },
};

function bytesFromBase64(b64: string): Uint8Array {
  if ((globalThis as any).Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if ((globalThis as any).Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | bigint | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
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
