import { createStore } from "solid-js/store";
import { ProtoClassDetails, ProtoClassInfo } from "../proto/il2cpp";
import {
  GetClassDetailsResult,
  GetSafePtrAddressesResult,
  PacketWrapper,
} from "../proto/qrue";
import { batch } from "solid-js";
import { sendPacketResult } from "../commands";
import { writePacket } from "../commands";
import { uniqueBigNumber } from "../utils";

const reservedNames: { [key: string]: bigint } = { Null: 0n };

export interface Variable {
  name: string;
  type: ProtoClassDetails;
}

export const [variables, setVariables] = createStore<{
  // Records don't support bigint :(
  [addr: string]: Variable;
}>({});

export function handleSafePtrAddresses(
  getSafePtrAddressesResult: GetSafePtrAddressesResult
) {
  batch(async () => {
    const typeSafeMap = new Map(
      Object.entries(getSafePtrAddressesResult.address).map(([addr, i]) => [
        BigInt(addr),
        i as ProtoClassInfo,
      ])
    );

    // Find addresses no longer in backend
    const removedAddresses: [string, Variable][] =
      findRemovedAddresses(typeSafeMap);

    // Find new variables to add
    const newVariables = generateNewVariableRecord(typeSafeMap);

    const modifiedVariableMap: Record<string, Variable> = Object.fromEntries(
      removedAddresses.concat(await newVariables)
    );

    // This merges with the previous value
    setVariables(modifiedVariableMap);
  });
}

export function requestVariables() {
  writePacket(
    PacketWrapper.create({
      queryResultId: uniqueBigNumber(),
      Packet: {
        $case: "getSafePtrAddresses",
        getSafePtrAddresses: {},
      },
    })
  );
}

function findRemovedAddresses(
  packetAddresses: Map<bigint, ProtoClassInfo>
): [string, Variable][] {
  return Object.keys(variables)
    .filter((addr) => !packetAddresses.has(BigInt(addr)))
    .map((addr) => [addr, undefined!]);
}

async function generateNewVariableRecord(
  packetAddresses: Map<bigint, ProtoClassInfo>
) {
  // find class details of all the new variables
  const addressToDetails = await Promise.all(
    [...packetAddresses.entries()]
      // find variables that aren't already parsed
      .filter(([addr]) => !(addrToString(addr) in variables))
      .map(async ([addr, classInfo]) => {
        const [classDetailsPromise] = sendPacketResult<GetClassDetailsResult>({
          $case: "getClassDetails",
          getClassDetails: {
            classInfo: classInfo,
          },
        });

        const classDetails = await classDetailsPromise;

        return [addr, classDetails.classDetails] as [bigint, ProtoClassDetails];
      })
  );

  const addressToVariables = addressToDetails.map(([addr, classDetails]) => {
    return [
      addrToString(addr),
      {
        name: `0x${BigInt(addr).toString(16)}`,
        type: classDetails,
      } satisfies Variable,
    ] as [string, Variable];
  });
  return addressToVariables;
}

export function firstFree(
  beginning = "Unnamed Variable",
  ignoreAddress?: bigint
) {
  const usedNums = Object.entries(variables).reduce((set, [addr, { name }]) => {
    if (ignoreAddress && BigInt(addr) == ignoreAddress) return set;
    if (name.startsWith(beginning)) {
      const end = name.substring(beginning.length).trimStart();
      if (!isNaN(Number(end))) set.add(Number(end));
    }
    return set;
  }, new Set<number>());

  if (Object.keys(reservedNames).includes(beginning)) usedNums.add(0);

  let ret = 0;
  for (let i = 0; ; i++) {
    if (!usedNums.has(i)) {
      ret = i;
      break;
    }
  }
  if (ret == 0) return beginning;
  return `${beginning} ${ret}`;
}

export function addrToString(addr: bigint) {
  return addr.toString(10);
}

export function isVariableNameFree(
  varName = "Unnamed Variable",
  ignoreAddress?: bigint
) {
  if (Object.keys(reservedNames).includes(varName)) return false;

  return !Object.entries(variables).some(
    ([addr, { name }]) =>
      (ignoreAddress == undefined || BigInt(addr) != ignoreAddress) &&
      name == varName.trim()
  );
}
export function getVariableValue(variable: string): [string, Variable] | undefined {
  const reserved = reservedNames[variable];
  if (reserved != undefined) return [reserved.toString(), {name: variable, type: ProtoClassDetails.fromPartial({
    clazz: {
      namespaze: "System",
      clazz: "Object",
    }
  })}];

  const addr = Object.entries(variables).find(
    ([, { name }]) => name === variable
  );

  return addr;
}

export function getVariable(addr: bigint) {
  return variables[addrToString(addr)];
}

export function removeVariable(address: bigint) {
  const addrString = addrToString(address);
  setVariables({ [addrString]: undefined! });

  return sendPacketResult<GetSafePtrAddressesResult>({
    $case: "addSafePtrAddress",
    addSafePtrAddress: {
      address: address,
      remove: true,
    },
  });
}
export function updateVariable(
  address: bigint,
  type: ProtoClassDetails,
  name?: string
) {
  const addressStr = addrToString(address);
  if (!(addressStr in variables)) {
    throw `No address ${addressStr} in variables`;
  }

  setVariables({
    [addrToString(address)]: {
      name: firstFree(name, address),
      type,
    },
  });
}
export function addVariable(
  address: bigint,
  type: ProtoClassDetails,
  name?: string
) {
  const addressStr = addrToString(address);
  if (addressStr in variables) return;

  console.log("Adding as ", addressStr);
  setVariables({
    [addressStr]: {
      name: firstFree(name),
      type,
    },
  });

  return sendPacketResult<GetSafePtrAddressesResult>({
    $case: "addSafePtrAddress",
    addSafePtrAddress: {
      address: BigInt(address),
      remove: false,
    },
  });
}
