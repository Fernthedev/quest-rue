import { PacketJSON } from "../events";
import { ProtoTypeInfo } from "../proto/il2cpp";

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
