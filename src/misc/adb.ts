import { isTauri } from "./dev";
import { Command } from "@tauri-apps/plugin-shell";

let forwarded: [string, string] | undefined = undefined;

export async function has_adb(): Promise<string | undefined> {
  // todo: replace with webadb in this case? idk
  if (!isTauri()) return Promise.resolve(undefined);

  const output = await Command.create("adb", "--version").execute();
  if (output.code !== 0) return undefined;
  return output.stdout;
}

export async function adb_devices(): Promise<[string, string][]> {
  if (!isTauri()) return Promise.resolve([]);

  const output = await Command.create("adb", "devices").execute();
  if (output.code !== 0) return [];

  const ret: [string, string][] = [];
  const lines = output.stdout.split("\n").slice(1);
  for (const line of lines) {
    const split = line.trim().split(RegExp("\\s+"), 2);
    if (split.length < 2 || split[1] !== "device") continue;

    const [id] = split;
    const cmd = Command.create("adb", [
      "-s",
      id,
      "shell",
      "getprop ro.product.model",
    ]);
    const name = (await cmd.execute()).stdout;

    if (name.trim().length > 0) ret.push([id, name.trim()]);
  }
  return ret;
}

export async function adb_forward(device: string, port: string): Promise<void> {
  if (!isTauri()) return Promise.resolve();

  cleanup_forward();
  forwarded = [device, port];

  const tcp = `tcp:${port}`;
  const cmd = Command.create("adb", ["-s", device, "forward", tcp, tcp]);
  await cmd.execute();
}

export async function adb_unforward(
  device: string,
  port: string,
): Promise<void> {
  if (!isTauri()) return Promise.resolve();

  forwarded = undefined;

  const tcp = `tcp:${port}`;
  const cmd = Command.create("adb", ["-s", device, "forward", "--remove", tcp]);
  await cmd.execute();
}

export async function cleanup_forward() {
  if (forwarded) await adb_unforward(...forwarded);
}
