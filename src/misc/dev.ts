import {
  GetClassDetailsResult,
  GetInstanceDetailsResult,
  PacketWrapper,
} from "./proto/qrue";
import { ProtoGameObject } from "./proto/unity";

let test_data_in_main_menu: Promise<{ items: ProtoGameObject[] }>;
let test_game_object_class_details: Promise<
  GetClassDetailsResult | GetInstanceDetailsResult
>;

// https://github.com/tauri-apps/tauri-docs/issues/699
export function isTauri(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unsafeWindow = window as any;
  
  // no strict equality here
  return (unsafeWindow.__TAURI__ || unsafeWindow.__TAURI_INTERNAL__) == true;
}

export async function devSetup() {
  if (import.meta.env.VITE_USE_QUEST_MOCK != "true") return;
  test_data_in_main_menu ??= import(
    "../misc/test_data_in_main_menu.json"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  test_game_object_class_details ??= import(
    "../misc/test_game_object_class_details.json"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
}

export async function devPacketResponse(
  p: PacketWrapper,
  callback: (response: PacketWrapper) => void,
) {
  switch (p.Packet?.$case) {
    case "getAllGameObjects": {
      console.log("mock get game objects response");
      const main_menu_json = await test_data_in_main_menu!;
      const items = main_menu_json.items;
      callback({
        queryResultId: p.queryResultId,
        Packet: {
          $case: "getAllGameObjectsResult",
          getAllGameObjectsResult: {
            objects: items,
          },
        },
      });

      break;
    }
    case "getInstanceDetails": {
      console.log("mock get instance details response");
      const class_details =
        (await test_game_object_class_details!) as GetInstanceDetailsResult;
      callback({
        queryResultId: p.queryResultId,
        Packet: {
          $case: "getInstanceDetailsResult",
          getInstanceDetailsResult: class_details,
        },
      });

      break;
    }
    case "getClassDetails": {
      console.log("mock get class details response");
      const class_details =
        (await test_game_object_class_details!) as GetClassDetailsResult;

      callback({
        queryResultId: p.queryResultId,
        Packet: {
          $case: "getClassDetailsResult",
          getClassDetailsResult: class_details,
        },
      });

      break;
    }
  }
}
