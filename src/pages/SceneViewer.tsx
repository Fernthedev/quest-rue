import "./SceneViewer.css";
import { useTheme } from "@nextui-org/react";
import GameObjectsList from "../components/GameObjectsList";
import { Tabs } from "../components/Tabs";
import { Route, Routes } from "react-router-dom";
import { TypeManager } from "../components/TypeManager";

function SceneViewer() {
    const { theme } = useTheme();

    // future reference
    // 100vh means 100% of the view height

    // TODO: Figure out the resizing mess smh
    return (
        <div className="App">
            {/* Object list */}
            <div className="flex h-full min-h-screen w-screen">
                {/* Component data */}
                <div
                    className="flex flex-col"
                    style={{
                        // backgroundColor: "blue"
                        flex: "2",
                        backgroundColor: theme?.colors.accents0.value,
                        minHeight: "100%",
                        maxWidth: "70%"
                    }}
                >
                    <Tabs
                        tabs={["Tab 1", "Tab 2", "Tab 3", "Tab 4"]}
                        selected={1}
                    />

                    <div className="px-5">
                        {/* TODO: Require game object selected, and validate it */}
                        <Routes>
                            <Route
                                path={"components/:gameObjectAddress"}
                                element={<TypeManager />}
                            />
                        </Routes>
                    </div>
                </div>

                {/* Container box for scrolling */}
                <div
                    style={{
                        width: "30%",
                        maxWidth: "40%",
                        minWidth: "30%",
                        // maxWidth: "30vw" // TODO: Figure out how to make overflow scroll horizontal work
                    }}
                >
                    <GameObjectsList />
                </div>
            </div>
        </div>
    );
}

export default SceneViewer;
