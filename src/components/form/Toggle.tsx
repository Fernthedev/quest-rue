import { Accessor } from "solid-js";

interface ToggleProps {
    checkedSignal: [Accessor<boolean>, (b: boolean) => void];
    disabled?: boolean;
    title?: string;
    id?: string;
}
export default function Toggle(props: ToggleProps) {
    const checked = () => props.checkedSignal[0]();
    const setChecked = (b: boolean) => props.checkedSignal[1](b);

    return (
        <span class="flex items-center h-8">
            <label class="flex-1">{props.title}</label>
            <input
                type="checkbox"
                class="toggle flex-none"
                id={props.id}
                checked={checked()}
                onInput={(e) => setChecked(e.currentTarget.checked)}
            />
        </span>
    );
}
