import { PacketJSON } from "./events";
import { ProtoDataPayload, ProtoTypeInfo } from "./proto/il2cpp";

export function uniqueNumber(min = 0, max = Number.MAX_SAFE_INTEGER) {
    return Math.floor(Math.random() * max + min);
}

function stringToBytes(input: string, typeInfo: PacketJSON<ProtoTypeInfo>) {
    let dataArray = new Uint8Array(typeInfo.size!);
    if (typeInfo.classInfo != undefined) {
        const value = BigInt(input);
        new DataView(dataArray.buffer).setBigInt64(0, value, true);
    } else if (typeInfo.structInfo != undefined) {
        const struct: {[key: string] : any} = JSON.parse(input);
        const fields = typeInfo.structInfo.fieldOffsets!;
        for (const offset in fields) {
            const field = fields[offset];
            let string = JSON.stringify(struct[field.name!], (_, value) => typeof value == "bigint" ? value.toString() : value);
            string = string.replace(/^"|"$/g, '');
            dataArray.set(stringToBytes(string, field.type!), Number(offset));
        }
    } else if (typeInfo.primitiveInfo != undefined) {
        switch (typeInfo.primitiveInfo) {
        case ProtoTypeInfo.Primitive.BOOLEAN:
            new DataView(dataArray.buffer).setUint8(0, Number(input == "true"));
            break;
        case ProtoTypeInfo.Primitive.CHAR:
            new Uint16Array(dataArray.buffer)[0] = input.charCodeAt(0);
            break;
        case ProtoTypeInfo.Primitive.INT:
            new DataView(dataArray.buffer).setInt32(0, Number(input), true);
            break;
        case ProtoTypeInfo.Primitive.LONG:
            new DataView(dataArray.buffer).setBigInt64(0, BigInt(input), true);
            break;
        case ProtoTypeInfo.Primitive.FLOAT:
            new DataView(dataArray.buffer).setFloat32(0, Number(input), true);
            break;
        case ProtoTypeInfo.Primitive.DOUBLE:
            new DataView(dataArray.buffer).setFloat64(0, Number(input), true);
            break;
        case ProtoTypeInfo.Primitive.STRING:
            dataArray = new Uint8Array((input.length * 2) + 2);
            const utf16Arr = new Uint16Array(dataArray.buffer);
            for (let i = 0; i < input.length; i++)
                utf16Arr[i] = input.charCodeAt(i);
            break;
        case ProtoTypeInfo.Primitive.PTR:
            new DataView(dataArray.buffer).setBigInt64(0, BigInt(input), true);
            break;
        case ProtoTypeInfo.Primitive.UNKNOWN:
        case ProtoTypeInfo.Primitive.VOID:
            break;
        }
    }
    return dataArray;
}

export function stringToProtoData(input: string, typeInfo: PacketJSON<ProtoTypeInfo>) {
    return {
        typeInfo: typeInfo,
        data: stringToBytes(input, typeInfo),
    }
}

function bytesToRealValue(bytes: DataView, typeInfo: PacketJSON<ProtoTypeInfo>, baseOffset: number) {
    console.log("primitive info:", typeInfo.primitiveInfo);
    console.log("struct info:", typeInfo.structInfo);
    console.log("class info:", typeInfo.classInfo);
    const arr = new Uint8Array(bytes.buffer);
    console.log("bytes:", [...arr].join(","));
    if (typeInfo.classInfo != undefined) {
        return bytes.getBigInt64(baseOffset, true);
    } else if (typeInfo.structInfo != undefined) {
        let struct: {[key: string] : any} = {};
        const fields = typeInfo.structInfo.fieldOffsets!;
        for (const offset in fields) {
            const field = fields[offset];
            console.log("struct field at offset:", offset);
            struct[field.name!] = bytesToRealValue(bytes, field.type!, Number(offset) + baseOffset);
        }
        return struct;
    // check for primitive last since it seems to sometimes be 0 instead of undefined
    } else if (typeInfo.primitiveInfo != undefined) {
        switch (typeInfo.primitiveInfo) {
        case ProtoTypeInfo.Primitive.BOOLEAN:
            return bytes.getUint8(baseOffset) != 0;
        case ProtoTypeInfo.Primitive.CHAR:
            const byte = bytes.buffer.slice(baseOffset, baseOffset + 2);
            return new TextDecoder("utf-16").decode(byte);
        case ProtoTypeInfo.Primitive.INT:
            return bytes.getInt32(baseOffset, true);
        case ProtoTypeInfo.Primitive.LONG:
            return bytes.getBigInt64(baseOffset, true);
        case ProtoTypeInfo.Primitive.FLOAT:
            return bytes.getFloat32(baseOffset, true);
        case ProtoTypeInfo.Primitive.DOUBLE:
            return bytes.getFloat64(baseOffset, true);
        case ProtoTypeInfo.Primitive.STRING:
            let nullIndex = baseOffset;
            while (nullIndex < bytes.byteLength) {
                if (bytes.getUint16(baseOffset + nullIndex) == 0)
                    break;
                nullIndex += 2;
            }
            const slice = bytes.buffer.slice(baseOffset, nullIndex);
            return new TextDecoder("utf-16").decode(slice);
        case ProtoTypeInfo.Primitive.PTR:
            return bytes.getBigInt64(baseOffset, true);
        case ProtoTypeInfo.Primitive.UNKNOWN:
            return "unknown";
        case ProtoTypeInfo.Primitive.VOID:
            return "void";
        }
    }
    return "";
}

export function protoDataToString(data?: PacketJSON<ProtoDataPayload>) {
    if (!data)
        return "";
    console.log("full packet bytes:", [...ProtoDataPayload.fromObject(data).serialize()].join(","));
    const typeInfo = data.typeInfo!;
    const bytes = new DataView(data.data!.buffer.slice(-typeInfo.size!)); // wtf
    // let bytes: DataView
    // if (data.typeInfo?.classInfo || data.typeInfo?.structInfo)
    //     bytes = new DataView(data.data!.buffer);
    // else
    //     bytes = new DataView(data.data!.buffer.slice(30)); // wtf
    const ret = bytesToRealValue(bytes, typeInfo, 0);
    if (typeof ret === "string")
        return ret;
    if (typeof ret === "bigint")
        return ret.toString();
    return JSON.stringify(ret);
}

export function protoTypeToString(type: PacketJSON<ProtoTypeInfo>) {
    if (type.classInfo != undefined) {
        const ret = `${type.classInfo.clazz}*`;
        if (type.classInfo.namespaze)
            return `${type.classInfo.namespaze}::${ret}`;
        return ret;
    } else if (type.structInfo != undefined) {
        const ret = type.structInfo.clazz!.clazz;
        if (type.structInfo.clazz!.namespaze)
            return `${type.structInfo.clazz!.namespaze}::${ret}`;
        return ret;
    } else if (type.primitiveInfo != undefined) {
        switch (type.primitiveInfo) {
        case ProtoTypeInfo.Primitive.BOOLEAN:
            return "bool";
        case ProtoTypeInfo.Primitive.CHAR:
            return "char";
        case ProtoTypeInfo.Primitive.INT:
            return "int";
        case ProtoTypeInfo.Primitive.LONG:
            return "long";
        case ProtoTypeInfo.Primitive.FLOAT:
            return "float";
        case ProtoTypeInfo.Primitive.DOUBLE:
            return "double";
        case ProtoTypeInfo.Primitive.STRING:
            return "string";
        case ProtoTypeInfo.Primitive.PTR:
            return "pointer";
        case ProtoTypeInfo.Primitive.UNKNOWN:
            return "unknown";
        case ProtoTypeInfo.Primitive.VOID:
            return "void";
        }
    }
    return "";
}
