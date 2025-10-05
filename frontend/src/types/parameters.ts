export interface BaseOption {
    name: string;
    description: string;
    default: any;
}

export interface SelectOption extends BaseOption {
    type: "select";
    options: string[];
}

export interface IntOption extends BaseOption {
    type: "int";
    min?: number;
    max?: number;
}

export interface NumberOption extends BaseOption {
    type: "number";
    min?: number;
    max?: number;
    step?: number;
}

export interface FloatOption extends BaseOption {
    type: "float";
    min?: number;
    max?: number;
    step?: number;
}

export interface AnyOption extends BaseOption {
    type: "any";
}

export interface HybridOption extends BaseOption {
    type: "select";
    options: string[];
    allowCustom?: boolean; // For parameters that accept both select AND numeric
}

export type ModelOption =
    | SelectOption
    | IntOption
    | NumberOption
    | FloatOption
    | AnyOption
    | HybridOption;
