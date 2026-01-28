export type SelectOption = {
    name: string;
    type: string;
    options: string[];
    default: string;
};

export type NumberInputOption = {
    name: string;
    type: string;
    default: number | null;
    step: number;
};

export type ModelOption = SelectOption | NumberInputOption;
