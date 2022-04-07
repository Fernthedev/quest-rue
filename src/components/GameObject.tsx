import { CubeFilled, DeveloperBoardFilled, FlagFilled, FlagPrideFilled, FlashOnFilled, FStopFilled } from "@fluentui/react-icons";
import { Card, Container, Row, Spacer, Text } from "@nextui-org/react";

enum ComponentDataType {
    METHOD,
    FIELD,
    PROPERTY,
    ACTION // ?
}

interface ComponentDataCardProps {
    componentDataType: ComponentDataType
    componentName: string
}

function ComponentDataCard(props: ComponentDataCardProps) {
    let iconSize = "10%";


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
            icon = FlashOnFilled({ height: iconSize, width: iconSize })
            break;
        default:
            throw "Icon not defined for component data type"
    }

    return (
        <Card css={{ ml: "10%", mw: "330px" }} clickable bordered>
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

function ComponentCard() {
    const Comp = (props: ComponentDataCardProps) => (
        <>
            <Spacer y={0.2} />
            <ComponentDataCard {...props} />
        </>
    )

    return (
        <>
            <Container css={{ ml: "10%" }}>
                <Card css={{ mw: "330px" }} clickable bordered>
                    <Row>
                        <DeveloperBoardFilled title="GameObject" height={"10%"} width={"10%"} />
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

function GameObjectCard() {
    return (
        <div>
            <Container>
                <Card css={{ mw: "330px" }} clickable bordered >
                    <Row>
                        <CubeFilled title="GameObject" height={"10%"} width={"10%"} />
                        <Spacer x={0.2} />
                        <Text b>
                            GameObject
                        </Text>
                    </Row>
                </Card>
                <Spacer y={0.2} />
                <ComponentCard />
            </Container>
        </div>
    )
}

export default GameObjectCard;