import { Route, Router, Routes } from "@solidjs/router";
import { catchError, lazy } from "solid-js";

import toast, { Toaster } from "solid-toast";

const SceneViewer = lazy(() => import("./pages/SceneViewer"));
import ConnectMenu from "./pages/ConnectMenu";
import { createEventEffect, getEvents } from "./misc/events";

export function objectUrl(address?: number) {
    return `/scene/${address ?? ""}`;
}

export default function App() {
    createEventEffect(getEvents().CONNECTED_EVENT, () => {
        toast.success("Connected successfully");
    });
    createEventEffect(getEvents().DISCONNECTED_EVENT, () => {
        toast.error("Disconnected from Quest");
    });
    createEventEffect(getEvents().ERROR_EVENT, (e) => {
        toast.error(`Suffered error: ${e}`);
    });

    return (
        <div class="w-screen h-screen overflow-hidden">
            <Router>
                <Routes>
                    <Route path="/scene/:address?" component={SceneViewer} />
                    <Route
                        path={"/"}
                        component={ConnectMenu}
                        data={() => true}
                    />{" "}
                    {/* redirect */}
                </Routes>
            </Router>
            <div>
                <Toaster />
            </div>
        </div>
    );
}
