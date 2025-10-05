import type { ModelOption } from "@/types/parameters";
import type { Condition, Parameters } from "@/types/story";

function parameterCheck(expected: any, actual: any, comparator: string) {
    switch (comparator) {
        case "=":
            return actual == expected;
        case ">":
            return actual > expected;
        case ">=":
            return actual >= expected;
        case "<":
            return actual <= expected;
        case "<=":
            return actual <= expected;
        default:
            return false;
    }
}

export function isConditionMet(
    condition: Condition,
    state: Record<string, Parameters>
): boolean {
    switch (condition.condition_type) {
        case "Bypass":
            return true;

        case "Parameter":
            const paramValue = state[condition.category]?.[condition.parameter];
            return (
                paramValue != null &&
                parameterCheck(
                    condition.value,
                    paramValue,
                    condition.comparator
                )
            );

        case "Wait":
            // TODO: implement
            return true;

        case "Button":
            // TODO: implement
            return true;

        case "Lambda":
            // TODO: implement
            return true;

        case "And":
            return condition.conditions.every((c) => isConditionMet(c, state));

        case "Or":
            return condition.conditions.some((c) => isConditionMet(c, state));

        default:
            const exhaustiveCheck: never = condition;
            throw new Error(`Unknown condition type: ${exhaustiveCheck}`);
    }
}

export function displayCondition(condition: Condition): string {
    switch (condition.condition_type) {
        case "Bypass":
            return "Continue.";

        case "Parameter":
            return `Set ${condition.parameter} ${condition.comparator} ${condition.value}`;

        case "Wait":
            return `Wait ${condition.wait}`;

        case "Button":
            return `Click on ${condition.button_id}`;

        case "Lambda":
            return `Satisfy ${condition.exec_str}`;

        case "And":
            return condition.conditions
                .map((c) => displayCondition(c))
                .join(" AND \n");

        case "Or":
            return condition.conditions
                .map((c) => displayCondition(c))
                .join(" OR \n");

        default:
            const exhaustiveCheck: never = condition;
            throw new Error(`Unknown condition type: ${exhaustiveCheck}`);
    }
}

function retrieveWhitelistParameters(
    response: ModelOption[],
    whitelist?: string[]
) {
    if (!whitelist) return response;
    return response.filter((m) => whitelist.includes(m.name));
}

function retrieveBlacklistParameters(
    response: ModelOption[],
    blacklist?: string[]
) {
    if (!blacklist) return response;
    return response.filter((m) => !blacklist.includes(m.name));
}

export function filterParameters(
    response: ModelOption[],
    parameters?: Record<string, string[]>
) {
    if (!parameters) return response;
    return retrieveBlacklistParameters(
        retrieveWhitelistParameters(response, parameters.whitelist),
        parameters.blacklist
    );
}
