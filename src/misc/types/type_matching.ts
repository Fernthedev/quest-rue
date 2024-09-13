import {
  ProtoClassDetails,
  ProtoClassInfo,
  ProtoTypeInfo,
} from "../proto/il2cpp";
import { protoTypeToString } from "./type_format";

/**
 * Does NOT check for inheritance
 * @param targetType
 * @param typeToCheck
 * @returns
 */

export function isExactProtoTypeConvertibleTo(
  targetType: ProtoTypeInfo,
  typeToCheck: ProtoTypeInfo,
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
export function isProtoClassMatch(
  clazzT1: ProtoClassInfo | undefined,
  clazzT2: ProtoClassInfo | undefined,
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
  clazzT2: ProtoClassInfo | undefined,
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
  details: ProtoClassDetails | undefined,
): string {
  if (!details?.clazz) return "Unknown";

  return protoTypeToString(protoClassDetailsToTypeInfo(details));
}

export function protoClassDetailsToTypeInfo(
  details: ProtoClassDetails,
): ProtoTypeInfo {
  return {
    Info: {
      $case: "classInfo",
      classInfo: details.clazz!,
    },
    isByref: false,
    // TODO: Needed?
    size: 8,
  };
}

export function protoClassInfoToString(
  details: ProtoClassInfo | undefined,
): string {
  if (!details) return "Unknown";

  return protoTypeToString(protoClassInfoToTypeInfo(details));
}

export function protoClassInfoToTypeInfo(
  details: ProtoClassInfo,
): ProtoTypeInfo {
  return {
    Info: {
      $case: "classInfo",
      classInfo: details,
    },
    isByref: false,
    // TODO: Needed?
    size: 8,
  };
}

export function isProtoClassInstanceOf(
  instance: ProtoClassDetails,
  targetType: ProtoClassInfo,
): boolean {
  if (isProtoClassMatch(instance.clazz, targetType)) return true;

  const interfacesMatch = instance.interfaces.some((interf) =>
    isProtoClassMatch(interf, targetType),
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
      isProtoClassMatch(interf, targetType),
    );
    if (parentInterfacesMatch) return true;

    // check parent of parent
    parent = parent.parent;
  }

  return false;
}
