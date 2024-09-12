import { invoke } from "@tauri-apps/api/tauri";
import { isTauri } from "./dev";

let forwarded: [string, string] | undefined = undefined;

export function has_adb(): Promise<string | undefined> {
  // todo: replace with webadb in this case? idk
  if (!isTauri()) return Promise.resolve(undefined);

  return invoke("check_adb").catch((e) => {
    console.log("check_adb err", e);
    return false;
  }) as Promise<string | undefined>;
}

export function adb_devices(): Promise<[string, string][]> {
  // return Promise.resolve([["1WMHH825340391", "Quest 2"], ["id 2", "device 2"], ["id 3", "device 3!!"], ["id 3", "device 4!!!!"]]);
  if (!isTauri()) return Promise.resolve([]);

  return invoke("list_devices").catch((e) => {
    console.log("list_devices err", e);
    return [];
  }) as Promise<[string, string][]>;
}

export function adb_forward(device: string, port: string): Promise<void> {
  if (!isTauri()) return Promise.resolve();

  cleanup_forward();
  forwarded = [device, port];

  return invoke("adb_forward", { device, port }).catch((e) => {
    console.log("adb_forward err", e);
  }) as Promise<void>;
}

export function adb_unforward(device: string, port: string): Promise<void> {
  if (!isTauri()) return Promise.resolve();

  forwarded = undefined;

  return invoke("adb_unforward", { device, port }).catch((e) => {
    console.log("adb_unforward err", e);
  }) as Promise<void>;
}

export function cleanup_forward() {
  if (forwarded) adb_unforward(...forwarded);
}
