import { CubeFilled } from "@fluentui/react-icons";
import { Collapse } from "@nextui-org/react";

export interface GameObjectsListProps {
    objects: string[]
}
export default function GameObjectsList(props: GameObjectsListProps) {
    return (
        // TODO: Figure out how to remove rounded corners
        <Collapse.Group
            accordion={false}

            style={{
                //flexDirection: "column", flexWrap: "nowrap", height: "101%", overflowY: "auto"
            }}>
            {props.objects.map(e => (
                <Collapse contentLeft={
                    <CubeFilled title="GameObject" width={"25px"} height={"25px"} />
                } key={e} title={e} bordered={false}>

                </Collapse>
            ))}
        </Collapse.Group>
    )
}