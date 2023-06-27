import {
  Index,
  JSX,
  ParentProps,
  Signal,
  createMemo,
  createRenderEffect,
  createSignal,
} from "solid-js";

export interface TabProps extends ParentProps {
  defaultTab?: number;
  tabClass?: "bordered" | "lifted" | "boxed";
  size?: "xs" | "sm" | "md" | "lg";
  children?: [string, JSX.Element][];
  onTabSelect: Signal<JSX.Element>;
  defer?: boolean;
}

export function Tabs(props: TabProps) {
  const [activeTab, setActiveTab] = createSignal(props.defaultTab ?? 0);

  // Select the initial tab on page load
  createRenderEffect(() => {
    // do not call if deferred
    if (props.defer || !props.children || props.children.length === 0) return;

    // select first
    const defaultTabIndex = props.defaultTab ?? 0;
    const defaultTab = props.children[defaultTabIndex]?.[1];

    if (!defaultTab) return;
    select(defaultTabIndex, defaultTab);
  });

  function select(index: number, element: JSX.Element) {
    setActiveTab(index);
    // call setter
    props.onTabSelect[1](element);
  }

  return (
    <div class="tabs" classList={{ "tabs-boxed": props.tabClass === "boxed" }}>
      <Index each={props.children ?? []}>
        {(item, index) => {
          const name = createMemo(() => item()[0]);

          const size = () =>
            props.size !== undefined ? `tab-${props.size}` : "";

          return (
            <button
              onClick={() => select(index, item()[1])}
              class={`tab btn-no-style ${size()}`}
              classList={{
                "tab-active": activeTab() === index,
                "tab-bordered": props.tabClass === "bordered",
                "tab-lifted": props.tabClass === "lifted",
              }}
            >
              {name()}
            </button>
          );
        }}
      </Index>
    </div>
  );
}
