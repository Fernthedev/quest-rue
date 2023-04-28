import { Route, Router, Routes } from "@solidjs/router";
import { lazy } from "solid-js";
const SceneViewer = lazy(() => import("./pages/SceneViewer"));
import ConnectMenu from "./pages/ConnectMenu"

function App() {
    return (
        <div class="w-screen h-screen overflow-hidden">
            <Router>
                <Routes>
                    <Route path="/scene/*" component={SceneViewer} />
                    <Route path={"/"} component={ConnectMenu} data={() => true} /> {/* redirect */}
                </Routes>
            </Router>
        </div>
    );
}

export default App;
