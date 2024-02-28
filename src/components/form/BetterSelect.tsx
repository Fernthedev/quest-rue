import { createEffect } from "solid-js";
import { uniqueNumber } from "../../misc/utils";
import { Select } from "@thisbeyond/solid-select";

type SelectProps = Parameters<typeof Select>[0];

/**
 * Add tooltip
 * @param props 
 * @returns 
 */
export function BetterSelect(props: SelectProps & { title?: string }) {
  // set the title (tooltip) to the actual input element
  // if it's just on the outer element it doesn't show up
  const uniqId = uniqueNumber().toString();
  createEffect(() => {
    const e = document.getElementById(uniqId);
    if (e) e.title = props.title ?? "";
  });

  return (
    <Select
      {...props}
      onChange={(val) => {
        // make sure that { equals: false } doesn't cause an infinite loop
        // when used for the initial value and updated by onChange
        // (regular <input>s handle this fine, it's just needed here)
        const safeVal = val ?? "";
        if (safeVal != props.initialValue) props.onChange?.(safeVal);
      }}
      id={uniqId}
    />
  );
}
