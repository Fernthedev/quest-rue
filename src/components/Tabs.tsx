import { Divider } from "@nextui-org/react"

export interface TabsProps {
    tabs: Array<string>
    selected: number
}

export function Tabs(props: TabsProps) {
    const tabs = []
    for(let i = 0; i < props.tabs.length; i++) {
        const name = (i === props.selected) ? "tab tab-lifted tab-active" : "tab tab-lifted"
        tabs.push(<a className={name}>{ props.tabs[i] }</a>)
    }
    return (
        <>
            <div className="tabs pt-2">
                {tabs}
            </div>
            <Divider height={2}></Divider>
        </>
    )
}
