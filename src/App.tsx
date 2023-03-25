import "./App.css";
import { Route, Routes } from "@solidjs/router";
import SceneViewer from "./pages/SceneViewer";

function App() {
    return (
        <div class="container">
            <Routes>
                <Route path="/scene/*" component={SceneViewer} />
            </Routes>
        </div>
    );
}

export default App;
