import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "./index";
import {
	account,
	expense,
	goal,
	monthlyBill,
	monthlyBillItem,
	monthlyBudget,
	pluggyItems,
	pluggyTransactions,
	savingsTarget,
	session,
	user,
	verification,
} from "./schema";

const seedUserId = "user_seed_main";
const seedSessionId = "session_seed_main";
const seedSessionToken = "seed-session-token-vault";
const seedAccountId = "account_seed_google";
const seedVerificationId = "verification_seed_email";

function formatMonth(date: Date) {
	return date.toISOString().slice(0, 7);
}

function shiftMonth(month: string, offset: number) {
	const [yearRaw, monthRaw] = month.split("-");
	const year = Number(yearRaw);
	const monthNumber = Number(monthRaw);

	if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) {
		throw new Error(`Invalid month value: ${month}`);
	}

	return formatMonth(new Date(Date.UTC(year, monthNumber - 1 + offset, 1)));
}

function monthDate(month: string, day: number) {
	return `${month}-${String(day).padStart(2, "0")}`;
}

function money(value: number) {
	return value.toFixed(2);
}

async function main() {
	const today = new Date();
	const currentMonth = formatMonth(today);
	const previousMonth = shiftMonth(currentMonth, -1);
	const twoMonthsAgo = shiftMonth(currentMonth, -2);

	const currentBillId = randomUUID();
	const previousBillId = randomUUID();
	const bankItemId = randomUUID();
	const cardItemId = randomUUID();

	await db.transaction(async (tx) => {
		await tx.execute(sql`
			TRUNCATE TABLE
				"monthly_bill_item",
				"monthly_bill",
				"pluggy_transactions",
				"pluggy_items",
				"expense",
				"goal",
				"savings_target",
				"monthly_budget",
				"session",
				"account",
				"verification",
				"user"
			RESTART IDENTITY CASCADE
		`);

		await tx.insert(user).values({
			id: seedUserId,
			name: "Va",
			email: "va@vault.local",
			emailVerified: true,
			image: "https://avatars.githubusercontent.com/u/25150863?v=4",
		});

		await tx.insert(account).values({
			id: seedAccountId,
			accountId: "google-oauth-001",
			providerId: "google",
			userId: seedUserId,
			accessToken: null,
			refreshToken: null,
			idToken: null,
			accessTokenExpiresAt: null,
			refreshTokenExpiresAt: null,
			scope: "openid email profile",
			password: null,
		});

		await tx.insert(session).values({
			id: seedSessionId,
			token: seedSessionToken,
			userId: seedUserId,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
			ipAddress: "127.0.0.1",
			userAgent: "Vault seed script",
		});

		await tx.insert(verification).values({
			id: seedVerificationId,
			identifier: "va@vault.local",
			value: "seed-verification-code",
			expiresAt: new Date(Date.now() + 1000 * 60 * 30),
		});

		await tx.insert(goal).values([
			{
				id: randomUUID(),
				userId: seedUserId,
				name: "Reserva de emergência",
				targetAmount: money(20000),
				currentAmount: money(8400),
				currency: "BRL",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				name: "Viagem Japão",
				targetAmount: money(18000),
				currentAmount: money(6300),
				currency: "BRL",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				name: "Setup de trabalho",
				targetAmount: money(12000),
				currentAmount: money(3200),
				currency: "BRL",
			},
		]);

		await tx.insert(monthlyBudget).values([
			{
				id: randomUUID(),
				userId: seedUserId,
				month: currentMonth,
				income: money(12000),
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				month: previousMonth,
				income: money(10800),
			},
		]);

		await tx.insert(savingsTarget).values([
			{
				id: randomUUID(),
				userId: seedUserId,
				month: currentMonth,
				savingsPercentage: money(20),
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				month: previousMonth,
				savingsPercentage: money(15),
			},
		]);

		await tx.insert(monthlyBill).values([
			{
				id: currentBillId,
				userId: seedUserId,
				month: currentMonth,
				totalBill: money(550),
			},
			{
				id: previousBillId,
				userId: seedUserId,
				month: previousMonth,
				totalBill: money(612.4),
			},
		]);

		await tx.insert(monthlyBillItem).values([
			{
				id: randomUUID(),
				monthlyBillId: currentBillId,
				name: "Gold",
				paidAmount: money(478.36),
				totalAmount: money(550),
				sortOrder: 1,
			},
			{
				id: randomUUID(),
				monthlyBillId: currentBillId,
				name: "Streaming",
				paidAmount: money(39.9),
				totalAmount: money(39.9),
				sortOrder: 2,
			},
			{
				id: randomUUID(),
				monthlyBillId: currentBillId,
				name: "Cloud",
				paidAmount: money(19.9),
				totalAmount: money(29.9),
				sortOrder: 3,
			},
			{
				id: randomUUID(),
				monthlyBillId: previousBillId,
				name: "Internet",
				paidAmount: money(119.9),
				totalAmount: money(119.9),
				sortOrder: 1,
			},
			{
				id: randomUUID(),
				monthlyBillId: previousBillId,
				name: "Telefone",
				paidAmount: money(42.5),
				totalAmount: money(55),
				sortOrder: 2,
			},
		]);

		await tx.insert(expense).values([
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(currentMonth, 1),
				amount: money(2400),
				category: "Moradia",
				note: "Aluguel",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(currentMonth, 2),
				amount: money(86.4),
				category: "Alimentação",
				note: "Mercado semanal",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(currentMonth, 2),
				amount: money(41.2),
				category: "Transporte",
				note: "Combustível",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(currentMonth, 3),
				amount: money(128.9),
				category: "Saúde",
				note: "Farmácia",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(currentMonth, 4),
				amount: money(76.5),
				category: "Lazer",
				note: "Cinema e lanche",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(currentMonth, 5),
				amount: money(34),
				category: "Outros",
				note: "Assinatura",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(currentMonth, 6),
				amount: money(92.8),
				category: "Alimentação",
				note: "Almoço fora",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(currentMonth, 7),
				amount: money(58.3),
				category: "Transporte",
				note: "Uber",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(currentMonth, 8),
				amount: money(210),
				category: "Moradia",
				note: "Mercado casa",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(currentMonth, 9),
				amount: money(64.9),
				category: "Lazer",
				note: "Streaming extra",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(previousMonth, 20),
				amount: money(980),
				category: "Moradia",
				note: "Condomínio",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(previousMonth, 21),
				amount: money(126.7),
				category: "Alimentação",
				note: "Supermercado",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(previousMonth, 23),
				amount: money(74.2),
				category: "Transporte",
				note: "Gasolina",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(previousMonth, 25),
				amount: money(189.9),
				category: "Saúde",
				note: "Exames",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(twoMonthsAgo, 18),
				amount: money(320),
				category: "Moradia",
				note: "Internet",
			},
			{
				id: randomUUID(),
				userId: seedUserId,
				expenseDate: monthDate(twoMonthsAgo, 19),
				amount: money(88.5),
				category: "Alimentação",
				note: "Restaurante",
			},
		]);

		await tx.insert(pluggyItems).values([
			{
				id: bankItemId,
				userId: seedUserId,
				pluggyItemId: "pluggy-item-bank-001",
				provider: "nubank",
				status: "active",
			},
			{
				id: cardItemId,
				userId: seedUserId,
				pluggyItemId: "pluggy-item-card-001",
				provider: "inter",
				status: "active",
			},
		]);

		await tx.insert(pluggyTransactions).values([
			{
				id: randomUUID(),
				pluggyItemId: bankItemId,
				pluggyTransactionId: "tx-bank-001",
				date: monthDate(currentMonth, 1),
				amount: money(-2400),
				description: "Aluguel",
				category: "Moradia",
			},
			{
				id: randomUUID(),
				pluggyItemId: bankItemId,
				pluggyTransactionId: "tx-bank-002",
				date: monthDate(currentMonth, 2),
				amount: money(-86.4),
				description: "Mercado",
				category: "Alimentação",
			},
			{
				id: randomUUID(),
				pluggyItemId: bankItemId,
				pluggyTransactionId: "tx-bank-003",
				date: monthDate(currentMonth, 3),
				amount: money(-41.2),
				description: "Combustível",
				category: "Transporte",
			},
			{
				id: randomUUID(),
				pluggyItemId: bankItemId,
				pluggyTransactionId: "tx-bank-004",
				date: monthDate(currentMonth, 4),
				amount: money(-128.9),
				description: "Farmácia",
				category: "Saúde",
			},
			{
				id: randomUUID(),
				pluggyItemId: bankItemId,
				pluggyTransactionId: "tx-bank-005",
				date: monthDate(currentMonth, 5),
				amount: money(-76.5),
				description: "Cinema",
				category: "Lazer",
			},
			{
				id: randomUUID(),
				pluggyItemId: cardItemId,
				pluggyTransactionId: "tx-card-001",
				date: monthDate(currentMonth, 6),
				amount: money(-34),
				description: "Assinatura",
				category: "Outros",
			},
			{
				id: randomUUID(),
				pluggyItemId: cardItemId,
				pluggyTransactionId: "tx-card-002",
				date: monthDate(previousMonth, 20),
				amount: money(-189.9),
				description: "Exames",
				category: "Saúde",
			},
			{
				id: randomUUID(),
				pluggyItemId: cardItemId,
				pluggyTransactionId: "tx-card-003",
				date: monthDate(previousMonth, 21),
				amount: money(-126.7),
				description: "Supermercado",
				category: "Alimentação",
			},
		]);
	});

	console.info("Seed concluído com sucesso.");
	console.info(`Usuário seed: ${seedUserId}`);
	console.info(`Mês atual populado: ${currentMonth}`);
	console.info(`Mês anterior populado: ${previousMonth}`);
}

void main();
