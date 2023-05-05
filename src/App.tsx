import { Route, Router, Routes } from "@solidjs/router";
import { lazy } from "solid-js";
const SceneViewer = lazy(() => import("./pages/SceneViewer"));
import ConnectMenu from "./pages/ConnectMenu"

export function objectUrl(address?: number) {
    return `/scene/${address ?? ""}`;
}

export default function App() {
    return (
        <div class="w-screen h-screen overflow-hidden">
            <Router>
                <Routes>
                    <Route path="/scene/:address?" component={SceneViewer} />
                    <Route path={"/"} component={ConnectMenu} data={() => true} /> {/* redirect */}
                </Routes>
            </Router>
        </div>
    );
}
