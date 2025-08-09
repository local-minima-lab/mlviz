// src/App.tsx
import { StoryPage } from "@/pages/StoryPage";
import { Route, Routes } from "react-router-dom";
import IndexPage from "./pages/IndexPage";

function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={<IndexPage />}
            />
            <Route
                path="/story/:storyName"
                element={<StoryPage />}
            />
        </Routes>
    );
}

export default App;
