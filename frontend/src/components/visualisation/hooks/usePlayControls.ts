// Reusable hook for play/pause/step animation controls

import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayControlState } from "../types";

interface UsePlayControlsOptions {
    maxSteps: number;
    stepDuration?: number;
    autoPlay?: boolean;
    onStepChange?: (step: number) => void;
    onPlayStateChange?: (isPlaying: boolean) => void;
    preserveStepOnDataChange?: boolean;
    interpolationSteps?: number;
}

export const usePlayControls = ({
    maxSteps,
    stepDuration = 1000,
    autoPlay = false,
    onStepChange,
    onPlayStateChange,
    preserveStepOnDataChange = false,
    interpolationSteps = 20,
}: UsePlayControlsOptions): PlayControlState => {
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [currentStep, setCurrentStepState] = useState(0);

    const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentStepRef = useRef(currentStep);

    // Keep ref in sync for use in callbacks
    useEffect(() => {
        currentStepRef.current = currentStep;
    }, [currentStep]);

    // Call external handler when step changes
    useEffect(() => {
        onStepChange?.(currentStep);
    }, [currentStep, onStepChange]);

    // Call external handler when play state changes
    useEffect(() => {
        onPlayStateChange?.(isPlaying);
    }, [isPlaying, onPlayStateChange]);

    const startPlaying = useCallback(() => {
        if (currentStepRef.current >= maxSteps) return;

        setIsPlaying(true);

        playIntervalRef.current = setInterval(() => {
            const currentValue = currentStepRef.current;
            const stepIncrement = 1 / interpolationSteps;
            const nextStep = currentValue + stepIncrement;

            if (nextStep >= maxSteps) {
                setIsPlaying(false);
                setCurrentStepState(maxSteps);
                if (playIntervalRef.current) {
                    clearInterval(playIntervalRef.current);
                    playIntervalRef.current = null;
                }
            } else {
                setCurrentStepState(nextStep);
            }
        }, stepDuration / interpolationSteps); // Faster intervals for smoother animation
    }, [maxSteps, stepDuration, interpolationSteps]);

    const stopPlaying = useCallback(() => {
        setIsPlaying(false);
        if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
        }
    }, []);

    const resetToStart = useCallback(() => {
        stopPlaying();
        setCurrentStepState(0);
    }, [stopPlaying]);

    const setCurrentStep = useCallback(
        (step: number) => {
            const clampedStep = Math.max(0, Math.min(step, maxSteps));

            stopPlaying();
            setCurrentStepState(clampedStep);
        },
        [maxSteps, stopPlaying]
    );

    // Auto-stop when reaching max step
    useEffect(() => {
        if (currentStep >= maxSteps && isPlaying) {
            stopPlaying();
        }
    }, [currentStep, maxSteps, isPlaying, stopPlaying]);

    useEffect(() => {
        if (!preserveStepOnDataChange) {
            resetToStart();
        } else {
            stopPlaying();
            // Use the ref to get current step without adding to dependencies
            if (currentStepRef.current >= maxSteps) {
                setCurrentStepState(Math.max(0, maxSteps - 1));
            }
        }
    }, [maxSteps, resetToStart, stopPlaying, preserveStepOnDataChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        };
    }, []);

    // Auto-start if requested
    useEffect(() => {
        if (autoPlay && currentStep === 0) {
            startPlaying();
        }
    }, [autoPlay, currentStep, startPlaying]);

    return {
        isPlaying,
        currentStep,
        maxSteps,
        startPlaying,
        stopPlaying,
        resetToStart,
        setCurrentStep,
    };
};
