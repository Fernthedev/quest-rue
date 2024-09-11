import { JSX } from "solid-js";

interface ToggleProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  value: boolean;
  onToggle: (b: boolean) => void;
  disabled?: boolean;
  title?: string;
  id?: string;
}
export default function Toggle(props: ToggleProps) {
  return (
    <span {...props} class={`flex items-center ${props.class ?? ""}`}>
      <label class="flex-1">{props.title}</label>
      <input
        type="checkbox"
        class="toggle flex-none"
        id={props.id}
        checked={props.value}
        onInput={(e) => props.onToggle(e.currentTarget.checked)}
      />
    </span>
  );
}
