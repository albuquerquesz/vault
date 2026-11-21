import { normalizeText } from "./transaction-search.js";

export type RuleMatchType = "contains" | "starts_with" | "equals";

export type CategoryRuleLike = {
	id: string;
	matchType: RuleMatchType;
	pattern: string;
	category: string;
	/** Lower number wins. */
	priority: number;
	enabled: boolean;
	createdAt?: Date;
};

/** Lowercase, accent-free, single-spaced: how names and descriptions are compared. */
export function normalizeLabel(value: string | null | undefined): string {
	return normalizeText(value).replace(/\s+/g, " ");
}

export function ruleMatches(
	rule: Pick<CategoryRuleLike, "matchType" | "pattern">,
	description: string | null | undefined,
): boolean {
	const pattern = normalizeLabel(rule.pattern);
	if (!pattern) return false;
	const text = normalizeLabel(description);
	switch (rule.matchType) {
		case "equals":
			return text === pattern;
		case "starts_with":
			return text.startsWith(pattern);
		default:
			return text.includes(pattern);
	}
}

/** Enabled rules in the order they are tried: priority, then oldest first. */
export function orderRules<T extends CategoryRuleLike>(rules: T[]): T[] {
	return rules
		.filter((rule) => rule.enabled)
		.sort(
			(a, b) =>
				a.priority - b.priority ||
				(a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) ||
				a.id.localeCompare(b.id),
		);
}

/** The first enabled rule (by priority) that matches the description. */
export function firstMatchingRule<T extends CategoryRuleLike>(
	rules: T[],
	description: string | null | undefined,
): T | undefined {
	return orderRules(rules).find((rule) => ruleMatches(rule, description));
}

/**
 * The category shown for a bank transaction: the user's manual choice, then the
 * first matching rule, then the bank's own category. Display only: what counts
 * as spending or income is decided from `original` in pluggy-classification.ts.
 */
export function resolveDisplayCategory(params: {
	override: string | null | undefined;
	original: string | null | undefined;
	description: string | null | undefined;
	rules: CategoryRuleLike[];
}): string {
	const manual = params.override?.trim();
	if (manual) return manual;
	const rule = firstMatchingRule(params.rules, params.description);
	if (rule) return rule.category;
	return params.original?.trim() || "Outros";
}
