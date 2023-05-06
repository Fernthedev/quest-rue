import { PacketJSON } from "./events";
import { ProtoDataPayload, ProtoTypeInfo } from "./proto/il2cpp";

export function uniqueNumber(min = 0, max = Number.MAX_SAFE_INTEGER) {
    return Math.floor(Math.random() * max + min);
}

function stringifyQuotesless(obj: any) {
    return JSON.stringify(obj, (_, value) =>
        typeof value == "bigint" ? value.toString() : value
    ).replace(/^"|"$/g, "");
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
    let dataArray = new Uint8Array(typeInfo.size!);
    if (typeInfo.classInfo != undefined) {
        const value = BigInt(input);
        new DataView(dataArray.buffer).setBigInt64(0, value, true);
    } else if (typeInfo.structInfo != undefined) {
        const struct: { [key: string]: string } = parseShallow(input);
        const fields = typeInfo.structInfo.fieldOffsets!;
        for (const offset in fields) {
            const field = fields[offset];
            const string = struct[field.name!];
            dataArray.set(stringToBytes(string, field.type!), Number(offset));
        }
    } else if (typeInfo.arrayInfo != undefined) {
        const arr: string[] = parseShallow(input);
        const elems: Uint8Array[] = [];
        let largest = 0;
        for (const elem of arr) {
            const bytes = stringToBytes(elem, typeInfo.arrayInfo.memberType!);
            elems.push(bytes);
            if (bytes.length > largest) largest = bytes.length;
        }
        typeInfo.arrayInfo.memberType!.size = largest;
        dataArray = new Uint8Array(elems.length * largest);
        for (let i = 0; i < elems.length; i++)
            dataArray.set(elems[i], i * largest);
    } else if (typeInfo.primitiveInfo != undefined) {
        switch (typeInfo.primitiveInfo) {
            case ProtoTypeInfo.Primitive.BOOLEAN:
                new DataView(dataArray.buffer).setUint8(
                    0,
                    Number(input == "true")
                );
                break;
            case ProtoTypeInfo.Primitive.CHAR:
                new Uint16Array(dataArray.buffer)[0] = input.charCodeAt(0);
                break;
            case ProtoTypeInfo.Primitive.BYTE:
                new DataView(dataArray.buffer).setInt8(0, Number(input));
                break;
            case ProtoTypeInfo.Primitive.SHORT:
                new DataView(dataArray.buffer).setInt16(0, Number(input), true);
                break;
            case ProtoTypeInfo.Primitive.INT:
                new DataView(dataArray.buffer).setInt32(0, Number(input), true);
                break;
            case ProtoTypeInfo.Primitive.LONG:
                new DataView(dataArray.buffer).setBigInt64(
                    0,
                    BigInt(input),
                    true
                );
                break;
            case ProtoTypeInfo.Primitive.FLOAT:
                new DataView(dataArray.buffer).setFloat32(
                    0,
                    Number(input),
                    true
                );
                break;
            case ProtoTypeInfo.Primitive.DOUBLE:
                new DataView(dataArray.buffer).setFloat64(
                    0,
                    Number(input),
                    true
                );
                break;
            case ProtoTypeInfo.Primitive.STRING: {
                dataArray = new Uint8Array(input.length * 2);
                const utf16Arr = new Uint16Array(dataArray.buffer);
                for (let i = 0; i < input.length; i++)
                    utf16Arr[i] = input.charCodeAt(i);
                break;
            }
            case ProtoTypeInfo.Primitive.TYPE:
                dataArray = ProtoTypeInfo.fromObject(
                    stringToProtoType(input)
                ).serialize();
                break;
            case ProtoTypeInfo.Primitive.PTR:
                new DataView(dataArray.buffer).setBigInt64(
                    0,
                    BigInt(input),
                    true
                );
                break;
            case ProtoTypeInfo.Primitive.UNKNOWN:
            case ProtoTypeInfo.Primitive.VOID:
                break;
        }
    }
    return dataArray;
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
    console.log("primitive info:", typeInfo.primitiveInfo);
    console.log("struct info:", typeInfo.structInfo);
    console.log("class info:", typeInfo.classInfo);
    const arr = new Uint8Array(bytes.buffer);
    console.log("bytes:", [...arr].join(","));
    if (typeInfo.classInfo != undefined) {
        return bytes.getBigInt64(baseOffset, true);
    } else if (typeInfo.structInfo != undefined) {
        const struct: { [key: string]: any } = {};
        const fields = typeInfo.structInfo.fieldOffsets!;
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
    } else if (typeInfo.arrayInfo != undefined) {
        const arr: any[] = [];
        const memberType = typeInfo.arrayInfo.memberType!;
        for (let i = 0; i < (typeInfo.arrayInfo.length ?? 0); i++)
            arr.push(bytesToRealValue(bytes, memberType, i * memberType.size!));
        return arr;
        // check for primitive last since its default is 0 instead of undefined
    } else if (typeInfo.primitiveInfo != undefined) {
        switch (typeInfo.primitiveInfo) {
            case ProtoTypeInfo.Primitive.BOOLEAN:
                return bytes.getUint8(baseOffset) != 0;
            case ProtoTypeInfo.Primitive.CHAR: {
                const byte = bytes.buffer.slice(baseOffset, baseOffset + 2);
                return new TextDecoder("utf-16").decode(byte);
            }
            case ProtoTypeInfo.Primitive.BYTE:
                return bytes.getInt8(baseOffset);
            case ProtoTypeInfo.Primitive.SHORT:
                return bytes.getInt16(baseOffset, true);
            case ProtoTypeInfo.Primitive.INT:
                return bytes.getInt32(baseOffset, true);
            case ProtoTypeInfo.Primitive.LONG:
                return bytes.getBigInt64(baseOffset, true);
            case ProtoTypeInfo.Primitive.FLOAT:
                return bytes.getFloat32(baseOffset, true);
            case ProtoTypeInfo.Primitive.DOUBLE:
                return bytes.getFloat64(baseOffset, true);
            case ProtoTypeInfo.Primitive.STRING: {
                const slice = bytes.buffer.slice(
                    baseOffset,
                    baseOffset + typeInfo.size!
                );
                return new TextDecoder("utf-16").decode(slice);
            }
            case ProtoTypeInfo.Primitive.TYPE:
                return protoTypeToString(
                    ProtoTypeInfo.deserialize(arr).toObject()
                );
            case ProtoTypeInfo.Primitive.GENERIC:
                return `unspecified generic T${typeInfo.size}`;
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
    if (!data) return "";
    console.log(
        "full packet bytes:",
        [...ProtoDataPayload.fromObject(data).serialize()].join(",")
    );
    if (data.data?.length == 0) return "";
    const typeInfo = data.typeInfo!;
    const bytes = new DataView(data.data!.buffer.slice(-typeInfo.size!)); // wtf
    // let bytes: DataView
    // if (data.typeInfo?.classInfo || data.typeInfo?.structInfo)
    //     bytes = new DataView(data.data!.buffer);
    // else
    //     bytes = new DataView(data.data!.buffer.slice(30)); // wtf
    const ret = bytesToRealValue(bytes, typeInfo, 0);
    if (typeof ret === "string") return ret;
    if (typeof ret === "bigint") return ret.toString();
    // TODO:: better nested bigints
    return JSON.stringify(ret, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    );
}

class TwoWayMap {
    map: Record<string, ProtoTypeInfo.Primitive>;
    reverse: Record<number, string>;
    constructor(map: Record<string, ProtoTypeInfo.Primitive>) {
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
    getStr(key: ProtoTypeInfo.Primitive) {
        return this.reverse[key];
    }
    has(key: ProtoTypeInfo.Primitive) {
        return key in this.reverse;
    }
}

const primitiveStringMap = new TwoWayMap({
    bool: ProtoTypeInfo.Primitive.BOOLEAN,
    char: ProtoTypeInfo.Primitive.CHAR,
    byte: ProtoTypeInfo.Primitive.BYTE,
    short: ProtoTypeInfo.Primitive.SHORT,
    int: ProtoTypeInfo.Primitive.INT,
    long: ProtoTypeInfo.Primitive.LONG,
    float: ProtoTypeInfo.Primitive.FLOAT,
    double: ProtoTypeInfo.Primitive.DOUBLE,
    string: ProtoTypeInfo.Primitive.STRING,
    type: ProtoTypeInfo.Primitive.TYPE,
    // generic generally is Twhatnot
    pointer: ProtoTypeInfo.Primitive.PTR,
    void: ProtoTypeInfo.Primitive.VOID,
    unknown: ProtoTypeInfo.Primitive.UNKNOWN,
});

export function stringToProtoType(input: string) {
    const ret: PacketJSON<ProtoTypeInfo> = {};
    // TODO: is size needed?
    ret.isByref = input.startsWith("ref ");
    if (ret.isByref) input = input.slice(4).trim();
    if (input.endsWith("[]")) {
        input = input.slice(0, -2).trim();
        ret.arrayInfo = {
            memberType: stringToProtoType(input),
        };
        return ret;
    } else if (primitiveStringMap.hasStr(input.toLocaleLowerCase())) {
        ret.primitiveInfo = primitiveStringMap.get(input.toLocaleLowerCase());
        return ret;
    } else if (input.includes("::")) {
        ret.classInfo = {};
        // eslint-disable-next-line prefer-const
        let [namespaze, clazz] = input.split("::", 2);
        if (clazz.includes("<") && clazz.endsWith(">")) {
            let generics: string;
            [clazz, generics] = clazz.split("<", 2);
            ret.classInfo.generics = generics
                .split(",")
                .map((s) => stringToProtoType(s.trim()));
        }
        ret.classInfo.namespaze = namespaze;
        ret.classInfo.clazz = clazz;
        return ret;
    }
    throw "Invalid type input: " + input;
}

function _protoTypeToString(type?: PacketJSON<ProtoTypeInfo>): string {
    if (type?.classInfo != undefined) {
        let ret = `${type.classInfo.clazz}`;
        if (type.classInfo.generics?.length) {
            ret += "<";
            ret += type.classInfo.generics
                ?.map((t) => protoTypeToString(t))
                .join(", ");
            ret += ">";
        }
        if (type.classInfo.namespaze)
            return `${type.classInfo.namespaze}::${ret}`;
        return ret;
    } else if (type?.arrayInfo != undefined) {
        return protoTypeToString(type.arrayInfo.memberType!) + "[]";
    } else if (type?.structInfo != undefined) {
        const ret = type.structInfo.clazz!.clazz!;
        if (type.structInfo.clazz!.namespaze)
            return `${type.structInfo.clazz!.namespaze}::${ret}`;
    } else if (type?.primitiveInfo != undefined) {
        if (primitiveStringMap.has(type.primitiveInfo))
            return primitiveStringMap.getStr(type.primitiveInfo);
        if (type.primitiveInfo == ProtoTypeInfo.Primitive.GENERIC)
            return `T${type.size}`;
    }
    return "";
}

export function protoTypeToString(type?: PacketJSON<ProtoTypeInfo>) {
    if (type?.isByref) return "ref " + _protoTypeToString(type);
    return _protoTypeToString(type);
}

export function getAllGenerics(type?: PacketJSON<ProtoTypeInfo>) {
    let ret: PacketJSON<ProtoTypeInfo>[] = [];
    if (type == undefined) return ret;
    if (type?.classInfo != undefined) {
        for (const generic of type.classInfo.generics ?? [])
            ret = ret.concat(getAllGenerics(generic));
    } else if (type?.arrayInfo != undefined) {
        ret = ret.concat(getAllGenerics(type.arrayInfo.memberType));
    } else if (type?.structInfo != undefined) {
        for (const generic of type.structInfo.clazz?.generics ?? [])
            ret = ret.concat(getAllGenerics(generic));
        for (const field of Object.values(type.structInfo.fieldOffsets ?? {}))
            ret = ret.concat(getAllGenerics(field.type));
    } else if (type?.primitiveInfo != undefined) {
        if (type.primitiveInfo == ProtoTypeInfo.Primitive.GENERIC) {
            type.isByref = false;
            ret = [type];
        }
    }
    return ret;
}
