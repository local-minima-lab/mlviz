import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { SelectOption } from "@/types/parameters";

interface SelectInputProps {
    option: SelectOption;
    currentValue: string | undefined;
    onValueChange: (key: string, value: string | undefined) => void;
    id: string;
}

const SelectInput = ({
    option,
    currentValue,
    onValueChange,
    id,
}: SelectInputProps) => {
    return (
        <Select
            value={currentValue || String(option.default)}
            onValueChange={(val: string) => onValueChange(option.name, val)}
        >
            <SelectTrigger
                id={id}
                className="w-full bg-gray-50"
            >
                <SelectValue placeholder={String(option.default)} />
            </SelectTrigger>
            <SelectContent>
                {option.options.map((optionValue: string) => (
                    <SelectItem
                        value={optionValue}
                        key={optionValue}
                    >
                        {optionValue}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default SelectInput;
