// src/main.tsx
import { ModelProvider } from "@/contexts/ModelContext.tsx";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ModelProvider>
                <App />
            </ModelProvider>
        </BrowserRouter>
    </React.StrictMode>
);
