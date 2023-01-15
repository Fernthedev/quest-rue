import {
    ChevronLeftFilled,
    ChevronDownFilled,
    CubeFilled,
    FluentIconsProps,
} from "@fluentui/react-icons";
import { Divider, Radio } from "@nextui-org/react";
import { NodeComponentProps } from "react-vtree/dist/es/Tree";
import { GameObjectJSON } from "../../misc/events";

export interface GameObjectRowTreeData {
    defaultHeight: number;
    go: GameObjectJSON;
    id: symbol;
    hasChildren: boolean;
    isOpenByDefault: boolean;
    nestingLevel: number;
}

export type GameObjectRowProps = NodeComponentProps<GameObjectRowTreeData>;

// Node component receives all the data we created in the `treeWalker` +
// internal openness state (`isOpen`), function to change internal openness
// state (`toggle`) and `style` parameter that should be added to the root div.
export function GameObjectRow({
    data: { go, hasChildren, nestingLevel },
    toggle,
    isOpen,
    style,
}: GameObjectRowProps) {
    const arrowProps: FluentIconsProps = { width: "1.5em", height: "1.5em" };

    const arrow = isOpen ? (
        <ChevronDownFilled {...arrowProps} />
    ) : (
        <ChevronLeftFilled {...arrowProps} />
    );

    return (
        <div
            style={{
                paddingLeft: `calc(20px * ${nestingLevel + 1})`,
                ...style,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                    }}
                >
                    <Radio
                        isSquared
                        key={go.transform!.address}
                        size={"sm"}
                        value={go.transform!.address!.toString()}
                        label={go.transform!.address?.toString()}
                        aria-label={go.transform!.address?.toString()}
                    />

                    <CubeFilled
                        title="GameObject"
                        width={"2rem"}
                        height={"2rem"}
                    />
                </div>
                {/* minWidth is necessary for the text to handle overflow properly */}
                <div
                    onClick={() => hasChildren && toggle()}
                    style={{
                        cursor: hasChildren ? "pointer" : "auto",
                        minWidth: 0,
                    }}
                >
                    <h4
                        style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {go.name}
                    </h4>
                </div>
                {hasChildren && (
                    <div
                        style={{
                            display: "flex",
                            flex: 1,
                            justifyContent: "right",
                            paddingRight: "10px",
                            cursor: hasChildren ? "pointer" : "auto",
                        }}
                        onClick={toggle}
                    >
                        {arrow}
                    </div>
                )}
            </div>

            <Divider y={1} height={3} />
        </div>
    );
}
