import { PacketJSON } from "../events";
import {
  ProtoClassInfo,
  ProtoDataPayload,
  ProtoTypeInfo,
  ProtoTypeInfo_Primitive,
} from "../proto/il2cpp";
import { stringToDataSegment } from "./type_serialization";
import { protoDataToRealValue } from "./type_serialization";

export function protoDataToString(data?: PacketJSON<ProtoDataPayload>) {
  if (!data) return "";
  const typeInfo = data.typeInfo!;
  if (!data.data?.Data) return "";
  const ret = protoDataToRealValue(data.data, typeInfo);
  console.log(ret);
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
export function stringToProtoData(
  input: string,
  typeInfo: PacketJSON<ProtoTypeInfo>
) {
  return {
    typeInfo: typeInfo,
    data: stringToDataSegment(input, typeInfo),
  };
}
