import toast from "solid-toast";
import { Signal, SignalOptions, createEffect, createSignal, Accessor } from "solid-js";

export function createUpdatingSignal<T>(
  val: () => T,
  options?: SignalOptions<T>
): Signal<T> {
  const [valAccessor, valSetter] = createSignal(val(), options);
  // reset the value with dependencies
  createEffect(() => valSetter(() => val())); // typescript is so stupid sometimes
  return [valAccessor, valSetter];
}
export function createPersistentSignal(
  key: string,
  defaultVal: () => string,
  options?: SignalOptions<string>
): Signal<string> {
  const [valAccessor, valSetter] = createSignal(
    localStorage.getItem(key) ?? defaultVal(),
    options
  );
  createEffect(() => {
    localStorage.setItem(key, valAccessor());
  });
  return [valAccessor, valSetter];
}
// important: anything reactive used after an await will not be tracked
export function createAsyncMemo<T>(val: () => Promise<T>): [Accessor<T | undefined>, () => Promise<T>] {
  const [valAccessor, valSetter] = createSignal<T>();
  const update = () => val().then((val) => valSetter(() => val));
  createEffect(update);
  return [valAccessor, update];
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
    return func();
  } catch (e) {
    toast.error(`Suffered from error: ${e}`);
    throw e;
  }
}

export function parseShallow(jsonStr: string) {
  const parsed = JSON.parse(jsonStr);
  if (typeof parsed == "string") return parsed;
  if (Array.isArray(parsed))
    return parsed.map((elem) => stringifyQuotesless(elem));
  Object.keys(parsed).forEach(
    (key) => (parsed[key] = stringifyQuotesless(parsed[key]))
  );
  return parsed;
}
