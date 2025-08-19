import { Select } from "@thisbeyond/solid-select";

type SelectProps = Parameters<typeof Select>[0];

export function BetterSelect(props: SelectProps & { title?: string }) {
  return (
    <span title={props.title}>
      <Select
        {...props}
        onChange={(val) => {
          // make sure that { equals: false } doesn't cause an infinite loop
          // when used for the initial value and updated by onChange
          // (regular <input>s handle this fine, it's just needed here)
          const safeVal = val ?? "";
          if (safeVal != props.initialValue) props.onChange?.(safeVal);
        }}
      />
    </span>
  );
}
