import { PacketJSON } from "../events";
import {
  ProtoDataSegment,
  ProtoTypeInfo,
  ProtoTypeInfo_Primitive,
} from "../proto/il2cpp";
import { stringToProtoType, protoTypeToString } from "./type_format";
import { parseShallow } from "../utils";

export function stringToDataSegment(
  input: string,
  typeInfo: PacketJSON<ProtoTypeInfo>
): ProtoDataSegment {
  switch (typeInfo.Info?.$case) {
    case "classInfo":
      return ProtoDataSegment.create({
        Data: { $case: "classData", classData: BigInt(input) },
      });
    case "structInfo": {
      // get keys and values, keeping the values as strings so they can be passed recursively
      const struct: { [key: string]: string } = parseShallow(input);
      // convert the fields in the typeInfo to an object with the correct value for each field
      const dataObj = Object.fromEntries(
        Object.entries(typeInfo.Info.structInfo.fieldOffsets!).map(
          ([offset, { name, type }]) => [
            Number(offset),
            stringToDataSegment(struct[name], type!),
          ]
        )
      ) as { [offset: number]: ProtoDataSegment }; // ts doesn't understand the key is a number
      return ProtoDataSegment.create({
        Data: {
          $case: "structData",
          structData: {
            data: dataObj,
          },
        },
      });
    }
    case "arrayInfo": {
      const arr: string[] = parseShallow(input);
      const memberType = typeInfo.Info.arrayInfo.memberType!;
      return ProtoDataSegment.create({
        Data: {
          $case: "arrayData",
          arrayData: {
            data: arr.map((elem) => stringToDataSegment(elem, memberType)),
          },
        },
      });
    }
    case "primitiveInfo": {
      let byteArray: Uint8Array | undefined;
      const size = (bytes: number) => {
        if (!byteArray) byteArray = new Uint8Array(bytes);
        return byteArray;
      };
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
          // +1 to add null char
          const utf16Arr = new Uint16Array(size((input.length + 1) * 2).buffer);
          for (let i = 0; i < input.length; i++)
            utf16Arr[i] = input.charCodeAt(i);
          break;
        }
        case ProtoTypeInfo_Primitive.TYPE:
          byteArray = ProtoTypeInfo.encode(stringToProtoType(input)!).finish();
          break;
        case ProtoTypeInfo_Primitive.PTR:
          new DataView(size(8).buffer).setBigInt64(0, BigInt(input), true);
          break;
        case ProtoTypeInfo_Primitive.UNKNOWN:
        case ProtoTypeInfo_Primitive.VOID:
          break;
      }
      return ProtoDataSegment.create({
        Data: {
          $case: "primitiveData",
          primitiveData: byteArray ?? new Uint8Array(0),
        },
      });
    }
  }
  return {};
}

export function protoDataToRealValue(
  data: ProtoDataSegment,
  typeInfo: PacketJSON<ProtoTypeInfo>
) {
  switch (typeInfo.Info?.$case) {
    case "classInfo":
      if (data.Data?.$case != "classData") return 0;
      return data.Data.classData;
    case "structInfo": {
      if (data.Data?.$case != "structData") return {};
      const struct: Record<string, unknown> = {};
      const fields = typeInfo.Info.structInfo.fieldOffsets!;
      for (const offset in fields) {
        const field = fields[offset];
        console.log("struct field at offset:", offset);
        struct[field.name!] = protoDataToRealValue(
          data.Data.structData.data[offset],
          field.type!
        );
      }
      return struct;
    }
    case "arrayInfo": {
      if (data.Data?.$case != "arrayData") return [];
      const arr: unknown[] = [];
      const memberType = typeInfo.Info.arrayInfo.memberType!;
      for (let i = 0; i < data.Data.arrayData.data.length; i++)
        arr.push(protoDataToRealValue(data.Data.arrayData.data[i], memberType));
      return arr;
    }
    case "genericInfo":
      return typeInfo.Info.genericInfo.name;
    case "primitiveInfo": {
      if (data.Data?.$case != "primitiveData") return "";
      const arr = data.Data.primitiveData;
      const bytes = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
      switch (typeInfo.Info.primitiveInfo) {
        case ProtoTypeInfo_Primitive.BOOLEAN:
          return bytes.getUint8(0) != 0;
        case ProtoTypeInfo_Primitive.CHAR: {
          const byte = bytes.buffer.slice(0, 2);
          return new TextDecoder("utf-16").decode(byte);
        }
        case ProtoTypeInfo_Primitive.BYTE:
          return bytes.getInt8(0);
        case ProtoTypeInfo_Primitive.SHORT:
          return bytes.getInt16(0, true);
        case ProtoTypeInfo_Primitive.INT:
          return bytes.getInt32(0, true);
        case ProtoTypeInfo_Primitive.LONG:
          return bytes.getBigInt64(0, true);
        case ProtoTypeInfo_Primitive.FLOAT:
          return bytes.getFloat32(0, true);
        case ProtoTypeInfo_Primitive.DOUBLE:
          return bytes.getFloat64(0, true);
        case ProtoTypeInfo_Primitive.STRING: {
          const slice = bytes.buffer.slice(
            arr.byteOffset,
            arr.byteOffset + arr.byteLength
          );
          return new TextDecoder("utf-16").decode(slice);
        }
        case ProtoTypeInfo_Primitive.TYPE:
          return protoTypeToString(ProtoTypeInfo.decode(arr));
        case ProtoTypeInfo_Primitive.PTR:
          return bytes.getBigInt64(0, true);
        case ProtoTypeInfo_Primitive.UNKNOWN:
          return "unknown";
        case ProtoTypeInfo_Primitive.VOID:
          return "";
      }
    }
  }

  return "";
}
