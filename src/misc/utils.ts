import toast from "solid-toast";
import {
  Signal,
  SignalOptions,
  createEffect,
  createSignal,
  Accessor,
  createRenderEffect,
} from "solid-js";

/**
 * A signal that resets its value
 * when its dependencies change
 *
 * Fern: I'm not even sure how this works
 *
 * @param val
 * @param options
 * @returns
 */
export function createUpdatingSignal<T>(
  val: () => T,
  options?: SignalOptions<T>,
): Signal<T> {
  const [valAccessor, valSetter] = createSignal(val(), options);
  // reset the value when val is modified
  createEffect(() => valSetter(() => val())); // typescript is so stupid sometimes
  return [valAccessor, valSetter];
}

/**
 * Stores the signal value in browser local storage
 * USes the default value if none exists prior to use
 *
 * @param key
 * @param defaultVal
 * @param options
 * @returns
 */
export function createPersistentSignal(
  key: string,
  defaultVal: () => string,
  options?: SignalOptions<string>,
): Signal<string> {
  const [valAccessor, valSetter] = createSignal(
    localStorage.getItem(key) ?? defaultVal(),
    options,
  );
  // store the value every time val is modified
  createEffect(() => {
    localStorage.setItem(key, valAccessor());
  });
  return [valAccessor, valSetter];
}

/**
 * Create a memo that resolves a promise or undefined if no value
 *
 * important: anything reactive used after an await will not be tracked
 *
 * @param valPromise
 * @returns
 */
export function createAsyncMemo<T>(
  valPromise: () => Promise<T>,
): [Accessor<T | undefined>, () => Promise<T>] {
  // TODO: Use createResource or handle errors properly
  const [valAccessor, valSetter] = createSignal<T>();
  const update = async () => {
    // resolve promise before setter
    const v = await valPromise();

    return valSetter(() => v);
  };
  // run even if inital render phase
  // we use effect to listen to changes
  createRenderEffect(update);
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
    typeof value == "bigint" ? value.toString() : value,
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
    (key) => (parsed[key] = stringifyQuotesless(parsed[key])),
  );
  return parsed;
}
