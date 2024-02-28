import { Index, JSX } from "solid-js";

interface SegmentedControlProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  values: string[];
  onValueSelect: (s: string) => void;
  selectedValue: string;

  disabled?: boolean;
  title?: string;
  id?: string;
}
export default function SegmentedControl(props: SegmentedControlProps) {
  const radioSelect = (
    e: Event & {
      currentTarget: HTMLInputElement;
      target: HTMLInputElement;
    }
  ) => {
    if (!e.currentTarget.checked) return;
    props.onValueSelect(e.currentTarget.value);
  };

  return (
    <span {...props} class={`flex items-center ${props.class}`}>
      <label class="flex-1">{props.title ?? props.id}</label>
      <div class="join flex-none">
        <Index each={props.values}>
          {(item) => (
            <input
              type="radio"
              tabIndex={0}
              name={props.id}
              aria-label={item()}
              value={item()}
              class="join-item btn btn-sm"
              onChange={radioSelect}
              checked={item() === props.selectedValue}
            />
          )}
        </Index>
      </div>
    </span>
  );
}
