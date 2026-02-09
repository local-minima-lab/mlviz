// src/App.tsx
import { StoryProvider } from "@/contexts/StoryContext";
import StoryPageWrapper from "@/pages/StoryPageWrapper";
import { Route, Routes } from "react-router-dom";
import IndexPage from "./pages/IndexPage";

function App() {
    return (
        <div className="w-screen h-screen overflow-hidden">
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
        </div>
    );
}

export default App;
