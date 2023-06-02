import {
    JSX,
    createMemo,
    createSignal,
    onMount,
    For,
    createEffect,
    on,
} from "solid-js";
import style from "./VirtualList.module.css";

// In order for items to be able to update without changing the scroll position,
// T needs to be a type that can be compared as equal (so that <For> can remember)
// ex. number or string as opposed to array or object
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

    // signal for the index of the first element shown
    const [topIndex, setTopIndex] = createSignal(0);

    // track the height of the list container
    const listObserver = new ResizeObserver(([entry]) =>
        setHeight(entry.target.getBoundingClientRect().height)
    );

    // update the first element shown when scrolled
    onMount(() => {
        listObserver.observe(container!);
        container!.addEventListener("scroll", () =>
            setTopIndex(
                Math.floor((container?.scrollTop ?? 0) / props.itemHeight)
            )
        );
    });

    // cache rendered items to run the generator less
    const childrenCache = () => new Map<T, JSX.Element>();

    const buildFromCache = (key: T) => {
        const cache = childrenCache();
        let element = cache.get(key);
        if (!element) {
            element = props.generator(key);
            cache.set(key, element);
        }

        return element;
    };

    // unfortunately we do need to clear the cache when props.items changes even though elements might stay the same
    // as otherwise it would only ever grow if the list gets replaced repeatedly
    createEffect(
        on([() => props.generator, () => props.items], () => {
            childrenCache().clear();
        })
    );

    const renderableItems = createMemo(() =>
        props.items.slice(topIndex(), topIndex() + itemCount())
    );

    return (
        <div ref={container} class={`${props.class ?? ""} ${style.container}`}>
            {/* fixed height div to make the scroll bar the correct height */}
            <div
                class={style.scroller}
                style={{
                    height: `max(${
                        props.items.length * props.itemHeight
                    }px, 100%)`,
                }}
            >
                {/* never-seen div above the rendered elements to move them down to the correct position */}
                <div
                    style={{
                        height: `${topIndex() * props.itemHeight}px`,
                    }}
                />
                <For each={renderableItems()}>
                    {(item) => {
                        return (
                            // does this need to have props.itemHeight in its style?
                            <div class={style.itemContainer}>
                                {buildFromCache(item)}
                            </div>
                        );
                    }}
                </For>
            </div>
        </div>
    );
}
