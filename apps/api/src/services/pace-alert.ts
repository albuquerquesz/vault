import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import type { CategoryLimitStatus } from "./category-limits.js";
import { normalizeText } from "./transaction-search.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const ZONE = "America/Sao_Paulo";

/** The pace rule needs a few days of data before a projection means anything. */
export const MIN_DAYS_FOR_PACE_ALERT = 5;

/** Share of a category limit (in percent) that raises an alert, lowest first. */
export const CATEGORY_ALERT_THRESHOLDS = [80, 100] as const;

/** Quiet hours in Brasília: no push from 22:00 up to (not including) 08:00. */
export const QUIET_HOURS_START = 22;
export const QUIET_HOURS_END = 8;

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Linear pace: what was spent so far, divided by the days elapsed, times the days of the month. */
export function projectMonthEndSpend(params: {
	spent: number;
	daysElapsed: number;
	daysInMonth: number;
}): number {
	const { spent, daysElapsed, daysInMonth } = params;
	const safeSpent = Number.isFinite(spent) ? Math.max(spent, 0) : 0;
	if (!(daysElapsed > 0) || !(daysInMonth > 0)) return round2(safeSpent);
	return round2((safeSpent / Math.min(daysElapsed, daysInMonth)) * daysInMonth);
}

/** Alerts from the 5th day of the month on, when the projection goes over the ceiling. */
export function shouldAlertPace(params: {
	projected: number;
	target: number | null;
	daysElapsed: number;
}): boolean {
	const { projected, target, daysElapsed } = params;
	if (target === null || !(target > 0)) return false;
	if (daysElapsed < MIN_DAYS_FOR_PACE_ALERT) return false;
	return projected > target;
}

/** Calendar facts of "now" in Brasília: the day, the month and how far into it we are. */
export function paceClock(now = dayjs()) {
	const local = now.tz(ZONE);
	return {
		today: local.format("YYYY-MM-DD"),
		month: local.format("YYYY-MM"),
		daysElapsed: local.date(),
		daysInMonth: local.daysInMonth(),
		hour: local.hour(),
	};
}

/** True between 22:00 and 07:59 in Brasília (the window crosses midnight). */
export function isQuietHours(now = dayjs()): boolean {
	const { hour } = paceClock(now);
	return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

export type CategoryAlert = {
	category: string;
	categoryKey: string;
	/** The threshold the alert is about: 80 or 100. */
	threshold: number;
	percentUsed: number;
	/** Every unsent threshold already crossed; all are recorded when this alert goes out. */
	mark: number[];
};

/**
 * Category alerts still owed. A category that jumped past 100% without a 80%
 * alert gets one alert (for 100) that records both, so nothing repeats later.
 * `sent` holds `${categoryKey}:${threshold}` entries already delivered this month.
 */
export function pendingCategoryAlerts(params: {
	limits: CategoryLimitStatus[];
	sent: Set<string>;
}): CategoryAlert[] {
	const alerts: CategoryAlert[] = [];
	for (const limit of params.limits) {
		if (!(limit.targetAmount > 0)) continue;
		const categoryKey = normalizeText(limit.category);
		const unsent = CATEGORY_ALERT_THRESHOLDS.filter(
			(threshold) =>
				limit.percentUsed >= threshold &&
				!params.sent.has(`${categoryKey}:${threshold}`),
		);
		if (unsent.length === 0) continue;
		alerts.push({
			category: limit.category,
			categoryKey,
			threshold: Math.max(...unsent),
			percentUsed: limit.percentUsed,
			mark: [...unsent],
		});
	}
	return alerts;
}

function money(amount: number) {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(amount);
}

export type PaceProjection = {
	projected: number;
	target: number;
};

/** Short notification text in Portuguese; everything due today goes in one push. */
export function buildPaceAlertMessage(params: {
	pace: PaceProjection | null;
	categories: CategoryAlert[];
}): { title: string; body: string } {
	const lines: string[] = [];
	if (params.pace) {
		const over = round2(params.pace.projected - params.pace.target);
		lines.push(
			`Nesse ritmo você gasta ${money(params.pace.projected)} no mês, ${money(over)} acima do teto de ${money(params.pace.target)}.`,
		);
	}
	for (const alert of params.categories) {
		lines.push(
			alert.threshold >= 100
				? `${alert.category} passou do limite do mês.`
				: `${alert.category} chegou a 80% do limite do mês.`,
		);
	}
	return {
		title: params.pace ? "Seu gasto está no ritmo de estourar o teto" : "Limite de categoria",
		body: lines.join(" "),
	};
}
