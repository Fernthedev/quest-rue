import { PacketJSON } from "../events";
import { ProtoTypeInfo, ProtoTypeInfo_Primitive } from "../proto/il2cpp";
import { stringToProtoType, protoTypeToString } from "./type_format";
import { parseShallow } from "../utils";

export function stringToBytes(
  input: string,
  typeInfo: PacketJSON<ProtoTypeInfo>
) {
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

export function bytesToRealValue(
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
