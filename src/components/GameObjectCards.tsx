import { CubeFilled, DeveloperBoardFilled, FlagFilled, FlagPrideFilled, FlashFilled, FStopFilled } from "@fluentui/react-icons";
import { Card, Container, Row, Spacer, Text } from "@nextui-org/react";

export enum ComponentDataType {
    METHOD,
    FIELD,
    PROPERTY,
    ACTION // ?
}

export interface ComponentDataCardProps {
    componentDataType: ComponentDataType
    componentName: string
}

export function ComponentDataCard(props: ComponentDataCardProps) {
    const iconSize = "25px";


    let icon;
    switch (props.componentDataType) {
        case ComponentDataType.METHOD:
            icon = FStopFilled({ height: iconSize, width: iconSize })
            break;
        case ComponentDataType.FIELD:
            icon = FlagFilled({ height: iconSize, width: iconSize })
            break;
        case ComponentDataType.PROPERTY:
            icon = FlagPrideFilled({ height: iconSize, width: iconSize }) // why not 
            break;
        case ComponentDataType.ACTION:
            icon = FlashFilled({ height: iconSize, width: iconSize })
            break;
        default:
            throw "Icon not defined for component data type"
    }

    return (
        <Card css={{ ml: "10%", mw: "200px" }} isPressable variant={"bordered"}>
            <Row>
                {icon}
                <Spacer x={0.2} />
                <Text b>
                    {props.componentName}
                </Text>
            </Row>
        </Card>
    )
}

export function ComponentCard() {
    const Comp = (props: ComponentDataCardProps) =>
    (
        <>
            <Spacer y={0.2} />
            <ComponentDataCard {...props} />
        </>
    )

    return (
        <>
            <Container css={{ ml: "5%" }}>
                <Card css={{ mw: "200px" }} isPressable variant={"bordered"}>
                    <Row>
                        <DeveloperBoardFilled title="GameObject" height={"25px"} width={"25px"} />
                        <Spacer x={0.2} />
                        <Text b>
                            Component 1
                        </Text>
                    </Row>
                </Card>
                <Spacer y={0.2} />
                <Comp componentDataType={ComponentDataType.FIELD} componentName={"Field"} />
                <Comp componentDataType={ComponentDataType.METHOD} componentName={"Method"} />
                <Comp componentDataType={ComponentDataType.PROPERTY} componentName={"Property"} />
                <Comp componentDataType={ComponentDataType.ACTION} componentName={"Action"} />
            </Container>
        </>
    )
}

export interface GameObjectCardProps {
    name: string
}
export function GameObjectCard(props: GameObjectCardProps) {
    return (
        <Container>
            <Card css={{ mw: "200px" }} isPressable variant={"bordered"} >
                <Row>
                    <CubeFilled title="GameObject" width={"25px"} height={"25px"} />
                    <Spacer x={0.2} />
                    <Text b>
                        GameObject {props.name}
                    </Text>
                </Row>
            </Card>
            <Spacer y={0.2} />
            <ComponentCard />
        </Container>
    )
}

export default GameObjectCard;