/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { ProtoClassInfo } from "./il2cpp";

export const protobufPackage = "";

export interface ProtoVector2 {
  x: number;
  y: number;
}

export interface ProtoVector3 {
  x: number;
  y: number;
  z: number;
}

export interface ProtoVector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** Unity Stuff */
export interface ProtoObject {
  address: bigint;
  name: string;
  classInfo: ProtoClassInfo | undefined;
}

export interface ProtoComponent {
  address: bigint;
  name: string;
  gameObject: bigint;
  /** TODO: TRANSFORM */
  classInfo: ProtoClassInfo | undefined;
}

export interface ProtoTransform {
  address: bigint;
  name: string;
  childCount: number;
  parent: bigint;
}

export interface ProtoGameObject {
  address: bigint;
  name: string;
  active: boolean;
  layer: number;
  scene:
    | ProtoScene
    | undefined;
  /** optional */
  tag?: string | undefined;
  transform: ProtoTransform | undefined;
}

export interface ProtoScene {
  handle: number;
  name: string;
  isLoaded: boolean;
}

function createBaseProtoVector2(): ProtoVector2 {
  return { x: 0, y: 0 };
}

export const ProtoVector2 = {
  encode(message: ProtoVector2, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.x !== 0) {
      writer.uint32(13).float(message.x);
    }
    if (message.y !== 0) {
      writer.uint32(21).float(message.y);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoVector2 {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoVector2();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 13) {
            break;
          }

          message.x = reader.float();
          continue;
        case 2:
          if (tag !== 21) {
            break;
          }

          message.y = reader.float();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoVector2 {
    return {
      x: isSet(object.x) ? globalThis.Number(object.x) : 0,
      y: isSet(object.y) ? globalThis.Number(object.y) : 0,
    };
  },

  toJSON(message: ProtoVector2): unknown {
    const obj: any = {};
    if (message.x !== 0) {
      obj.x = message.x;
    }
    if (message.y !== 0) {
      obj.y = message.y;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoVector2>, I>>(base?: I): ProtoVector2 {
    return ProtoVector2.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoVector2>, I>>(object: I): ProtoVector2 {
    const message = createBaseProtoVector2();
    message.x = object.x ?? 0;
    message.y = object.y ?? 0;
    return message;
  },
};

function createBaseProtoVector3(): ProtoVector3 {
  return { x: 0, y: 0, z: 0 };
}

export const ProtoVector3 = {
  encode(message: ProtoVector3, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.x !== 0) {
      writer.uint32(13).float(message.x);
    }
    if (message.y !== 0) {
      writer.uint32(21).float(message.y);
    }
    if (message.z !== 0) {
      writer.uint32(29).float(message.z);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoVector3 {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoVector3();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 13) {
            break;
          }

          message.x = reader.float();
          continue;
        case 2:
          if (tag !== 21) {
            break;
          }

          message.y = reader.float();
          continue;
        case 3:
          if (tag !== 29) {
            break;
          }

          message.z = reader.float();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoVector3 {
    return {
      x: isSet(object.x) ? globalThis.Number(object.x) : 0,
      y: isSet(object.y) ? globalThis.Number(object.y) : 0,
      z: isSet(object.z) ? globalThis.Number(object.z) : 0,
    };
  },

  toJSON(message: ProtoVector3): unknown {
    const obj: any = {};
    if (message.x !== 0) {
      obj.x = message.x;
    }
    if (message.y !== 0) {
      obj.y = message.y;
    }
    if (message.z !== 0) {
      obj.z = message.z;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoVector3>, I>>(base?: I): ProtoVector3 {
    return ProtoVector3.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoVector3>, I>>(object: I): ProtoVector3 {
    const message = createBaseProtoVector3();
    message.x = object.x ?? 0;
    message.y = object.y ?? 0;
    message.z = object.z ?? 0;
    return message;
  },
};

function createBaseProtoVector4(): ProtoVector4 {
  return { x: 0, y: 0, z: 0, w: 0 };
}

export const ProtoVector4 = {
  encode(message: ProtoVector4, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.x !== 0) {
      writer.uint32(13).float(message.x);
    }
    if (message.y !== 0) {
      writer.uint32(21).float(message.y);
    }
    if (message.z !== 0) {
      writer.uint32(29).float(message.z);
    }
    if (message.w !== 0) {
      writer.uint32(37).float(message.w);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoVector4 {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoVector4();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 13) {
            break;
          }

          message.x = reader.float();
          continue;
        case 2:
          if (tag !== 21) {
            break;
          }

          message.y = reader.float();
          continue;
        case 3:
          if (tag !== 29) {
            break;
          }

          message.z = reader.float();
          continue;
        case 4:
          if (tag !== 37) {
            break;
          }

          message.w = reader.float();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoVector4 {
    return {
      x: isSet(object.x) ? globalThis.Number(object.x) : 0,
      y: isSet(object.y) ? globalThis.Number(object.y) : 0,
      z: isSet(object.z) ? globalThis.Number(object.z) : 0,
      w: isSet(object.w) ? globalThis.Number(object.w) : 0,
    };
  },

  toJSON(message: ProtoVector4): unknown {
    const obj: any = {};
    if (message.x !== 0) {
      obj.x = message.x;
    }
    if (message.y !== 0) {
      obj.y = message.y;
    }
    if (message.z !== 0) {
      obj.z = message.z;
    }
    if (message.w !== 0) {
      obj.w = message.w;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoVector4>, I>>(base?: I): ProtoVector4 {
    return ProtoVector4.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoVector4>, I>>(object: I): ProtoVector4 {
    const message = createBaseProtoVector4();
    message.x = object.x ?? 0;
    message.y = object.y ?? 0;
    message.z = object.z ?? 0;
    message.w = object.w ?? 0;
    return message;
  },
};

function createBaseProtoObject(): ProtoObject {
  return { address: BigInt("0"), name: "", classInfo: undefined };
}

export const ProtoObject = {
  encode(message: ProtoObject, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== BigInt("0")) {
      if (BigInt.asUintN(64, message.address) !== message.address) {
        throw new globalThis.Error("value provided for field message.address of type uint64 too large");
      }
      writer.uint32(8).uint64(message.address.toString());
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.classInfo !== undefined) {
      ProtoClassInfo.encode(message.classInfo, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoObject {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoObject();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
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

  fromJSON(object: any): ProtoObject {
    return {
      address: isSet(object.address) ? BigInt(object.address) : BigInt("0"),
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      classInfo: isSet(object.classInfo) ? ProtoClassInfo.fromJSON(object.classInfo) : undefined,
    };
  },

  toJSON(message: ProtoObject): unknown {
    const obj: any = {};
    if (message.address !== BigInt("0")) {
      obj.address = message.address.toString();
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.classInfo !== undefined) {
      obj.classInfo = ProtoClassInfo.toJSON(message.classInfo);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoObject>, I>>(base?: I): ProtoObject {
    return ProtoObject.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoObject>, I>>(object: I): ProtoObject {
    const message = createBaseProtoObject();
    message.address = object.address ?? BigInt("0");
    message.name = object.name ?? "";
    message.classInfo = (object.classInfo !== undefined && object.classInfo !== null)
      ? ProtoClassInfo.fromPartial(object.classInfo)
      : undefined;
    return message;
  },
};

function createBaseProtoComponent(): ProtoComponent {
  return { address: BigInt("0"), name: "", gameObject: BigInt("0"), classInfo: undefined };
}

export const ProtoComponent = {
  encode(message: ProtoComponent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== BigInt("0")) {
      if (BigInt.asUintN(64, message.address) !== message.address) {
        throw new globalThis.Error("value provided for field message.address of type uint64 too large");
      }
      writer.uint32(8).uint64(message.address.toString());
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.gameObject !== BigInt("0")) {
      if (BigInt.asUintN(64, message.gameObject) !== message.gameObject) {
        throw new globalThis.Error("value provided for field message.gameObject of type uint64 too large");
      }
      writer.uint32(24).uint64(message.gameObject.toString());
    }
    if (message.classInfo !== undefined) {
      ProtoClassInfo.encode(message.classInfo, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoComponent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoComponent();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.gameObject = longToBigint(reader.uint64() as Long);
          continue;
        case 4:
          if (tag !== 34) {
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

  fromJSON(object: any): ProtoComponent {
    return {
      address: isSet(object.address) ? BigInt(object.address) : BigInt("0"),
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      gameObject: isSet(object.gameObject) ? BigInt(object.gameObject) : BigInt("0"),
      classInfo: isSet(object.classInfo) ? ProtoClassInfo.fromJSON(object.classInfo) : undefined,
    };
  },

  toJSON(message: ProtoComponent): unknown {
    const obj: any = {};
    if (message.address !== BigInt("0")) {
      obj.address = message.address.toString();
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.gameObject !== BigInt("0")) {
      obj.gameObject = message.gameObject.toString();
    }
    if (message.classInfo !== undefined) {
      obj.classInfo = ProtoClassInfo.toJSON(message.classInfo);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoComponent>, I>>(base?: I): ProtoComponent {
    return ProtoComponent.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoComponent>, I>>(object: I): ProtoComponent {
    const message = createBaseProtoComponent();
    message.address = object.address ?? BigInt("0");
    message.name = object.name ?? "";
    message.gameObject = object.gameObject ?? BigInt("0");
    message.classInfo = (object.classInfo !== undefined && object.classInfo !== null)
      ? ProtoClassInfo.fromPartial(object.classInfo)
      : undefined;
    return message;
  },
};

function createBaseProtoTransform(): ProtoTransform {
  return { address: BigInt("0"), name: "", childCount: 0, parent: BigInt("0") };
}

export const ProtoTransform = {
  encode(message: ProtoTransform, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== BigInt("0")) {
      if (BigInt.asUintN(64, message.address) !== message.address) {
        throw new globalThis.Error("value provided for field message.address of type uint64 too large");
      }
      writer.uint32(8).uint64(message.address.toString());
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.childCount !== 0) {
      writer.uint32(24).int32(message.childCount);
    }
    if (message.parent !== BigInt("0")) {
      if (BigInt.asUintN(64, message.parent) !== message.parent) {
        throw new globalThis.Error("value provided for field message.parent of type uint64 too large");
      }
      writer.uint32(32).uint64(message.parent.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoTransform {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoTransform();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.childCount = reader.int32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.parent = longToBigint(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoTransform {
    return {
      address: isSet(object.address) ? BigInt(object.address) : BigInt("0"),
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      childCount: isSet(object.childCount) ? globalThis.Number(object.childCount) : 0,
      parent: isSet(object.parent) ? BigInt(object.parent) : BigInt("0"),
    };
  },

  toJSON(message: ProtoTransform): unknown {
    const obj: any = {};
    if (message.address !== BigInt("0")) {
      obj.address = message.address.toString();
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.childCount !== 0) {
      obj.childCount = Math.round(message.childCount);
    }
    if (message.parent !== BigInt("0")) {
      obj.parent = message.parent.toString();
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoTransform>, I>>(base?: I): ProtoTransform {
    return ProtoTransform.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoTransform>, I>>(object: I): ProtoTransform {
    const message = createBaseProtoTransform();
    message.address = object.address ?? BigInt("0");
    message.name = object.name ?? "";
    message.childCount = object.childCount ?? 0;
    message.parent = object.parent ?? BigInt("0");
    return message;
  },
};

function createBaseProtoGameObject(): ProtoGameObject {
  return {
    address: BigInt("0"),
    name: "",
    active: false,
    layer: 0,
    scene: undefined,
    tag: undefined,
    transform: undefined,
  };
}

export const ProtoGameObject = {
  encode(message: ProtoGameObject, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== BigInt("0")) {
      if (BigInt.asUintN(64, message.address) !== message.address) {
        throw new globalThis.Error("value provided for field message.address of type uint64 too large");
      }
      writer.uint32(8).uint64(message.address.toString());
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.active === true) {
      writer.uint32(24).bool(message.active);
    }
    if (message.layer !== 0) {
      writer.uint32(32).int32(message.layer);
    }
    if (message.scene !== undefined) {
      ProtoScene.encode(message.scene, writer.uint32(42).fork()).ldelim();
    }
    if (message.tag !== undefined) {
      writer.uint32(50).string(message.tag);
    }
    if (message.transform !== undefined) {
      ProtoTransform.encode(message.transform, writer.uint32(58).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoGameObject {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoGameObject();
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

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.active = reader.bool();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.layer = reader.int32();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.scene = ProtoScene.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.tag = reader.string();
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.transform = ProtoTransform.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoGameObject {
    return {
      address: isSet(object.address) ? BigInt(object.address) : BigInt("0"),
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      active: isSet(object.active) ? globalThis.Boolean(object.active) : false,
      layer: isSet(object.layer) ? globalThis.Number(object.layer) : 0,
      scene: isSet(object.scene) ? ProtoScene.fromJSON(object.scene) : undefined,
      tag: isSet(object.tag) ? globalThis.String(object.tag) : undefined,
      transform: isSet(object.transform) ? ProtoTransform.fromJSON(object.transform) : undefined,
    };
  },

  toJSON(message: ProtoGameObject): unknown {
    const obj: any = {};
    if (message.address !== BigInt("0")) {
      obj.address = message.address.toString();
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.active === true) {
      obj.active = message.active;
    }
    if (message.layer !== 0) {
      obj.layer = Math.round(message.layer);
    }
    if (message.scene !== undefined) {
      obj.scene = ProtoScene.toJSON(message.scene);
    }
    if (message.tag !== undefined) {
      obj.tag = message.tag;
    }
    if (message.transform !== undefined) {
      obj.transform = ProtoTransform.toJSON(message.transform);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoGameObject>, I>>(base?: I): ProtoGameObject {
    return ProtoGameObject.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoGameObject>, I>>(object: I): ProtoGameObject {
    const message = createBaseProtoGameObject();
    message.address = object.address ?? BigInt("0");
    message.name = object.name ?? "";
    message.active = object.active ?? false;
    message.layer = object.layer ?? 0;
    message.scene = (object.scene !== undefined && object.scene !== null)
      ? ProtoScene.fromPartial(object.scene)
      : undefined;
    message.tag = object.tag ?? undefined;
    message.transform = (object.transform !== undefined && object.transform !== null)
      ? ProtoTransform.fromPartial(object.transform)
      : undefined;
    return message;
  },
};

function createBaseProtoScene(): ProtoScene {
  return { handle: 0, name: "", isLoaded: false };
}

export const ProtoScene = {
  encode(message: ProtoScene, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.handle !== 0) {
      writer.uint32(8).int32(message.handle);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.isLoaded === true) {
      writer.uint32(24).bool(message.isLoaded);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ProtoScene {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProtoScene();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.handle = reader.int32();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.name = reader.string();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.isLoaded = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ProtoScene {
    return {
      handle: isSet(object.handle) ? globalThis.Number(object.handle) : 0,
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      isLoaded: isSet(object.isLoaded) ? globalThis.Boolean(object.isLoaded) : false,
    };
  },

  toJSON(message: ProtoScene): unknown {
    const obj: any = {};
    if (message.handle !== 0) {
      obj.handle = Math.round(message.handle);
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.isLoaded === true) {
      obj.isLoaded = message.isLoaded;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ProtoScene>, I>>(base?: I): ProtoScene {
    return ProtoScene.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ProtoScene>, I>>(object: I): ProtoScene {
    const message = createBaseProtoScene();
    message.handle = object.handle ?? 0;
    message.name = object.name ?? "";
    message.isLoaded = object.isLoaded ?? false;
    return message;
  },
};

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

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
