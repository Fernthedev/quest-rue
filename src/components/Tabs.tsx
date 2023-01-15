import { Divider } from "@nextui-org/react";
import { useState } from "react";

export interface TabsProps {
    tabs: Array<string>;
    selected: number;
    onTabSelected?: (name: string, i: number) => void;
}

interface TabProps {
    name: string;
    selected: boolean;
    onClick: () => void;
}

function Tab(props: TabProps) {
    const activeClass = props.selected ? "tab-active" : "";

    return (
        <a className={`tab tab-lifted ${activeClass}`} onClick={props.onClick}>
            {props.name}
        </a>
    );
}

export function Tabs(props: TabsProps) {
    const [selected, setSelected] = useState(props.selected);

    return (
        <>
            <div className="tabs pt-2">
                {props.tabs.map((n, i) => (
                    <Tab
                        key={n}
                        name={n}
                        selected={i === selected}
                        onClick={() => {
                            setSelected(i);
                            if (props.onTabSelected) props.onTabSelected(n, i);
                        }}
                    />
                ))}
            </div>
            <Divider height={2} />
        </>
    );
}
