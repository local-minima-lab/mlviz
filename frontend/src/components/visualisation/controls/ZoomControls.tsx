// Reusable zoom controls component

import { ScanEye } from "lucide-react";
import React from "react";
import type { VisualisationColors, ZoomControlState } from "../types";

interface ZoomControlsProps {
    zoomControls: ZoomControlState;
    colors?: VisualisationColors;
    showResetButton?: boolean;
    compact?: boolean;
    className?: string;
    buttonStyle: string;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
    zoomControls,
    showResetButton = true,
    className = "",
    buttonStyle = "",
}) => {
    const { resetZoom } = zoomControls;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Zoom Reset Button */}
            {showResetButton && (
                <button
                    onClick={resetZoom}
                    title="Reset zoom"
                    className={`${buttonStyle}`}
                >
                    <ScanEye className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default ZoomControls;
