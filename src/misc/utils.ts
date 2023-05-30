import toast from "solid-toast";
import { Signal, SignalOptions, createEffect, createSignal } from "solid-js";
import { PacketJSON } from "./events";
import {
    ProtoDataPayload,
    ProtoTypeInfo,
    ProtoTypeInfo_Primitive,
} from "./proto/il2cpp";

export function createUpdatingSignal<T>(val: () => T, options?: SignalOptions<T>): Signal<T> {
    const [valAccessor, valSetter] = createSignal(val(), options);
    createEffect(() => valSetter(() => val())); // typescript is so stupid sometimes
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
        return func()
    } catch (e) {
        toast.error(`Suffered from error: ${e}`)
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
    let dataArray = new Uint8Array(typeInfo.size!);

    switch (typeInfo.Info?.$case) {
        case "classInfo": {
            const value = BigInt(input);
            new DataView(dataArray.buffer).setBigInt64(0, value, true);
            break;
        }
        case "structInfo": {
            const struct: { [key: string]: string } = parseShallow(input);
            const fields = typeInfo.Info.structInfo.fieldOffsets!;
            for (const offset in fields) {
                const field = fields[offset];
                const string = struct[field.name!];
                dataArray.set(
                    stringToBytes(string, field.type!),
                    Number(offset)
                );
            }
            break;
        }
        case "arrayInfo": {
            const arr: string[] = parseShallow(input);
            const elems: Uint8Array[] = [];
            let largest = 0;
            for (const elem of arr) {
                const bytes = stringToBytes(
                    elem,
                    typeInfo.Info.arrayInfo.memberType!
                );
                elems.push(bytes);
                if (bytes.length > largest) largest = bytes.length;
            }
            typeInfo.Info.arrayInfo.memberType!.size = largest;
            dataArray = new Uint8Array(elems.length * largest);
            for (let i = 0; i < elems.length; i++)
                dataArray.set(elems[i], i * largest);
            break;
        }
        case "primitiveInfo": {
            switch (typeInfo.Info.primitiveInfo) {
                case ProtoTypeInfo_Primitive.BOOLEAN:
                    new DataView(dataArray.buffer).setUint8(
                        0,
                        Number(input == "true")
                    );
                    break;
                case ProtoTypeInfo_Primitive.CHAR:
                    new Uint16Array(dataArray.buffer)[0] = input.charCodeAt(0);
                    break;
                case ProtoTypeInfo_Primitive.BYTE:
                    new DataView(dataArray.buffer).setInt8(0, Number(input));
                    break;
                case ProtoTypeInfo_Primitive.SHORT:
                    new DataView(dataArray.buffer).setInt16(
                        0,
                        Number(input),
                        true
                    );
                    break;
                case ProtoTypeInfo_Primitive.INT:
                    new DataView(dataArray.buffer).setInt32(
                        0,
                        Number(input),
                        true
                    );
                    break;
                case ProtoTypeInfo_Primitive.LONG:
                    new DataView(dataArray.buffer).setBigInt64(
                        0,
                        BigInt(input),
                        true
                    );
                    break;
                case ProtoTypeInfo_Primitive.FLOAT:
                    new DataView(dataArray.buffer).setFloat32(
                        0,
                        Number(input),
                        true
                    );
                    break;
                case ProtoTypeInfo_Primitive.DOUBLE:
                    new DataView(dataArray.buffer).setFloat64(
                        0,
                        Number(input),
                        true
                    );
                    break;
                case ProtoTypeInfo_Primitive.STRING: {
                    dataArray = new Uint8Array(input.length * 2);
                    const utf16Arr = new Uint16Array(dataArray.buffer);
                    for (let i = 0; i < input.length; i++)
                        utf16Arr[i] = input.charCodeAt(i);
                    break;
                }
                case ProtoTypeInfo_Primitive.TYPE:
                    dataArray = ProtoTypeInfo.encode(
                        stringToProtoType(input)
                    ).finish();
                    break;
                case ProtoTypeInfo_Primitive.PTR:
                    new DataView(dataArray.buffer).setBigInt64(
                        0,
                        BigInt(input),
                        true
                    );
                    break;
                case ProtoTypeInfo_Primitive.UNKNOWN:
                case ProtoTypeInfo_Primitive.VOID:
                    break;
            }
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
    console.log("primitive info:", typeInfo.Info);
    // console.log("struct info:", typeInfo.structInfo);
    // console.log("class info:", typeInfo.classInfo);
    const arr = new Uint8Array(bytes.buffer);
    console.log("bytes:", [...arr].join(","));

    switch (typeInfo.Info?.$case) {
        case "classInfo": {
            return bytes.getBigInt64(baseOffset, true);
        }
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
                arr.push(
                    bytesToRealValue(bytes, memberType, i * memberType.size!)
                );
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
                    return "void";
            }
        }
    }

    return "";
}

export function protoDataToString(data?: PacketJSON<ProtoDataPayload>) {
    if (!data) return "";
    console.log(
        "full packet bytes:",
        [...ProtoDataPayload.encode(data).finish()].join(",")
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
    if (typeof ret === "bigint") {
        // TODO: Fix?
        // if (typeInfo.Info?.$case === "primitiveInfo" && typeInfo.Info.primitiveInfo === ProtoTypeInfo_Primitive.PTR) {
        //     return ret.toString(16)
        // }
        return ret.toString();
    }// TODO:: better nested bigints
    return JSON.stringify(ret, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
    );
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

export function stringToProtoType(input: string): ProtoTypeInfo {
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
                    memberType: stringToProtoType(input),
                },
            },
        });
    } else if (primitiveStringMap.hasStr(input.toLocaleLowerCase())) {
        return ProtoTypeInfo.create({
            ...retDef,
            Info: {
                $case: "primitiveInfo",
                primitiveInfo: primitiveStringMap.get(
                    input.toLocaleLowerCase()
                ),
            },
        });
    } else if (input.includes("::")) {
        let genericsTypes: ProtoTypeInfo[] | undefined;

        // eslint-disable-next-line prefer-const
        let [namespaze, clazz] = input.split("::", 2);
        if (clazz.includes("<") && clazz.endsWith(">")) {
            let generics: string;
            [clazz, generics] = clazz.split("<", 2);
            genericsTypes = generics
                .split(",")
                .map((s) => stringToProtoType(s.trim()));
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
    throw "Invalid type input: " + input;
}

function _protoTypeToString(type?: PacketJSON<ProtoTypeInfo>): string {
    switch (type?.Info?.$case) {
        case "classInfo": {
            let ret = `${type.Info.classInfo.clazz}`;
            if (type.Info.classInfo.generics?.length) {
                ret += "<";
                ret += type.Info.classInfo.generics
                    ?.map((t) => protoTypeToString(t))
                    .join(", ");
                ret += ">";
            }
            if (type.Info.classInfo.namespaze)
                return `${type.Info.classInfo.namespaze}::${ret}`;
            return ret;
        }
        case "arrayInfo": {
            return protoTypeToString(type.Info.arrayInfo.memberType!) + "[]";
        }
        case "structInfo": {
            const ret = type.Info.structInfo.clazz!.clazz!;
            if (type.Info.structInfo.clazz!.namespaze)
                return `${type.Info.structInfo.clazz!.namespaze}::${ret}`;
            break;
        }
        case "genericInfo":
            return type.Info.genericInfo.name;
        case "primitiveInfo": {
            if (primitiveStringMap.has(type.Info.primitiveInfo))
                return primitiveStringMap.getStr(type.Info.primitiveInfo);
            break;
        }
    }

    return "";
}

export function protoTypeToString(type?: Partial<PacketJSON<ProtoTypeInfo>>) {
    const proto = _protoTypeToString(ProtoTypeInfo.create(type));
    if (type?.isByref) return "ref " + proto;
    return proto;
}

export function getAllGenerics(type?: PacketJSON<ProtoTypeInfo>) {
    let ret: PacketJSON<ProtoTypeInfo>[] = [];
    if (type == undefined) return ret;

    switch (type.Info?.$case) {
        case "classInfo": {
            for (const generic of type.Info.classInfo.generics ?? [])
                ret = ret.concat(getAllGenerics(generic));
            break;
        }
        case "arrayInfo": {
            ret = ret.concat(getAllGenerics(type.Info.arrayInfo.memberType));
            break;
        }
        case "structInfo": {
            for (const generic of type.Info.structInfo.clazz?.generics ?? [])
                ret = ret.concat(getAllGenerics(generic));
            for (const field of Object.values(
                type.Info.structInfo.fieldOffsets ?? {}
            ))
                ret = ret.concat(getAllGenerics(field.type));
            break;
        }
        case "genericInfo":
            type.isByref = false;
            ret = [type];
            break;
        case "primitiveInfo": {
            break;
        }
    }

    return ret;
}
