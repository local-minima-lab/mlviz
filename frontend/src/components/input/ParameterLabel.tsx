// components/ui/ParameterLabel.tsx
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ModelOption } from "@/types/parameters";
import { Info } from "lucide-react"; // or your preferred icon

interface ParameterLabelProps {
    option: ModelOption;
    htmlFor: string;
}

const ParameterLabel = ({ option, htmlFor }: ParameterLabelProps) => {
    return (
        <div className="flex flex-row gap-4 items-center">
            <Label
                className="text-clip"
                htmlFor={htmlFor}
            >
                {option.name}
            </Label>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info />
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs w-80">{option.doc}</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export default ParameterLabel;
