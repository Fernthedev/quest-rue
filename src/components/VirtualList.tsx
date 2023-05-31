import { JSX, createMemo, createSignal, onMount, For } from "solid-js";
import style from "./VirtualList.module.css";

export function VirtualList<T>(props: {
    itemHeight: number;
    items: T[];
    generator: (item: T) => JSX.Element;
    class?: string;
}) {
    let container: HTMLDivElement | undefined;

    const [height, setHeight] = createSignal(0);
    const itemCount = createMemo(
        () => Math.floor(height() / props.itemHeight) + 1
    );

    const [topIndex, setTopIndex] = createSignal(0);

    const listObserver = new ResizeObserver(([entry]) =>
        setHeight(entry.target.getBoundingClientRect().height)
    );

    onMount(() => {
        listObserver.observe(container!);
        container!.addEventListener("scroll", () =>
            setTopIndex(
                Math.floor((container?.scrollTop ?? 0) / props.itemHeight)
            )
        );
    });

    return (
        <div ref={container} class={`${props.class ?? ""} ${style.container}`}>
            <div
                class={style.scroller}
                style={{
                    height: `max(${
                        props.items.length * props.itemHeight
                    }px, 100%)`,
                }}
            >
                <For
                    each={props.items.slice(
                        topIndex(),
                        topIndex() + itemCount()
                    )}
                >
                    {(item) => {
                        // console.log(topIndex() + index())
                        return (
                            <div
                                class={style.itemContainer}
                                style={{
                                    height: `${props.itemHeight}px`,
                                    top: `${topIndex() * props.itemHeight}px`,
                                }}
                            >
                                {props.generator(item)}
                            </div>
                        );
                    }}
                </For>
            </div>
        </div>
    );
}
