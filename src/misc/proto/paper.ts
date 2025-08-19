/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

/** / https://github.com/Fernthedev/paperlog/blob/89a2726d78bf86c28f8b8b17ded6bbed43d56c1b/shared/internal_logger.hpp#L60-L67 */
export interface PaperLogData {
  str: string;
  threadId: bigint;
  tag: string;
  fileName: string;
  functionName: string;
  fileLine: number;
  logTime: bigint;
}

function createBasePaperLogData(): PaperLogData {
  return { str: "", threadId: BigInt("0"), tag: "", fileName: "", functionName: "", fileLine: 0, logTime: BigInt("0") };
}

export const PaperLogData = {
  encode(message: PaperLogData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.str !== "") {
      writer.uint32(10).string(message.str);
    }
    if (message.threadId !== BigInt("0")) {
      if (BigInt.asUintN(64, message.threadId) !== message.threadId) {
        throw new globalThis.Error("value provided for field message.threadId of type uint64 too large");
      }
      writer.uint32(16).uint64(message.threadId.toString());
    }
    if (message.tag !== "") {
      writer.uint32(26).string(message.tag);
    }
    if (message.fileName !== "") {
      writer.uint32(34).string(message.fileName);
    }
    if (message.functionName !== "") {
      writer.uint32(42).string(message.functionName);
    }
    if (message.fileLine !== 0) {
      writer.uint32(48).int32(message.fileLine);
    }
    if (message.logTime !== BigInt("0")) {
      if (BigInt.asUintN(64, message.logTime) !== message.logTime) {
        throw new globalThis.Error("value provided for field message.logTime of type uint64 too large");
      }
      writer.uint32(56).uint64(message.logTime.toString());
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PaperLogData {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePaperLogData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.str = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.threadId = longToBigint(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.tag = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.fileName = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.functionName = reader.string();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.fileLine = reader.int32();
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.logTime = longToBigint(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PaperLogData {
    return {
      str: isSet(object.str) ? globalThis.String(object.str) : "",
      threadId: isSet(object.threadId) ? BigInt(object.threadId) : BigInt("0"),
      tag: isSet(object.tag) ? globalThis.String(object.tag) : "",
      fileName: isSet(object.fileName) ? globalThis.String(object.fileName) : "",
      functionName: isSet(object.functionName) ? globalThis.String(object.functionName) : "",
      fileLine: isSet(object.fileLine) ? globalThis.Number(object.fileLine) : 0,
      logTime: isSet(object.logTime) ? BigInt(object.logTime) : BigInt("0"),
    };
  },

  toJSON(message: PaperLogData): unknown {
    const obj: any = {};
    if (message.str !== "") {
      obj.str = message.str;
    }
    if (message.threadId !== BigInt("0")) {
      obj.threadId = message.threadId.toString();
    }
    if (message.tag !== "") {
      obj.tag = message.tag;
    }
    if (message.fileName !== "") {
      obj.fileName = message.fileName;
    }
    if (message.functionName !== "") {
      obj.functionName = message.functionName;
    }
    if (message.fileLine !== 0) {
      obj.fileLine = Math.round(message.fileLine);
    }
    if (message.logTime !== BigInt("0")) {
      obj.logTime = message.logTime.toString();
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<PaperLogData>, I>>(base?: I): PaperLogData {
    return PaperLogData.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<PaperLogData>, I>>(object: I): PaperLogData {
    const message = createBasePaperLogData();
    message.str = object.str ?? "";
    message.threadId = object.threadId ?? BigInt("0");
    message.tag = object.tag ?? "";
    message.fileName = object.fileName ?? "";
    message.functionName = object.functionName ?? "";
    message.fileLine = object.fileLine ?? 0;
    message.logTime = object.logTime ?? BigInt("0");
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
