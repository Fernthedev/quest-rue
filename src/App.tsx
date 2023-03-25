import { Navigate, Route, Router, Routes } from "@solidjs/router";
import SceneViewer from "./pages/SceneViewer";

function App() {
    return (
        <div class="container min-w-full">
            <Router>
                <Routes>
                    <Route path="/scene/*" component={SceneViewer} />
                    <Route path={"/"} element={<Navigate href={"/scene/"} />} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
