import { Divider } from "@nextui-org/react"

export interface TabsProps {
    tabs: Array<string>
    selected: number
}

interface TabProps {
    name: string,
    selected: boolean
}

function Tab(props: TabProps) {
    const activeClass = props.selected ? "tab-active" : "";

    return (
        <a className={`tab tab-lifted ${activeClass}`}>{props.name}</a>
    )
}

export function Tabs(props: TabsProps) {
    return (
        <>
            <div className="tabs pt-2">
                {props.tabs.map((n, i) => (
                    <Tab key={n} name={n} selected={i === props.selected} />
                ))}
            </div>
            <Divider height={2} />
        </>
    )
}
