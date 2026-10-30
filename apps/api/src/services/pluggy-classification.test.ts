import { describe, expect, test } from "bun:test";
import {
	type ClassifiableTransaction,
	classifyPluggyTransactions,
	summarizeClassified,
} from "./pluggy-classification.js";

let seq = 0;
function tx(
	overrides: Partial<ClassifiableTransaction>,
): ClassifiableTransaction {
	seq += 1;
	return {
		id: `tx-${seq}`,
		date: "2026-10-10",
		amount: -10,
		category: null,
		description: null,
		accountType: "BANK",
		accountId: "nubank-checking",
		...overrides,
	};
}

function kindOf(
	t: ClassifiableTransaction,
	all: ClassifiableTransaction[] = [t],
) {
	return classifyPluggyTransactions(all).get(t.id)?.kind;
}

describe("classifyPluggyTransactions", () => {
	test("card purchases are positive on CREDIT accounts", () => {
		const purchase = tx({
			accountType: "CREDIT",
			amount: 120,
			category: "Clothing",
		});
		expect(kindOf(purchase)).toBe("expense");
	});

	test("card credits are refunds, card bill payments are ignored", () => {
		const refund = tx({
			accountType: "CREDIT",
			amount: -67.42,
			category: "Online shopping",
		});
		const payment = tx({
			accountType: "CREDIT",
			amount: -500,
			category: "Credit card payment",
			description: "Pagamento recebido",
		});
		expect(kindOf(refund)).toBe("refund");
		expect(kindOf(payment)).toBe("ignored");
	});

	test("paying the card bill from the bank is not spending", () => {
		for (const description of [
			"Pagamento de fatura",
			"Pagamento Cartão de crédito",
			"Pagamento de fatura Cartão de crédito",
		]) {
			expect(
				kindOf(tx({ amount: -300, category: "Transfers", description })),
			).toBe("ignored");
		}
	});

	test("own-money movements are ignored both ways", () => {
		for (const [category, description] of [
			["Investments", "Aplicação RDB"],
			["Investments", "Resgate RDB"],
			["Transfer - Internal", "Dinheiro reservado Cofrinho"],
			["Same person transfer", "Pix enviado Victor"],
		] as const) {
			expect(kindOf(tx({ amount: -100, category, description }))).toBe(
				"ignored",
			);
			expect(kindOf(tx({ amount: 100, category, description }))).toBe(
				"ignored",
			);
		}
	});

	test("PIX to third parties is spending; PIX received is income", () => {
		expect(
			kindOf(
				tx({
					amount: -45,
					category: "Transfer - PIX",
					description: "Pagamento com QR Pix PADARIA",
				}),
			),
		).toBe("expense");
		expect(
			kindOf(
				tx({
					amount: 900,
					category: "Transfer - PIX",
					description: "Pix recebido Fulano",
				}),
			),
		).toBe("income");
	});

	test("matches transfers between own bank accounts", () => {
		const out = tx({
			amount: -250,
			category: "Transfer - PIX",
			accountId: "nubank",
		});
		const inflow = tx({
			amount: 250,
			date: "2026-10-11",
			category: "Transfer - PIX",
			accountId: "mercado-pago",
		});
		const unrelated = tx({
			amount: 250,
			date: "2026-10-20",
			accountId: "mercado-pago",
		});
		const result = classifyPluggyTransactions([out, inflow, unrelated]);
		expect(result.get(out.id)?.kind).toBe("ignored");
		expect(result.get(inflow.id)?.kind).toBe("ignored");
		expect(result.get(unrelated.id)?.kind).toBe("income");
	});

	test("does not pair within the same account", () => {
		const out = tx({ amount: -50, accountId: "nubank" });
		const back = tx({ amount: 50, accountId: "nubank" });
		const result = classifyPluggyTransactions([out, back]);
		expect(result.get(out.id)?.kind).toBe("expense");
		expect(result.get(back.id)?.kind).toBe("income");
	});

	test("a bank payment matching a connected card's payment is the bill", () => {
		const pix = tx({
			amount: -298.73,
			category: "Services",
			description: "Transferência enviada pelo Pix|MERCADO PAGO INSTIT",
		});
		const cardSide = tx({
			accountType: "CREDIT",
			accountId: "mp-card",
			amount: -298.73,
			category: "Credit card payment",
			description: "Pagamento recebido",
		});
		const result = classifyPluggyTransactions([pix, cardSide]);
		expect(result.get(pix.id)).toMatchObject({
			kind: "ignored",
			reason: "card_bill_payment",
		});
		expect(kindOf(tx({ amount: -298.73, category: "Services" }))).toBe(
			"expense",
		);
	});

	test("PJ payouts are income; a return to the PJ cancels one; own PF accounts are internal", () => {
		const pj = "66.390.189 VICTOR ALBUQUERQUE ARRUDA";
		const payoutA = tx({
			date: "2026-10-20",
			amount: 1640,
			category: "Transfer - PIX",
			description: `Pix recebido ${pj}`,
		});
		const payoutB = tx({
			date: "2026-10-20",
			amount: 1640,
			category: "Transfer - PIX",
			description: `Pix recebido ${pj}`,
		});
		const returned = tx({
			date: "2026-10-20",
			amount: -1640,
			category: "Electronics",
			description: `Pagamento com Pix ${pj}`,
		});
		const earlier = tx({
			date: "2026-10-12",
			amount: 300,
			category: "Transfer - PIX",
			description: `Pix recebido ${pj}`,
		});
		const toOwnPf = tx({
			amount: -80,
			category: "Transfers",
			description: "Pix enviado Victor Albuquerque Arruda",
		});
		const relative = tx({
			amount: -300,
			category: "Transfers",
			description: "Pix enviado Nathalia Souza de Albuquerque",
		});
		const all = [payoutA, payoutB, returned, earlier, toOwnPf, relative];
		const result = classifyPluggyTransactions(all, {
			ownerName: "Victor Albuquerque",
		});

		const reasons = all.map((t) => result.get(t.id)?.reason);
		expect(reasons).toEqual([
			"owner_company_round_trip",
			"owner_company_payout",
			"owner_company_round_trip",
			"owner_company_payout",
			"owner_name_transfer",
			"bank_outflow",
		]);
		expect(summarizeClassified(result.values())).toEqual({
			income: 1940,
			spent: 300,
		});
	});

	test("without a full owner name, PJ payouts are plain income", () => {
		const payout = tx({
			amount: 1640,
			description: "Pix recebido 66.390.189 VICTOR ALBUQUERQUE ARRUDA",
		});
		expect(
			classifyPluggyTransactions([payout], { ownerName: "Victor" }).get(
				payout.id,
			)?.reason,
		).toBe("bank_inflow");
	});

	test("bank refunds reduce spending", () => {
		const refund = tx({
			amount: 186.4,
			description: "Reembolso de Pix enviado Alexsa",
		});
		expect(kindOf(refund)).toBe("refund");
	});

	test("summary nets refunds out of spending", () => {
		const all = [
			tx({ amount: 1000, description: "Pix recebido salário" }),
			tx({ amount: -300, description: "Pagamento com QR Pix MERCADO" }),
			tx({ accountType: "CREDIT", accountId: "card", amount: 200 }),
			tx({ accountType: "CREDIT", accountId: "card", amount: -50 }),
			tx({ amount: -200, description: "Pagamento de fatura" }),
		];
		expect(
			summarizeClassified(classifyPluggyTransactions(all).values()),
		).toEqual({
			income: 1000,
			spent: 450,
		});
	});
});
