import { createEffect } from "solid-js";
import styles from "./ObjectView.module.css";
import { SpanFn } from "./ObjectView";

export function OverloadCell(props: {
    name: string;
    count: number;
    colSize: number;
    spanFn: SpanFn;
    toggleFn: () => void;
    expanded: boolean;
}) {
    let element: HTMLDivElement | undefined;
    createEffect(() => {
        if (element) props.spanFn(element, props.colSize);
    });

    return (
        <span
            ref={element}
            class={`font-mono method ${styles.overload} ${styles.gridElement}`}
        >
            <button
                aria-label={`${props.name} overloads`}
                onClick={() => props.toggleFn()}
                class="py-0 px-1 -mx-1"
            >
                {`${props.name}(${props.count} overloads)`}
            </button>
            {props.expanded ? "-" : "+"}
        </span>
    );
}
