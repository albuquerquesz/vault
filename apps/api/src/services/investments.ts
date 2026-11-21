import { and, eq, notInArray } from "drizzle-orm";
import {
	isInvestmentsUnavailableError,
	PluggyApiError,
} from "../clients/pluggy/index.js";
import type { PluggyInvestment } from "../clients/pluggy/types.js";
import { db } from "../db/index.js";
import {
	investmentSnapshots,
	pluggyInvestments,
} from "../db/schema/index.js";
import { todayInSaoPaulo } from "./subscriptions.js";

const round2 = (value: number) => Math.round(value * 100) / 100;

export const INVESTMENT_TYPE_LABELS: Record<string, string> = {
	FIXED_INCOME: "Renda fixa",
	EQUITY: "Ações e FIIs",
	ETF: "ETFs",
	MUTUAL_FUND: "Fundos",
	SECURITY: "Previdência",
	COE: "COE",
	OTHER: "Outros",
};

export type InvestmentRow = {
	id: string;
	name: string;
	type: string;
	subtype: string | null;
	institution: string | null;
	amountInvested: number | null;
	balance: number;
	currency: string;
	status: string | null;
	date: string | null;
};

export type PortfolioPosition = InvestmentRow & {
	/** balance minus amountInvested; null when the provider gave no invested amount. */
	returnAmount: number | null;
	/** returnAmount / amountInvested, as a percentage; null without a basis. */
	returnPercent: number | null;
	/** Share of the BRL portfolio balance, as a percentage. */
	percent: number | null;
};

export type PortfolioSummary = {
	/** Sum of the balance of open positions in BRL. */
	totalBalance: number;
	/** Invested amount of the positions that report one. */
	totalInvested: number;
	/** Balance of those same positions (the basis of the return). */
	balanceWithBasis: number;
	returnAmount: number | null;
	returnPercent: number | null;
	byType: {
		type: string;
		label: string;
		balance: number;
		percent: number;
		count: number;
	}[];
	positions: PortfolioPosition[];
	/** Positions left out of the totals because they are not in BRL. */
	otherCurrencyCount: number;
	/** Positions fully redeemed (TOTAL_WITHDRAWAL), not counted nor listed. */
	redeemedCount: number;
};

/** Return % = (balance - invested) / invested; zero or missing basis gives null. */
export function computeReturn(
	balance: number,
	invested: number | null,
): { amount: number; percent: number } | null {
	if (invested === null || !(invested > 0)) return null;
	const amount = round2(balance - invested);
	return { amount, percent: round2((amount / invested) * 100) };
}

/** Pure: totals by type, allocation and return of the portfolio. Zero rows = empty portfolio. */
export function summarizePortfolio(rows: InvestmentRow[]): PortfolioSummary {
	const redeemedCount = rows.filter((row) => row.status === "TOTAL_WITHDRAWAL").length;
	const open = rows.filter((row) => row.status !== "TOTAL_WITHDRAWAL");
	const brl = open.filter((row) => row.currency === "BRL");
	const totalBalance = round2(brl.reduce((sum, row) => sum + row.balance, 0));

	const withBasis = brl.filter((row) => row.amountInvested !== null && row.amountInvested > 0);
	const totalInvested = round2(withBasis.reduce((sum, row) => sum + (row.amountInvested ?? 0), 0));
	const balanceWithBasis = round2(withBasis.reduce((sum, row) => sum + row.balance, 0));
	const portfolioReturn = computeReturn(balanceWithBasis, totalInvested);

	const types = new Map<string, { balance: number; count: number }>();
	for (const row of brl) {
		const entry = types.get(row.type) ?? { balance: 0, count: 0 };
		entry.balance += row.balance;
		entry.count += 1;
		types.set(row.type, entry);
	}
	const pct = (value: number) => (totalBalance > 0 ? round2((value / totalBalance) * 100) : 0);
	const byType = [...types]
		.map(([type, entry]) => ({
			type,
			label: INVESTMENT_TYPE_LABELS[type] ?? type,
			balance: round2(entry.balance),
			percent: pct(entry.balance),
			count: entry.count,
		}))
		.sort((a, b) => b.balance - a.balance);

	const positions = open
		.map((row): PortfolioPosition => {
			const result = computeReturn(row.balance, row.amountInvested);
			return {
				...row,
				returnAmount: result?.amount ?? null,
				returnPercent: result?.percent ?? null,
				percent: row.currency === "BRL" ? pct(row.balance) : null,
			};
		})
		.sort((a, b) => b.balance - a.balance);

	return {
		totalBalance,
		totalInvested,
		balanceWithBasis,
		returnAmount: portfolioReturn?.amount ?? null,
		returnPercent: portfolioReturn?.percent ?? null,
		byType,
		positions,
		otherCurrencyCount: open.length - brl.length,
		redeemedCount,
	};
}

export async function listInvestmentRows(userId: string): Promise<InvestmentRow[]> {
	const rows = await db
		.select()
		.from(pluggyInvestments)
		.where(eq(pluggyInvestments.userId, userId));
	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		type: row.type,
		subtype: row.subtype,
		institution: row.institution,
		amountInvested: row.amountInvested === null ? null : Number(row.amountInvested),
		balance: Number(row.balance),
		currency: row.currency,
		status: row.status,
		date: row.date ? row.date.toISOString() : null,
	}));
}

export async function getPortfolio(userId: string): Promise<PortfolioSummary> {
	return summarizePortfolio(await listInvestmentRows(userId));
}

export async function listInvestmentHistory(userId: string) {
	const rows = await db
		.select()
		.from(investmentSnapshots)
		.where(eq(investmentSnapshots.userId, userId));
	return rows
		.map((row) => ({ month: row.month, totalBalance: Number(row.totalBalance) }))
		.sort((a, b) => a.month.localeCompare(b.month));
}

/** Writes (or rewrites) this month's total; skipped when the user has no investments at all. */
export async function recordInvestmentSnapshot(userId: string, month = todayInSaoPaulo().slice(0, 7)) {
	const rows = await listInvestmentRows(userId);
	if (rows.length === 0) return null;
	const totalBalance = summarizePortfolio(rows).totalBalance;
	await db
		.insert(investmentSnapshots)
		.values({ userId, month, totalBalance: String(totalBalance) })
		.onConflictDoUpdate({
			target: [investmentSnapshots.userId, investmentSnapshots.month],
			set: { totalBalance: String(totalBalance), updatedAt: new Date() },
		});
	return { month, totalBalance };
}

export type InvestmentsPhaseResult = {
	total: number;
	synced: number;
	status: "success" | "failed" | "skipped";
	error?: string;
};

/**
 * Stores the positions Pluggy reports for one item.
 *
 * Never throws: it runs after the transaction sync and must not break it.
 * - Product not enabled / unavailable (403 etc.): skipped, nothing touched.
 * - Empty answer: existing rows are kept (an expired MeuPluggy consent also
 *   reads as empty; a fully redeemed position comes back as TOTAL_WITHDRAWAL).
 * - Otherwise rows are upserted by (item, pluggy id) and positions Pluggy no
 *   longer returns are removed.
 */
export async function syncInvestmentsForItem(params: {
	service: { listInvestments: (itemId: string) => Promise<PluggyInvestment[]> };
	userId: string;
	localItemId: string;
	pluggyItemId: string;
}): Promise<InvestmentsPhaseResult> {
	const { service, userId, localItemId, pluggyItemId } = params;
	try {
		const investments = await service.listInvestments(pluggyItemId);
		if (investments.length === 0) {
			return { total: 0, synced: 0, status: "success" };
		}
		const unique = [...new Map(investments.map((i) => [i.id, i])).values()];
		const now = new Date();
		await db.transaction(async (tx) => {
			for (const investment of unique) {
				const values = {
					userId,
					itemId: localItemId,
					pluggyInvestmentId: investment.id,
					name: investment.name,
					type: investment.type,
					subtype: investment.subtype,
					institution: investment.institution,
					amountInvested:
						investment.amountInvested === null ? null : String(investment.amountInvested),
					balance: String(investment.balance),
					amountProfit:
						investment.amountProfit === null ? null : String(investment.amountProfit),
					currency: investment.currency,
					status: investment.status,
					date: investment.date ? new Date(investment.date) : null,
					lastUpdatedAt: now,
				};
				await tx
					.insert(pluggyInvestments)
					.values(values)
					.onConflictDoUpdate({
						target: [pluggyInvestments.itemId, pluggyInvestments.pluggyInvestmentId],
						set: values,
					});
			}
			await tx
				.delete(pluggyInvestments)
				.where(
					and(
						eq(pluggyInvestments.itemId, localItemId),
						notInArray(
							pluggyInvestments.pluggyInvestmentId,
							unique.map((i) => i.id),
						),
					),
				);
		});
		await recordInvestmentSnapshot(userId);
		return { total: unique.length, synced: unique.length, status: "success" };
	} catch (error) {
		if (isInvestmentsUnavailableError(error)) {
			return {
				total: 0,
				synced: 0,
				status: "skipped",
				error: "Produto INVESTMENTS não habilitado na Pluggy (ou não oferecido pelo conector).",
			};
		}
		const message =
			error instanceof PluggyApiError || error instanceof Error
				? error.message
				: "Falha ao sincronizar investimentos da Pluggy.";
		console.warn("[pluggy] investments sync failed", { userId, localItemId, error: message });
		return { total: 0, synced: 0, status: "failed", error: message };
	}
}

