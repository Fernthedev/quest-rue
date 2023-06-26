import { createStore, produce, reconcile } from "solid-js/store";
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

    const removedAddresses: [string, Variable][] =
      findRemovedAddresses(typeSafeMap);

    const addressToVariables = generateNewVariableRecord(typeSafeMap);

    const modifiedVariableMap: Record<string, Variable> = Object.fromEntries(
      removedAddresses.concat(await addressToVariables)
    );



    console.log("Old", variables)
    console.log("New", modifiedVariableMap)
    console.log("Backend", getSafePtrAddressesResult.address);
    // console.log("Result", resultingVariableMap)


    setVariables(modifiedVariableMap)
    console.log("Result", variables)
    // setVariables(produce(prev => {
    // const resultingVariableMap = {
    //   ...prev,
    //   ...modifiedVariableMap,
    // };

    //   return reconcile(resultingVariableMap, { merge: false });
    // }));
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
  const addressToDetails = await Promise.all(
    [...packetAddresses.entries()]
      // wtf is going on with type checking here
      .map<[bigint, ProtoClassInfo]>(([addr, classInfo]) => [
        BigInt(addr),
        classInfo as ProtoClassInfo,
      ])
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
    console.log("Backend storage will use", addrToString(addr))

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
  return !Object.entries(variables).some(
    ([addr, { name }]) =>
      (ignoreAddress == undefined || BigInt(addr) != ignoreAddress) &&
      name == varName.trim()
  );
}
export function getVariableValue(variable: string) {
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

  console.log("Adding as ", addressStr)
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
