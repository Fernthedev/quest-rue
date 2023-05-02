import { Navigator, Route, Router, Routes, useNavigate } from "@solidjs/router";
import { lazy, onMount } from "solid-js";
const SceneViewer = lazy(() => import("./pages/SceneViewer"));
import ConnectMenu from "./pages/ConnectMenu"

let navigate: Navigator;

export function selectObject(address?: number) {
    navigate(`/scene/${address ?? ""}`);
}

function GlobalNav() {
    onMount(() => navigate = useNavigate());
    return <></>
}

export default function App() {
    return (
        <div class="w-screen h-screen overflow-hidden">
            <Router>
                <Routes>
                    <Route path="/scene/:address?" component={SceneViewer} />
                    <Route path={"/"} component={ConnectMenu} data={() => true} /> {/* redirect */}
                    <GlobalNav />
                </Routes>
            </Router>
        </div>
    );
}
