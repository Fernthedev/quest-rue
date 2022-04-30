import { CubeFilled } from "@fluentui/react-icons";
import { Collapse, Container, Radio, Spacer } from "@nextui-org/react";

export interface GameObjectsListProps {
    objects: string[],
    // TODO: Make this return GameObject
    onSelect?: (value: string | number) => void,
}
export default function GameObjectsList(props: GameObjectsListProps) {
    return (
        // TODO: Figure out how to remove rounded corners
        <Collapse.Group
            accordion={false}

            style={{
                //flexDirection: "column", flexWrap: "nowrap", height: "101%", overflowY: "auto"
            }}>
            <Radio.Group onChange={props.onSelect}>
                {props.objects.map(e => (

                    <Collapse contentLeft={
                        <div style={{ display: "flex", flex: "row", justifyContent: "center" }}>
                            { /* The marginTop position fix is so bad */}
                            <Radio squared size={"sm"} value={e} style={{ marginTop: 10 }} />

                            <CubeFilled title="GameObject" width={"2em"} height={"2em"} />

                        </div>
                    } key={e} title={e} bordered={false}>

                    </Collapse>
                ))}
            </Radio.Group>
        </Collapse.Group>
    )
}