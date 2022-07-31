import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SceneViewer from "./pages/SceneViewer";

export default function App() {
    return (
        // https://github.com/remix-run/react-router/blob/main/docs/getting-started/tutorial.md
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to={"/sceneViewer"} replace />} />
                <Route path="/sceneViewer" element={<SceneViewer />} />
            </Routes>
        </BrowserRouter>
    )
}