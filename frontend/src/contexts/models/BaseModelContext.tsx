/**
 * Base Model Context
 * Provides shared data storage, persistence, and reset functionality for all model contexts
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode
} from "react";

/**
 * Base interface that all model data types should extend
 */
export interface BaseModelData {
    // Marker interface - models can extend this with their specific data
}

/**
 * Configuration for the base model context
 */
interface BaseModelConfig {
    localStorageKey: string;
    paramsStorageKey: string;
}

/**
 * Base context type that all model contexts will use
 */
interface BaseModelContextType<TModelData extends BaseModelData> {
    currentModelData: TModelData | null;
    lastParams: Record<string, any>;
    setCurrentModelData: (data: TModelData | null) => void;
    setLastParams: (params: Record<string, any>) => void;
    resetModelData: () => void;
    getLastParams: () => Record<string, any>;
}

/**
 * Create a base model context with the specified configuration
 */
export function createBaseModelContext<TModelData extends BaseModelData>(
    config: BaseModelConfig
) {
    const Context = createContext<BaseModelContextType<TModelData> | undefined>(
        undefined
    );

    interface ProviderProps {
        children: ReactNode;
    }

    const Provider: React.FC<ProviderProps> = ({ children }) => {
        // State for model data with localStorage persistence
        const [currentModelData, setCurrentModelDataState] = useState<TModelData | null>(() => {
            const stored = localStorage.getItem(config.localStorageKey);
            if (stored) {
                try {
                    console.log(`[BaseModelContext] Loading data from localStorage: ${config.localStorageKey}`);
                    return JSON.parse(stored);
                } catch (e) {
                    console.error(`[BaseModelContext] Failed to parse stored data:`, e);
                    return null;
                }
            }
            return null;
        });

        // State for last parameters
        const [lastParams, setLastParamsState] = useState<Record<string, any>>(() => {
            const stored = localStorage.getItem(config.paramsStorageKey);
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    console.error(`[BaseModelContext] Failed to parse stored params:`, e);
                    return {};
                }
            }
            return {};
        });

        // Persist currentModelData to localStorage whenever it changes
        useEffect(() => {
            if (currentModelData) {
                localStorage.setItem(config.localStorageKey, JSON.stringify(currentModelData));
            } else {
                localStorage.removeItem(config.localStorageKey);
            }
        }, [currentModelData]);

        // Persist lastParams to localStorage whenever it changes
        useEffect(() => {
            if (Object.keys(lastParams).length > 0) {
                localStorage.setItem(config.paramsStorageKey, JSON.stringify(lastParams));
            } else {
                localStorage.removeItem(config.paramsStorageKey);
            }
        }, [lastParams]);

        const setCurrentModelData = useCallback((data: TModelData | null) => {
            console.log(`[BaseModelContext] Setting model data:`, data);
            setCurrentModelDataState(data);
        }, []);

        const setLastParams = useCallback((params: Record<string, any>) => {
            console.log(`[BaseModelContext] Setting last params:`, params);
            setLastParamsState(params);
        }, []);

        const resetModelData = useCallback(() => {
            console.log(`[BaseModelContext] Resetting model data`);
            setCurrentModelDataState(null);
            setLastParamsState({});
            localStorage.removeItem(config.localStorageKey);
            localStorage.removeItem(config.paramsStorageKey);
        }, []);

        const getLastParams = useCallback(() => {
            return lastParams;
        }, [lastParams]);

        const contextValue: BaseModelContextType<TModelData> = {
            currentModelData,
            lastParams,
            setCurrentModelData,
            setLastParams,
            resetModelData,
            getLastParams,
        };

        return (
            <Context.Provider value={contextValue}>
                {children}
            </Context.Provider>
        );
    };

    const useBaseModel = () => {
        const context = useContext(Context);
        if (context === undefined) {
            throw new Error(
                "useBaseModel must be used within the corresponding Provider"
            );
        }
        return context;
    };

    return { Provider, useBaseModel };
}
