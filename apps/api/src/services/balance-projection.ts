import { addMonthsClamped } from "./credit-cards.js";
import { MIN_DAYS_FOR_PACE_ALERT, projectMonthEndSpend } from "./pace-alert.js";
import {
	dueDateFor,
	isActiveIn,
	type RecurringItemRow,
	type RecurringOccurrence,
} from "./recurring.js";

/**
 * Where a number comes from:
 * - `fact`: reported by the bank (closed card bills still unpaid);
 * - `registered`: typed in by the user (fixed bills, recurring income);
 * - `estimate`: inferred by the Vault (open bill, installments, spending averages).
 */
export type Certainty = "fact" | "registered" | "estimate";

export type EventKind =
	| "income"
	| "fixed_bill"
	| "closed_card_bill"
	| "open_card_bill"
	| "installments"
	| "card_spending"
	| "variable";

export const CERTAINTY: Record<EventKind, Certainty> = {
	income: "registered",
	fixed_bill: "registered",
	closed_card_bill: "fact",
	open_card_bill: "estimate",
	installments: "estimate",
	card_spending: "estimate",
	variable: "estimate",
};

export type ProjectionEvent = {
	date: string;
	kind: EventKind;
	label: string;
	/** Signed: positive is money in, negative is money out. */
	amount: number;
	certainty: Certainty;
};

export type ClosedBill = { dueDate: string; remaining: number; label: string };
export type OpenBill = {
	/** The estimated due date; null when the card never reported one. */
	dueDate: string | null;
	estimatedTotal: number;
	label: string;
};

export type ProjectionInput = {
	/** Sum of the bank accounts; null when no bank account reports a balance. */
	startBalance: number | null;
	/** `AAAA-MM-DD` in Brasília. */
	today: string;
	/** How many month-ends, the current month being the first. */
	months: number;
	recurringItems: RecurringItemRow[];
	/** The current month's occurrences: only the `expected` ones are still to happen. */
	currentOccurrences: RecurringOccurrence[];
	closedBills: ClosedBill[];
	openBills: OpenBill[];
	/** Remaining installments by posting month (`AAAA-MM`), from `projectUpcoming`. */
	installmentsByMonth: ReadonlyMap<string, number>;
	/** Monthly average of what leaves the bank account without a card (debit, Pix, cash). */
	bankVariableMonthly: number;
	/** What is still expected from the bank variable spending in the rest of the current month. */
	bankVariableCurrentRemaining: number;
	/** Monthly average of card purchases that are not installments or fixed bills. */
	cardVariableMonthly: number;
};

export type MonthProjection = {
	month: string;
	income: number;
	fixedBills: number;
	closedCardBills: number;
	openCardBill: number;
	installments: number;
	cardSpending: number;
	variable: number;
	outflow: number;
	net: number;
	endBalance: number;
	lowestBalance: number;
};

export type DayProjection = { date: string; balance: number };

export type ProjectionResult = {
	startBalance: number | null;
	months: MonthProjection[];
	days: DayProjection[];
	events: ProjectionEvent[];
	lowest: DayProjection | null;
	firstNegativeDate: string | null;
	firstNegativeMonth: string | null;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Card bills with no known date fall on this day of the month. */
const DEFAULT_CARD_DUE_DAY = 10;

function dayAfter(date: string): string {
	return new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000)
		.toISOString()
		.slice(0, 10);
}

function monthEnd(month: string): string {
	return dueDateFor(month, 31);
}

/** `today` and the days of the horizon, in order. */
function dateRange(from: string, to: string): string[] {
	const dates: string[] = [];
	for (let date = from; date <= to; date = dayAfter(date)) dates.push(date);
	return dates;
}

/** What is still to leave the bank account for variable spending in the rest of the current month. */
export function currentMonthVariableRemaining(params: {
	monthlyAverage: number;
	spentSoFar: number;
	daysElapsed: number;
	daysInMonth: number;
}): { amount: number; basis: "average" | "pace" } {
	const { monthlyAverage, spentSoFar, daysElapsed, daysInMonth: total } = params;
	const left = Math.max(total - daysElapsed, 0);
	const fromAverage = total > 0 ? (monthlyAverage * left) / total : 0;
	if (daysElapsed < MIN_DAYS_FOR_PACE_ALERT) {
		return { amount: round2(fromAverage), basis: "average" };
	}
	// Same linear pace as the pace alert (spec 08), counting what is still to come.
	const fromPace = Math.max(
		projectMonthEndSpend({ spent: spentSoFar, daysElapsed, daysInMonth: total }) -
			Math.max(spentSoFar, 0),
		0,
	);
	return fromPace > fromAverage
		? { amount: round2(fromPace), basis: "pace" }
		: { amount: round2(fromAverage), basis: "average" };
}

/** The average of the closed months that have data; zero when there are none. */
export function averageVariable(
	months: { bank: number; card: number; hasData: boolean }[],
): { bank: number; card: number; monthsUsed: number } {
	const used = months.filter((entry) => entry.hasData);
	if (used.length === 0) return { bank: 0, card: 0, monthsUsed: 0 };
	return {
		bank: round2(used.reduce((total, entry) => total + entry.bank, 0) / used.length),
		card: round2(used.reduce((total, entry) => total + entry.card, 0) / used.length),
		monthsUsed: used.length,
	};
}

export function horizonMonths(today: string, months: number): string[] {
	const first = today.slice(0, 7);
	return Array.from({ length: months }, (_, index) =>
		addMonthsClamped(`${first}-01`, index).slice(0, 7),
	);
}

/**
 * Builds the dated money movements of the horizon. Dates in the past (a pending
 * item already late, an estimate that fell behind) move to tomorrow: the balance
 * is as of now, so anything still to happen happens from tomorrow on.
 */
export function buildEvents(input: ProjectionInput): ProjectionEvent[] {
	const { today } = input;
	const tomorrow = dayAfter(today);
	const current = today.slice(0, 7);
	const list = horizonMonths(today, input.months);
	const last = monthEnd(list[list.length - 1] ?? current);
	const events: ProjectionEvent[] = [];
	const push = (
		date: string,
		kind: EventKind,
		label: string,
		amount: number,
		sign: 1 | -1,
	) => {
		// Daily spending keeps its fraction so the month adds up to the exact total.
		const value = kind === "variable" ? amount : round2(amount);
		if (!(value > 0.000001)) return;
		const when = date < tomorrow ? tomorrow : date;
		if (when > last) return;
		events.push({ date: when, kind, label, amount: sign * value, certainty: CERTAINTY[kind] });
	};

	// Fixed bills and recurring income: the current month only has what is pending.
	for (const month of list) {
		const occurrences =
			month === current
				? input.currentOccurrences.filter((o) => o.status === "expected")
				: input.recurringItems
						.filter((item) => isActiveIn(item, month))
						.map((item) => ({ ...item, dueDate: dueDateFor(month, item.dayOfMonth) }));
		for (const item of occurrences)
			push(
				item.dueDate,
				item.kind === "income" ? "income" : "fixed_bill",
				item.name,
				item.amount,
				item.kind === "income" ? 1 : -1,
			);
	}

	// Card bills. A card's due day is the one its bills already show.
	const knownDay = [...input.openBills.map((b) => b.dueDate), ...input.closedBills.map((b) => b.dueDate)]
		.find((date): date is string => typeof date === "string");
	const cardDay = knownDay ? Number(knownDay.slice(8, 10)) : DEFAULT_CARD_DUE_DAY;
	const openDue = (bill: OpenBill) => bill.dueDate ?? addMonthsClamped(today, 1);

	for (const month of list) {
		const closed = input.closedBills.filter((bill) => bill.dueDate.slice(0, 7) === month);
		for (const bill of closed) push(bill.dueDate, "closed_card_bill", bill.label, bill.remaining, -1);
		if (month === current) {
			// What is bought this month goes to a bill that is due later.
			for (const bill of input.openBills.filter((b) => openDue(b).slice(0, 7) === month))
				push(openDue(bill), "open_card_bill", bill.label, bill.estimatedTotal, -1);
			continue;
		}
		const base = round2(
			input.cardVariableMonthly + (input.installmentsByMonth.get(month) ?? 0),
		);
		const open = input.openBills.filter((b) => openDue(b).slice(0, 7) === month);
		const date = dueDateFor(month, cardDay);
		if (open.length > 0) {
			// The bill is still filling up: take the larger of what it holds and the usual card month.
			const estimated = open.reduce((total, bill) => total + bill.estimatedTotal, 0);
			push(openDue(open[0] as OpenBill), "open_card_bill", "Fatura em aberto (estimada)", Math.max(estimated, base), -1);
		} else if (closed.length === 0) {
			push(date, "card_spending", "Compras no cartão (média)", input.cardVariableMonthly, -1);
			push(date, "installments", "Parcelas de cartão", input.installmentsByMonth.get(month) ?? 0, -1);
		}
	}

	// Variable spending leaves the account a little every day.
	for (const month of list) {
		const dates = dateRange(month === current ? tomorrow : `${month}-01`, monthEnd(month));
		if (dates.length === 0) continue;
		const total = month === current ? input.bankVariableCurrentRemaining : input.bankVariableMonthly;
		for (const date of dates) push(date, "variable", "Gasto variável (média)", total / dates.length, -1);
	}

	return events.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
}

/**
 * The balance of the bank accounts day by day, and summed by month. Pure: every
 * input is loaded by the caller. Not a forecast, it adds up what is known (bank
 * bills), what the user registered and a few estimates, each marked as such.
 */
export function projectBalance(input: ProjectionInput): ProjectionResult {
	const list = horizonMonths(input.today, input.months);
	if (input.startBalance === null) {
		return { startBalance: null, months: [], days: [], events: [], lowest: null, firstNegativeDate: null, firstNegativeMonth: null };
	}
	const events = buildEvents(input);
	const byDate = new Map<string, number>();
	for (const event of events) byDate.set(event.date, (byDate.get(event.date) ?? 0) + event.amount);

	const days: DayProjection[] = [{ date: input.today, balance: round2(input.startBalance) }];
	let balance = input.startBalance;
	const end = monthEnd(list[list.length - 1] ?? input.today.slice(0, 7));
	for (const date of dateRange(dayAfter(input.today), end)) {
		balance += byDate.get(date) ?? 0;
		days.push({ date, balance: round2(balance) });
	}

	let opening = round2(input.startBalance);
	const months = list.map<MonthProjection>((month) => {
		const mine = events.filter((event) => event.date.slice(0, 7) === month);
		const sum = (kind: EventKind) =>
			round2(mine.filter((event) => event.kind === kind).reduce((total, event) => total + Math.abs(event.amount), 0));
		const monthDays = days.filter((day) => day.date.slice(0, 7) === month);
		const endBalance = monthDays[monthDays.length - 1]?.balance ?? opening;
		const income = sum("income");
		const outflow = round2(
			sum("fixed_bill") + sum("closed_card_bill") + sum("open_card_bill") + sum("installments") + sum("card_spending") + sum("variable"),
		);
		const entry: MonthProjection = {
			month,
			income,
			fixedBills: sum("fixed_bill"),
			closedCardBills: sum("closed_card_bill"),
			openCardBill: sum("open_card_bill"),
			installments: sum("installments"),
			cardSpending: sum("card_spending"),
			variable: sum("variable"),
			outflow,
			net: round2(income - outflow),
			endBalance,
			lowestBalance: Math.min(opening, ...monthDays.map((day) => day.balance)),
		};
		opening = endBalance;
		return entry;
	});

	const lowest = days.reduce<DayProjection | null>((min, day) => (min === null || day.balance < min.balance ? day : min), null);
	const firstNegative = days.find((day) => day.balance < 0) ?? null;
	return {
		startBalance: round2(input.startBalance),
		months,
		days,
		events,
		lowest,
		firstNegativeDate: firstNegative?.date ?? null,
		firstNegativeMonth: firstNegative?.date.slice(0, 7) ?? null,
	};
}

export type Assumption = {
	code: string;
	kind: Certainty | "warning";
	text: string;
};

export type AssumptionContext = {
	hasBankBalance: boolean;
	historyMonths: number;
	hasRecurringIncome: boolean;
	hasRecurringBills: boolean;
	hasCards: boolean;
	openBillWithoutDate: boolean;
	paceUsed: boolean;
	hasInstallments: boolean;
};

/** The list the user reads to agree or disagree with the number. */
export function buildAssumptions(context: AssumptionContext): Assumption[] {
	if (!context.hasBankBalance) {
		return [
			{
				code: "NO_BANK_ACCOUNT",
				kind: "warning",
				text: "Nenhuma conta bancária conectada com saldo: conecte um banco para ver a projeção.",
			},
		];
	}
	const list: Assumption[] = [
		{ code: "START_BALANCE", kind: "fact", text: "O ponto de partida é a soma do saldo das contas bancárias (cartões não entram)." },
		context.hasRecurringIncome
			? { code: "INCOME_RECURRING", kind: "registered", text: "A renda esperada vem só das receitas recorrentes cadastradas; renda avulsa (como a da empresa) que não esteja cadastrada não entra." }
			: { code: "NO_INCOME", kind: "warning", text: "Nenhuma receita recorrente cadastrada: a projeção não conta com entrada de dinheiro e tende a ficar pessimista. Cadastre salário e retiradas da empresa em contas fixas e recorrentes." },
		context.hasRecurringBills
			? { code: "FIXED_BILLS", kind: "registered", text: "As contas fixas cadastradas entram no dia do vencimento; as do mês corrente que já aparecem como pagas ficam de fora." }
			: { code: "NO_FIXED_BILLS", kind: "warning", text: "Nenhuma conta fixa cadastrada: aluguel e boletos que não passam pelo cartão não entram, e a projeção tende a ficar otimista." },
		{ code: "CLOSED_BILLS", kind: "fact", text: "Faturas de cartão já fechadas entram pelo valor ainda não pago, no vencimento informado pelo banco." },
	];
	if (context.hasCards) {
		list.push({
			code: "OPEN_BILL",
			kind: "estimate",
			text: context.openBillWithoutDate
				? "A fatura em aberto é uma estimativa (compras ainda não faturadas); o banco não informa o vencimento, então ela cai um mês à frente."
				: "A fatura em aberto é uma estimativa: compras ainda não faturadas, no vencimento da última fatura somado a um mês. Ela cresce até fechar.",
		});
		list.push({
			code: "CARD_MONTHS",
			kind: "estimate",
			text: "Nos meses sem fatura conhecida, o cartão entra pela média de compras dos últimos meses fechados mais as parcelas que ainda faltam, no dia de vencimento mais recente.",
		});
	}
	if (context.hasInstallments)
		list.push({ code: "INSTALLMENTS", kind: "estimate", text: "As parcelas são inferidas das compras parceladas em andamento e contadas no mês em que a parcela lança, sem atraso até o vencimento da fatura." });
	list.push(
		context.historyMonths === 0
			? { code: "NO_HISTORY", kind: "warning", text: "Sem histórico de meses fechados: o gasto variável futuro é zero e a projeção tende a ficar otimista." }
			: context.historyMonths < 3
				? { code: "SHORT_HISTORY", kind: "warning", text: `Só ${context.historyMonths} mês(es) fechado(s) de histórico: a média de gasto variável usa o que há.` }
				: { code: "VARIABLE_AVERAGE", kind: "estimate", text: "O gasto variável futuro é a média dos 3 últimos meses fechados, sem contar contas fixas cadastradas nem parcelas, e sai da conta um pouco por dia." },
	);
	if (context.paceUsed)
		list.push({ code: "PACE", kind: "estimate", text: "No mês corrente, o gasto variável que falta usa o ritmo de gasto do mês quando ele passa da média." });
	list.push({ code: "NOT_COVERED", kind: "warning", text: "Fora da conta: rendimento, inflação, reajustes, gastos únicos futuros e financiamentos." });
	return list;
}
