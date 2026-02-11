// src/App.tsx
import { ConfigProvider } from "@/contexts/ConfigContext";
import { StoryProvider } from "@/contexts/StoryContext";
import StoryPageWrapper from "@/pages/StoryPageWrapper";
import { Route, Routes } from "react-router-dom";
import IndexPage from "./pages/IndexPage";

function App() {
    return (
        <div className="w-screen h-screen overflow-hidden">
            <ConfigProvider>
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
            </ConfigProvider>
        </div>
    );
}

export default App;

