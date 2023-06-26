import { createStore, reconcile } from "solid-js/store";
import { ProtoClassDetails, ProtoClassInfo } from "../proto/il2cpp";
import {
  AddSafePtrAddress,
  GetClassDetailsResult,
  GetSafePtrAddressesResult,
  PacketWrapper,
} from "../proto/qrue";
import { batch } from "solid-js";
import { sendPacketResult } from "../commands";
import { writePacket } from "../commands";
import { uniqueBigNumber } from "../utils";

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
    const removedAddresses: [string, Variable][] = findRemovedAddresses(
      getSafePtrAddressesResult
    );

    const addressToVariables = generateNewVariableRecord(
      getSafePtrAddressesResult
    );

    const newVariableMap: Record<string, Variable> = Object.fromEntries(
      removedAddresses.concat(await addressToVariables)
    );

    setVariables(reconcile(newVariableMap));
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
  getSafePtrAddressesResult: GetSafePtrAddressesResult
): [string, Variable][] {
  return Object.entries(variables)
    .filter(([addr]) => !Object.hasOwn(getSafePtrAddressesResult.address, addr))
    .map(([addr]) => [addr, undefined!]);
}

async function generateNewVariableRecord(
  getSafePtrAddressesResult: GetSafePtrAddressesResult
) {
  const addressToDetails = await Promise.all(
    Object.entries(getSafePtrAddressesResult.address)
      // find variables that aren't already parsed
      .filter(([addr]) => !Object.hasOwn(variables, addr))
      // wtf is going on with type checking here
      .map<[string, ProtoClassInfo]>(([addr, classInfo]) => [
        addr,
        classInfo as ProtoClassInfo,
      ])
      .map(async ([addr, classInfo]) => {
        const [classDetailsPromise] = sendPacketResult<GetClassDetailsResult>({
          $case: "getClassDetails",
          getClassDetails: {
            classInfo: classInfo,
          },
        });

        const classDetails = await classDetailsPromise;

        return [addr.toString(), classDetails.classDetails] as [
          string,
          ProtoClassDetails
        ];
      })
  );

  const addressToVariables = addressToDetails.map(([addr, classDetails]) => {
    return [
      addr,
      {
        name: addr,
        type: classDetails,
      } satisfies Variable,
    ] as [string, Variable];
  });
  return addressToVariables;
}

export function firstFree(
  beginning = "Unnamed Variable",
  ignoreAddress?: string
) {
  const usedNums = Object.entries(variables).reduce((set, [addr, { name }]) => {
    if (ignoreAddress && addr == ignoreAddress) return set;
    if (name.startsWith(beginning)) {
      const end = name.substring(beginning.length).trimStart();
      if (!isNaN(Number(end))) set.add(Number(end));
    }
    return set;
  }, new Set<number>());
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

export function isVariableNameFree(
  varName = "Unnamed Variable",
  ignoreAddress?: string
) {
  return !Object.entries(variables).some(
    ([addr, { name }]) =>
      (ignoreAddress == undefined || addr != ignoreAddress) &&
      name == varName.trim()
  );
}
export function getVariableValue(variable: string) {
  const addr = Object.entries(variables).find(
    ([, { name }]) => name === variable
  );

  return addr;
}
export function removeVariable(address: string) {
  setVariables({ [address]: undefined! });
  return sendPacketResult<GetSafePtrAddressesResult>({
    $case: "addSafePtrAddress",
    addSafePtrAddress: {
      address: BigInt(address),
      remove: true,
    },
  });
}
export function updateVariable(
  address: string,
  type: ProtoClassDetails,
  name?: string
) {
  setVariables({
    [address]: {
      name: firstFree(name, address),
      type,
    },
  });
}
export function addVariable(
  address: string,
  type: ProtoClassDetails,
  name?: string
) {
  if (address in variables) return;

  setVariables({
    [address]: {
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
