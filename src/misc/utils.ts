import toast from "solid-toast";
import { Signal, SignalOptions, createEffect, createSignal } from "solid-js";
import { PacketJSON } from "./events";
import {
  ProtoClassDetails,
  ProtoClassInfo,
  ProtoDataPayload,
  ProtoTypeInfo,
  ProtoTypeInfo_Primitive,
} from "./proto/il2cpp";

export function createUpdatingSignal<T>(
  val: () => T,
  options?: SignalOptions<T>
): Signal<T> {
  const [valAccessor, valSetter] = createSignal(val(), options);
  // reset the value with dependencies
  createEffect(() => valSetter(() => val())); // typescript is so stupid sometimes
  return [valAccessor, valSetter];
}
export function createLocalSignal(
  key: string,
  defaultVal: () => string,
  options?: SignalOptions<string>
): Signal<string> {
  const [valAccessor, valSetter] = createSignal(
    localStorage.getItem(key) ?? defaultVal(),
    options
  );
  createEffect(() => {
    localStorage.setItem(key, valAccessor());
  });
  return [valAccessor, valSetter];
}

export function uniqueNumber(min = 0, max = Number.MAX_SAFE_INTEGER) {
  return Math.floor(Math.random() * max + min);
}
export function uniqueBigNumber(min = 0, max = Number.MAX_SAFE_INTEGER) {
  return BigInt(uniqueNumber(min, max));
}

function stringifyQuotesless(obj: unknown) {
  return JSON.stringify(obj, (_, value) =>
    typeof value == "bigint" ? value.toString() : value
  ).replace(/^"|"$/g, "");
}

export function errorHandle<R, T extends () => R>(func: T) {
  try {
    return func();
  } catch (e) {
    toast.error(`Suffered from error: ${e}`);
    throw e;
  }
}

function parseShallow(jsonStr: string) {
  const parsed = JSON.parse(jsonStr);
  if (typeof parsed == "string") return parsed;
  if (Array.isArray(parsed))
    return parsed.map((elem) => stringifyQuotesless(elem));
  Object.keys(parsed).forEach(
    (key) => (parsed[key] = stringifyQuotesless(parsed[key]))
  );
  return parsed;
}

function stringToBytes(input: string, typeInfo: PacketJSON<ProtoTypeInfo>) {
  let dataArray: Uint8Array | undefined;
  const size = (bytes: number) => {
    if (!dataArray) dataArray = new Uint8Array(bytes);
    return dataArray;
  };
  const defSize = () => size(typeInfo.size!);

  switch (typeInfo.Info?.$case) {
    case "classInfo":
      new DataView(size(8).buffer).setBigInt64(0, BigInt(input), true);
      break;
    case "structInfo": {
      const struct: { [key: string]: string } = parseShallow(input);
      const fields = typeInfo.Info.structInfo.fieldOffsets!;
      for (const offset in fields) {
        const field = fields[offset];
        const string = struct[field.name!];
        defSize().set(stringToBytes(string, field.type!), Number(offset));
      }
      break;
    }
    case "arrayInfo": {
      const arr: string[] = parseShallow(input);
      const elems: Uint8Array[] = [];
      let largest = 0;
      for (const elem of arr) {
        const bytes = stringToBytes(elem, typeInfo.Info.arrayInfo.memberType!);
        elems.push(bytes);
        if (bytes.length > largest) largest = bytes.length;
      }
      typeInfo.Info.arrayInfo.memberType!.size = largest;
      for (let i = 0; i < elems.length; i++)
        size(elems.length * largest).set(elems[i], i * largest);
      break;
    }
    case "primitiveInfo": {
      switch (typeInfo.Info.primitiveInfo) {
        case ProtoTypeInfo_Primitive.BOOLEAN:
          new DataView(size(1).buffer).setUint8(0, Number(input == "true"));
          break;
        case ProtoTypeInfo_Primitive.CHAR:
          new Uint16Array(size(2).buffer)[0] = input.charCodeAt(0);
          break;
        case ProtoTypeInfo_Primitive.BYTE:
          new DataView(size(1).buffer).setInt8(0, Number(input));
          break;
        case ProtoTypeInfo_Primitive.SHORT:
          new DataView(size(2).buffer).setInt16(0, Number(input), true);
          break;
        case ProtoTypeInfo_Primitive.INT:
          new DataView(size(4).buffer).setInt32(0, Number(input), true);
          break;
        case ProtoTypeInfo_Primitive.LONG:
          new DataView(size(8).buffer).setBigInt64(0, BigInt(input), true);
          break;
        case ProtoTypeInfo_Primitive.FLOAT:
          new DataView(size(4).buffer).setFloat32(0, Number(input), true);
          break;
        case ProtoTypeInfo_Primitive.DOUBLE:
          new DataView(size(8).buffer).setFloat64(0, Number(input), true);
          break;
        case ProtoTypeInfo_Primitive.STRING: {
          const utf16Arr = new Uint16Array(size(input.length * 2).buffer);
          for (let i = 0; i < input.length; i++)
            utf16Arr[i] = input.charCodeAt(i);
          break;
        }
        case ProtoTypeInfo_Primitive.TYPE:
          dataArray = ProtoTypeInfo.encode(stringToProtoType(input)!).finish();
          break;
        case ProtoTypeInfo_Primitive.PTR:
          new DataView(size(8).buffer).setBigInt64(0, BigInt(input), true);
          break;
        case ProtoTypeInfo_Primitive.UNKNOWN:
        case ProtoTypeInfo_Primitive.VOID:
          break;
      }
    }
  }

  return dataArray ?? new Uint8Array(0);
}

export function stringToProtoData(
  input: string,
  typeInfo: PacketJSON<ProtoTypeInfo>
) {
  return {
    typeInfo: typeInfo,
    data: stringToBytes(input, typeInfo),
  };
}

function bytesToRealValue(
  bytes: DataView,
  typeInfo: PacketJSON<ProtoTypeInfo>,
  baseOffset: number
) {
  const arr = new Uint8Array(bytes.buffer);

  switch (typeInfo.Info?.$case) {
    case "classInfo":
      return bytes.getBigInt64(baseOffset, true);
    case "structInfo": {
      const struct: Record<string, unknown> = {};
      const fields = typeInfo.Info.structInfo.fieldOffsets!;
      for (const offset in fields) {
        const field = fields[offset];
        console.log("struct field at offset:", offset);
        struct[field.name!] = bytesToRealValue(
          bytes,
          field.type!,
          Number(offset) + baseOffset
        );
      }
      return struct;
    }
    case "arrayInfo": {
      const arr: unknown[] = [];
      const memberType = typeInfo.Info.arrayInfo.memberType!;
      for (let i = 0; i < (typeInfo.Info.arrayInfo.length ?? 0); i++)
        arr.push(bytesToRealValue(bytes, memberType, i * memberType.size!));
      return arr;
      // check for primitive last since its default is 0 instead of undefined
    }
    case "genericInfo":
      return typeInfo.Info.genericInfo.name;
    case "primitiveInfo": {
      switch (typeInfo.Info.primitiveInfo) {
        case ProtoTypeInfo_Primitive.BOOLEAN:
          return bytes.getUint8(baseOffset) != 0;
        case ProtoTypeInfo_Primitive.CHAR: {
          const byte = bytes.buffer.slice(baseOffset, baseOffset + 2);
          return new TextDecoder("utf-16").decode(byte);
        }
        case ProtoTypeInfo_Primitive.BYTE:
          return bytes.getInt8(baseOffset);
        case ProtoTypeInfo_Primitive.SHORT:
          return bytes.getInt16(baseOffset, true);
        case ProtoTypeInfo_Primitive.INT:
          return bytes.getInt32(baseOffset, true);
        case ProtoTypeInfo_Primitive.LONG:
          return bytes.getBigInt64(baseOffset, true);
        case ProtoTypeInfo_Primitive.FLOAT:
          return bytes.getFloat32(baseOffset, true);
        case ProtoTypeInfo_Primitive.DOUBLE:
          return bytes.getFloat64(baseOffset, true);
        case ProtoTypeInfo_Primitive.STRING: {
          const slice = bytes.buffer.slice(
            baseOffset,
            baseOffset + typeInfo.size!
          );
          return new TextDecoder("utf-16").decode(slice);
        }
        case ProtoTypeInfo_Primitive.TYPE:
          return protoTypeToString(ProtoTypeInfo.decode(arr));
        case ProtoTypeInfo_Primitive.PTR:
          return bytes.getBigInt64(baseOffset, true);
        case ProtoTypeInfo_Primitive.UNKNOWN:
          return "unknown";
        case ProtoTypeInfo_Primitive.VOID:
          return "";
      }
    }
  }

  return "";
}

export function protoDataToString(data?: PacketJSON<ProtoDataPayload>) {
  if (!data) return "";
  const typeInfo = data.typeInfo!;
  // fill with zeroes if left empty
  if (!data.data || data.data?.length == 0)
    data.data = new Uint8Array(typeInfo.size!);
  const bytes = new DataView(data.data!.buffer.slice(-typeInfo.size!)); // wtf
  const ret = bytesToRealValue(bytes, typeInfo, 0);
  if (
    data.typeInfo?.Info?.$case == "primitiveInfo" &&
    data.typeInfo.Info.primitiveInfo == ProtoTypeInfo_Primitive.LONG
  )
    return ret.toString();
  if (typeof ret === "string") return ret;
  if (typeof ret === "bigint") return `0x${ret.toString(16)}`;
  // TODO:: better nested bigints
  // TODO: Format pointers in structs as base16
  return JSON.stringify(ret, (_, value) => {
    return typeof value === "bigint" ? value.toString() : value;
  });
}

class TwoWayMap {
  map: Record<string, ProtoTypeInfo_Primitive>;
  reverse: Record<number, string>;
  constructor(map: Record<string, ProtoTypeInfo_Primitive>) {
    this.map = map;
    this.reverse = {};
    for (const key in map) {
      const value = map[key];
      this.reverse[value] = key;
    }
  }
  get(key: string) {
    return this.map[key];
  }
  hasStr(key: string) {
    return key in this.map;
  }
  getStr(key: ProtoTypeInfo_Primitive) {
    return this.reverse[key];
  }
  has(key: ProtoTypeInfo_Primitive) {
    return key in this.reverse;
  }
}

const primitiveStringMap = new TwoWayMap({
  bool: ProtoTypeInfo_Primitive.BOOLEAN,
  char: ProtoTypeInfo_Primitive.CHAR,
  byte: ProtoTypeInfo_Primitive.BYTE,
  short: ProtoTypeInfo_Primitive.SHORT,
  int: ProtoTypeInfo_Primitive.INT,
  long: ProtoTypeInfo_Primitive.LONG,
  float: ProtoTypeInfo_Primitive.FLOAT,
  double: ProtoTypeInfo_Primitive.DOUBLE,
  string: ProtoTypeInfo_Primitive.STRING,
  type: ProtoTypeInfo_Primitive.TYPE,
  pointer: ProtoTypeInfo_Primitive.PTR,
  void: ProtoTypeInfo_Primitive.VOID,
  unknown: ProtoTypeInfo_Primitive.UNKNOWN,
});

export function stringToProtoType(
  input: string,
  requireValid = true
): ProtoTypeInfo | undefined {
  const byRef = input.startsWith("ref ");
  if (byRef) input = input.slice(4).trim();

  const retDef = ProtoTypeInfo.create({
    isByref: byRef,
  });
  // TODO: is size needed?

  if (input.endsWith("[]")) {
    input = input.slice(0, -2).trim();
    return ProtoTypeInfo.create({
      ...retDef,
      Info: {
        $case: "arrayInfo",
        arrayInfo: {
          memberType: stringToProtoType(input)!,
        },
      },
    });
  } else if (primitiveStringMap.hasStr(input.toLocaleLowerCase())) {
    return ProtoTypeInfo.create({
      ...retDef,
      Info: {
        $case: "primitiveInfo",
        primitiveInfo: primitiveStringMap.get(input.toLocaleLowerCase()),
      },
    });
  } else if (input.includes("::")) {
    let genericsTypes: ProtoTypeInfo[] | undefined;

    let [namespaze, clazz] = input.split("::", 2);
    if (clazz.includes("<") && clazz.endsWith(">")) {
      let generics: string;
      [clazz, generics] = clazz.split("<", 2);
      genericsTypes = generics
        .split(",")
        .map((s) => stringToProtoType(s.trim())!);
    }

    return ProtoTypeInfo.create({
      ...retDef,
      Info: {
        $case: "classInfo",
        classInfo: {
          namespaze: namespaze,
          clazz: clazz,
          generics: genericsTypes,
        },
      },
    });
  }
  if (requireValid) throw "Invalid type input: " + input;
  return undefined;
}

function _protoClassToString(classInfo: ProtoClassInfo): string {
  let ret = `${classInfo.clazz}`;
  if (classInfo.generics?.length) {
    ret += "<";
    ret += classInfo.generics?.map((t) => protoTypeToString(t)).join(", ");
    ret += ">";
  }
  if (classInfo.namespaze) return `${classInfo.namespaze}::${ret}`;
  return ret;
}

function _protoTypeToString(type?: PacketJSON<ProtoTypeInfo>): string {
  switch (type?.Info?.$case) {
    case "classInfo":
      return _protoClassToString(type.Info.classInfo);
    case "arrayInfo":
      return protoTypeToString(type.Info.arrayInfo.memberType!) + "[]";
    case "structInfo":
      return _protoClassToString(type.Info.structInfo.clazz!);
    case "genericInfo":
      return type.Info.genericInfo.name;
    case "primitiveInfo":
      if (primitiveStringMap.has(type.Info.primitiveInfo))
        return primitiveStringMap.getStr(type.Info.primitiveInfo);
      break;
  }
  return "";
}

export function protoTypeToString(type?: Partial<PacketJSON<ProtoTypeInfo>>) {
  const proto = _protoTypeToString(ProtoTypeInfo.create(type));
  if (type?.isByref) return "ref " + proto;
  return proto;
}

export function stringToPrimitive(
  str: string
): ProtoTypeInfo_Primitive | undefined {
  return primitiveStringMap.get(str);
}
export function primitiveToString(
  primitive: ProtoTypeInfo_Primitive
): string | undefined {
  return primitiveStringMap.getStr(primitive);
}

export function getGenerics(type?: PacketJSON<ProtoTypeInfo>): ProtoTypeInfo[] {
  if (type == undefined) return [];

  switch (type.Info?.$case) {
    case "classInfo":
      return type.Info.classInfo.generics?.flatMap((t) => getGenerics(t)) ?? [];
    case "arrayInfo":
      return getGenerics(type.Info.arrayInfo.memberType);
    case "structInfo":
      return (
        type.Info.structInfo.clazz?.generics?.flatMap((t) => getGenerics(t)) ??
        []
      );
    case "genericInfo":
      return [{ ...type, isByref: false }];
  }
  return [];
}

export function getInstantiation(
  type: PacketJSON<ProtoTypeInfo>,
  generics: Map<number, ProtoTypeInfo>
): ProtoTypeInfo {
  let ret = ProtoTypeInfo.fromJSON(ProtoTypeInfo.toJSON(type));

  switch (ret.Info?.$case) {
    case "classInfo":
      ret.Info.classInfo.generics = ret.Info.classInfo.generics.map(
        (g) =>
          generics.get(
            g.Info?.$case == "genericInfo"
              ? g.Info?.genericInfo?.genericIndex
              : -1
          ) ?? g
      );
      return ret;
    case "arrayInfo":
      ret.Info.arrayInfo.memberType = getInstantiation(
        ret.Info.arrayInfo.memberType!,
        generics
      );
      return ret;
    case "structInfo":
      if (ret.Info.structInfo.clazz) {
        ret.Info.structInfo.clazz.generics =
          ret.Info.structInfo.clazz.generics.map(
            (g) =>
              generics.get(
                g.Info?.$case == "genericInfo"
                  ? g.Info?.genericInfo?.genericIndex
                  : -1
              ) ?? g
          );
      }
      return ret;
    case "genericInfo":
      ret = generics.get(ret.Info.genericInfo.genericIndex) ?? ret;
      ret.isByref = type.isByref;
      return ret;
  }
  return ret;
}

export function isProtoClassInstanceOf(
  instance: ProtoClassDetails,
  targetType: ProtoClassInfo
): boolean {
  if (isProtoClassMatch(instance.clazz, targetType)) return true;

  const interfacesMatch = instance.interfaces.some((interf) =>
    isProtoClassMatch(interf, targetType)
  );
  if (interfacesMatch) return true;

  // check if parent matches targetType
  // or check if parent interfaces matches targetType
  let parent = instance.parent;
  while (parent !== undefined) {
    const parentMatches = isProtoClassMatch(parent.clazz, targetType);
    if (parentMatches) return true;

    // check interfaces
    const parentInterfacesMatch = parent.interfaces.some((interf) =>
      isProtoClassMatch(interf, targetType)
    );
    if (parentInterfacesMatch) return true;

    // check parent of parent
    parent = parent.parent;
  }

  return false;
}

/**
 * Does NOT check for inheritance
 * @param targetType
 * @param typeToCheck
 * @returns
 */
export function isExactProtoTypeConvertibleTo(
  targetType: ProtoTypeInfo,
  typeToCheck: ProtoTypeInfo
): boolean {
  // TODO: Should we be more strict with primitives?
  if (targetType.Info?.$case === "primitiveInfo") {
    return typeToCheck.Info?.$case === "primitiveInfo";
  }

  if (targetType.Info?.$case === "arrayInfo") {
    if (typeToCheck.Info?.$case !== "arrayInfo") return false;

    const arrayT1 = targetType.Info.arrayInfo.memberType;
    const arrayT2 = typeToCheck.Info.arrayInfo.memberType;

    return (
      arrayT1 === arrayT2 || // same
      (arrayT1 !== undefined &&
        arrayT2 !== undefined &&
        isExactProtoTypeConvertibleTo(arrayT1, arrayT2))
    );
  }

  if (targetType.Info?.$case === "structInfo") {
    if (typeToCheck.Info?.$case !== "structInfo") return false;

    const structT1 = targetType.Info.structInfo;
    const structT2 = typeToCheck.Info.structInfo;

    return isProtoClassMatch(structT1.clazz, structT2.clazz);
  }
  if (targetType.Info?.$case === "classInfo") {
    if (typeToCheck.Info?.$case !== "classInfo") return false;

    const clazzT1 = targetType.Info.classInfo;
    const clazzT2 = typeToCheck.Info.classInfo;

    return isProtoClassMatch(clazzT1, clazzT2);
  }

  return false;
}

function isProtoClassMatch(
  clazzT1: ProtoClassInfo | undefined,
  clazzT2: ProtoClassInfo | undefined
) {
  if (clazzT1 === clazzT2) return true;
  if (typeof clazzT1 !== typeof clazzT2) return false;

  const namespaceMatch = clazzT1?.namespaze === clazzT2?.namespaze;
  const nameMatch = clazzT1?.clazz === clazzT2?.clazz;
  const clazzGenericsMatch = isProtoGenericsMatch(clazzT1, clazzT2);

  return namespaceMatch && nameMatch && clazzGenericsMatch;
}

function isProtoGenericsMatch(
  clazzT1: ProtoClassInfo | undefined,
  clazzT2: ProtoClassInfo | undefined
) {
  return (
    clazzT1 !== undefined &&
    clazzT2 !== undefined &&
    clazzT1.generics.length === clazzT2.generics.length &&
    clazzT1.generics.every((g1, i) => {
      const g2 = clazzT2.generics[i];
      return isExactProtoTypeConvertibleTo(g1, g2);
    })
  );
}
export function protoClassDetailsToString(
  details: ProtoClassDetails | undefined
): string {
  if (!details?.clazz) return "Unknown";

  return protoTypeToString(protoClassDetailsToTypeInfo(details));
}

export function protoClassDetailsToTypeInfo(details: ProtoClassDetails): ProtoTypeInfo {
  return {
    Info: {
      $case: "classInfo",
      classInfo: details.clazz!,
    },
    isByref: false,
    // TODO: Needed?
    size: details.fields.reduce((acc, x) => acc += (x.type?.size ?? 0), 0)
  }
}
