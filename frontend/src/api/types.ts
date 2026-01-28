import type { components } from "@/types/api";

export type ParameterInfo =
    | components["schemas"]["SelectParameterInfo"]
    | components["schemas"]["IntParameterInfo"]
    | components["schemas"]["NumberParameterInfo"]
    | components["schemas"]["FloatParameterInfo"]
    | components["schemas"]["AnyParameterInfo"];
