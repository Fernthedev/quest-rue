import { createSignal } from "solid-js";

interface SearchProps {
    value: string;
    valueChange: (s: string) => void;
}

function cancellableToken() {
    const inner = {
        cancelled: false,
    };
    return {
        cancelled: () => inner.cancelled,
        cancel: () => (inner.cancelled = true),
    };
}

export default function Search(props: SearchProps) {
    // const token = {
    //     token: cancellableToken(),
    // };

    return (
        <input
            placeholder="Search"
            value={props.value}
            onInput={(e) => {
                // const tokenCopy = token.token;
                const value = e.currentTarget.value;

                props.valueChange(value);
                // return queueMicrotask(() => {
                //     if (tokenCopy.cancelled()) return;

                //     // console.log(value);
                //     return props.valueChange(value)
                // });
            }}
            class="w-full"
        />
    );
}
