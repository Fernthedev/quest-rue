import { ParentProps, createMemo, Show } from "solid-js";
import { createUpdatingSignal } from "../../misc/utils";

export function Resizable(
  props: {
    direction: "up" | "down" | "left" | "right";
    size: number;
    minSize?: number;
    maxSize?: number;
  } & ParentProps,
) {
  const vertical = createMemo(
    () => props.direction == "up" || props.direction == "down",
  );
  const before = createMemo(
    () => props.direction == "up" || props.direction == "left",
  );

  const flexDir = createMemo(() => (vertical() ? "col" : "row"));
  const sizeClass = createMemo(() => (vertical() ? "h-1" : "w-1"));
  const cursor = createMemo(() =>
    vertical() ? "cursor-ns-resize" : "cursor-ew-resize",
  );

  // reset to size in props if that is changed externally
  const [size, setSize] = createUpdatingSignal(() => props.size);

  // helper function to clamp a size to that of the properties
  const clamp = (size: number) => {
    size = Math.max(size, props.minSize ?? 4);
    if (props.maxSize) size = Math.min(size, props.maxSize);
    return size;
  };

  // clamp here, not in mouse event, to keep the edge and the real mouse position in sync
  const style = createMemo(() => {
    const s = clamp(size());
    return vertical() ? { height: `${s}px` } : { width: `${s}px` };
  });

  const move = (event: MouseEvent) => {
    let movement = vertical() ? event.movementY : event.movementX;
    if (before()) movement = -movement;
    setSize((prev) => prev + movement);
    event.preventDefault();
  };

  // add mouseup to the document, not just the resizer
  const remove = () => {
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", remove);
    // clamp here as well
    setSize(clamp(size()));
  };
  const add = () => {
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", remove);
  };

  // declare here to not do so twice in the two <Show> blocks
  const dragger = (
    <div
      class={`flex-none ${sizeClass()} bg-zinc-400 dark:bg-zinc-500 ${cursor()}`}
      onMouseDown={add}
      role="none"
    />
  );

  // use flexbox for easy horizontal/vertical layout
  // children are responsible for doing { width/height: 100% } themselves
  return (
    <div class={`flex flex-${flexDir()}`} style={style()}>
      <Show when={before()}>{dragger}</Show>
      <div
        class="flex-1"
        classList={{ "min-w-0": !vertical(), "min-h-0": vertical() }}
      >
        {props.children}
      </div>
      <Show when={!before()}>{dragger}</Show>
    </div>
  );
}
