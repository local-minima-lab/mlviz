import AnyInput from "@/components/input/AnyInput";
import FloatInput from "@/components/input/FloatInput";
import IntegerInput from "@/components/input/IntegerInput";
import NumberInput from "@/components/input/NumberInput";
import ParameterLabel from "@/components/input/ParameterLabel";
import SelectInput from "@/components/input/SelectInput";
import type {
    AnyOption,
    FloatOption,
    IntOption,
    ModelOption,
    NumberOption,
    SelectOption,
} from "@/types/parameters";
import { useCallback } from "react";

interface ModelOptionWrapperProps<T extends Record<string, any>> {
    option: ModelOption;
    params: T;
    setParams: (newParams: T) => void;
}

const ModelOptionWrapper = <T extends Record<string, any>>({
    option,
    params,
    setParams,
}: ModelOptionWrapperProps<T>) => {
    const handleValueChange = useCallback(
        (key: string, value: any) => {
            setParams({
                ...params,
                [key]: value,
            });
        },
        [params, setParams]
    );

    const inputId = `input-${option.type}-${option.name}`;

    const renderInput = () => {
        switch (option.type) {
            case "select":
                return (
                    <SelectInput
                        option={option as SelectOption}
                        currentValue={params[option.name] as string | undefined}
                        onValueChange={handleValueChange}
                        id={inputId}
                    />
                );
            case "int":
                return (
                    <IntegerInput
                        option={option as IntOption}
                        currentValue={
                            params[option.name] as number | null | undefined
                        }
                        onValueChange={handleValueChange}
                        id={inputId}
                    />
                );
            case "number":
                return (
                    <NumberInput
                        option={option as NumberOption}
                        currentValue={
                            params[option.name] as string | number | undefined
                        }
                        onValueChange={handleValueChange}
                        id={inputId}
                    />
                );
            case "float":
                return (
                    <FloatInput
                        option={option as FloatOption}
                        currentValue={params[option.name] as number | undefined}
                        onValueChange={handleValueChange}
                        id={inputId}
                    />
                );
            case "any":
                return (
                    <AnyInput
                        option={option as AnyOption}
                        currentValue={params[option.name]}
                        onValueChange={handleValueChange}
                        id={inputId}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <ParameterLabel
                option={option}
                htmlFor={inputId}
            />
            {renderInput()}
        </div>
    );
};

export default ModelOptionWrapper;
