/**
 * Dataset Context
 * Manages the active dataset across the application
 * 
 * This context stores the currently active dataset which can be:
 * - A predefined dataset reference (with name like "iris", "wine")
 * - A custom Dataset object with X, y, feature_names, etc.
 * 
 * The dataset can be set from:
 * 1. Global config.json
 * 2. Page-specific parameters
 * 3. User interaction
 */

import type { components } from "@/types/api";
import React, { createContext, useContext, useState, type ReactNode } from "react";

// Use API types directly to ensure compatibility
export type Dataset = components["schemas"]["Dataset"];
export type PredefinedDataset = components["schemas"]["PredefinedDataset"];
export type DatasetInfo = components["schemas"]["DatasetInfo"];

// Union type for dataset - can be a predefined reference or a full dataset object
export type ActiveDataset = PredefinedDataset | Dataset;

interface DatasetContextType {
    activeDataset: ActiveDataset | null;
    setDataset: (dataset: ActiveDataset | null) => void;
    clearDataset: () => void;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

interface DatasetProviderProps {
    children: ReactNode;
}

export const DatasetProvider: React.FC<DatasetProviderProps> = ({ children }) => {
    const [activeDataset, setActiveDataset] = useState<ActiveDataset | null>(null);

    const setDataset = (dataset: ActiveDataset | null) => {
        console.log("[DatasetContext] Setting active dataset:", dataset);
        setActiveDataset(dataset);
    };

    const clearDataset = () => {
        console.log("[DatasetContext] Clearing active dataset");
        setActiveDataset(null);
    };

    const contextValue: DatasetContextType = {
        activeDataset,
        setDataset,
        clearDataset,
    };

    return (
        <DatasetContext.Provider value={contextValue}>
            {children}
        </DatasetContext.Provider>
    );
};

export const useDataset = () => {
    const context = useContext(DatasetContext);
    if (context === undefined) {
        throw new Error("useDataset must be used within a DatasetProvider");
    }
    return context;
};
