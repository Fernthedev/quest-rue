import { createTheme, NextUIProvider } from "@nextui-org/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
// import useDarkMode from "use-dark-mode";
import { connect } from "./misc/commands";
import SceneViewer from "./pages/SceneViewer";

export default function App() {
    // MAKE A .env.development or .env.development.local file WITH THESE CONTENTS:
    // VITE_QUEST_IP="MY_QUEST_IP"
    // VITE_QUEST_PORT=3306
    console.log("Connecting");
    let port = parseInt(import.meta.env.VITE_QUEST_PORT);
    if (!port) port = 3306;

    connect(import.meta.env.VITE_QUEST_IP, port);

    // const darkMode = useDarkMode(true)

    // const lightTheme = createTheme({
    //     type: 'light',
    // })

    const darkTheme = createTheme({
        type: "dark",
    });

    // https://github.com/remix-run/react-router/blob/main/docs/getting-started/tutorial.md
    return (
        <NextUIProvider theme={darkTheme}>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={<Navigate to={"/sceneViewer"} replace />}
                    />
                    <Route path="/sceneViewer/*" element={<SceneViewer />} />
                </Routes>
            </BrowserRouter>
        </NextUIProvider>
    );
}
