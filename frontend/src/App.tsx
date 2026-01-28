// src/App.tsx
import { StoryProvider } from "@/contexts/StoryContext";
import StoryPageWrapper from "@/pages/StoryPageWrapper";
import { Route, Routes } from "react-router-dom";
import IndexPage from "./pages/IndexPage";

function App() {
    return (
        <StoryProvider>
            <Routes>
                <Route
                    path="/"
                    element={<IndexPage />}
                />
                <Route
                    path="/story/:storyName"
                    element={<StoryPageWrapper />}
                />
            </Routes>
        </StoryProvider>
    );
}

export default App;
