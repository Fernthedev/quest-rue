import { ArrowDownFilled, ArrowUpFilled, FluentIconsProps } from "@fluentui/react-icons";
import { Divider } from "@nextui-org/react";
import { useState } from "react";
import "./Tree.css"

export interface TreeItemProps {
    childrenFactory?: (() => React.ReactNode) | undefined; // use a lambda to lazy load
    expanded?: boolean
    children: React.ReactNode
    unclickableChildren?: React.ReactNode,
}
/**
 * Collapsable component that lazy renders its children
 * Once lazy loaded, it calls the lambda on render
 * 
 * @param props 
 * @returns 
 */
export function TreeItem(props: TreeItemProps) {
    const [renderedAlready, setRenderedAlready] = useState(false);
    const [expanded, setExpanded] = useState(props.expanded ?? false);

    const expandable = props.childrenFactory !== undefined;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    // const childrenRendered = useMemo(() => renderedAlready && , [renderedAlready, props.childrenFactory])

    const toggleCollapse = () => {
        setRenderedAlready(true);
        setExpanded(e => !e);
    }

    const arrowProps: FluentIconsProps = { width: "1.5em", height: "1.5em" }

    const arrow = expandable && 
        expanded ? ArrowUpFilled(arrowProps) : ArrowDownFilled(arrowProps) 
    

    return (
        <>
            <div style={{ paddingLeft: "20px", "marginTop": 10 }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                }}>
                    {props.unclickableChildren}
                    <div onClick={toggleCollapse} style={{ cursor: expandable ? "pointer" : "auto" }}>
                        {props.children}
                    </div>
                </div>


                <Divider y={1} height={3} />
                {props.childrenFactory && (
                    <>

                        {expanded && renderedAlready && props.childrenFactory && props.childrenFactory()}
                    </>
                )}
            </div>

        </>
    );
}