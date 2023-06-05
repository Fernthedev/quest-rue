import { ParentProps, createMemo, Show } from "solid-js";
import { createUpdatingSignal } from "../misc/utils";

export function Resizable(
    props: {
        direction: "up" | "down" | "left" | "right";
        size: number;
        minSize?: number;
        maxSize?: number;
    } & ParentProps
) {
    const vertical = createMemo(
        () => props.direction == "up" || props.direction == "down"
    );
    const before = createMemo(
        () => props.direction == "up" || props.direction == "left"
    );

    const flexDir = createMemo(() => (vertical() ? "col" : "row"));
    const cursor = createMemo(() =>
        vertical() ? "cursor-ns-resize" : "cursor-ew-resize"
    );

    // reset to size in props if that is changed externally
    const [size, setSize] = createUpdatingSignal(() => props.size);

    // clamp here, not in mouse event, to keep the edge and the real mouse position in sync
    const style = createMemo(() => {
        let s = size();
        if (props.minSize) s = Math.max(s, props.minSize);
        if (props.maxSize) s = Math.min(s, props.maxSize);
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
    };
    const add = () => {
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", remove);
    };

    // declare here to not do so twice in the two <Show> blocks
    const dragger = (
        <div
            class={`flex-none w-1 bg-blue-200 dark:bg-zinc-500 ${cursor()}`}
            onMouseDown={add}
            role="none"
        />
    );

    // use flexbox for easy horizontal/vertical layout
    // children are responsible for doing { width/height: 100% } themselves
    return (
        <div class={`flex flex-${flexDir()}`} style={style()}>
            <Show when={before()}>{dragger}</Show>
            <div class="flex-1">{props.children}</div>
            <Show when={!before()}>{dragger}</Show>
        </div>
    );
}
