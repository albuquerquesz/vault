"use client";

import { useMemo } from "react";
import {
	getMonthValue,
	useFinanceMonthlyBills,
} from "@/features/finance/sdk";
import { type PluggyAccount, usePluggyAccounts } from "@/features/pluggy/sdk";

export type CreditCardListItem = {
	id: string;
	name: string;
	/** Best-effort institution label for brand mark (bank / Open Finance). */
	provider: string | null;
	/** Current credit limit available, when supplied by the institution. */
	availableAmount: number | null;
	/** Amount paid toward the invoice (or used balance when from Pluggy bills). */
	paidAmount: number;
	/** Invoice total for the selected month. */
	totalAmount: number;
};

const GENERIC_ITEM_PROVIDER = /^(meu\s*pluggy|unknown institution|pluggy)$/i;

/**
 * Patterns that identify a real bank/institution in an account display name.
 * Used when Pluggy item.provider is a sandbox multipurpose connector (MeuPluggy).
 */
const INSTITUTION_NAME_HINT =
	/nu\s*pagamentos|nubank|\bnu\b|mercado\s*pago|mercadopago|pagbank|pagseguro|banco\s+do\s+brasil|\bbb\b|ita[uú]|bradesco|santander|banco\s+inter|\binter\b|banco\s+pan|\bpan\b|\bc6\b|picpay|caixa|btg|\bxp\b|will|neon|original|safra|sicoob|sicredi|banrisul|banestes|\bbv\b|bmg|digio|porto|sofisa|agibank|daycoval|cresol/i;

/**
 * When the item-level provider is generic (sandbox), infer institution from
 * sibling accounts on the same Pluggy item — e.g. checking "Nu Pagamentos S.A."
 * next to credit card product name "gold".
 */
function resolveCardInstitution(
	card: PluggyAccount,
	allAccounts: PluggyAccount[],
): string | null {
	const itemProvider = card.provider?.trim() || null;
	if (itemProvider && !GENERIC_ITEM_PROVIDER.test(itemProvider)) {
		return itemProvider;
	}

	const siblings = allAccounts.filter(
		(account) => account.pluggyItemId === card.pluggyItemId,
	);

	const bankHint = siblings.find((account) => {
		if (account.type !== "BANK") return false;
		return Boolean(
			account.name?.trim() && INSTITUTION_NAME_HINT.test(account.name),
		);
	});
	if (bankHint?.name?.trim()) {
		return bankHint.name.trim();
	}

	const namedBankAccounts = siblings.filter(
		(account) => account.type === "BANK" && account.name?.trim(),
	);
	if (namedBankAccounts.length === 1) {
		return namedBankAccounts[0]?.name?.trim() ?? null;
	}

	const anyHint = siblings.find(
		(account) =>
			account.name?.trim() && INSTITUTION_NAME_HINT.test(account.name),
	);
	if (anyHint?.name?.trim()) {
		return anyHint.name.trim();
	}

	if (card.name?.trim() && INSTITUTION_NAME_HINT.test(card.name)) {
		return card.name.trim();
	}

	return null;
}

function resolveProviderForBillName(
	billName: string,
	accounts: PluggyAccount[],
): string | null {
	const normalized = billName.trim().toLowerCase();
	if (!normalized) return null;

	const matchingCard = accounts.find(
		(account) =>
			account.type === "CREDIT" &&
			account.name?.trim().toLowerCase() === normalized,
	);

	if (!matchingCard) {
		// Fall back to institution hints on the bill name itself (e.g. "Mercado Pago").
		if (INSTITUTION_NAME_HINT.test(billName)) {
			return billName.trim();
		}
		return null;
	}

	return resolveCardInstitution(matchingCard, accounts);
}

/**
 * Monthly credit-card invoices for the selected month.
 * Data comes from `monthly_bill` / `monthly_bill_item` (materialized from Pluggy bills by due date).
 */
export function useMonthlyBillCard(month?: string) {
	const resolvedMonth = month ?? getMonthValue();
	const billsQuery = useFinanceMonthlyBills(resolvedMonth);
	const accountsQuery = usePluggyAccounts();

	const items = useMemo<CreditCardListItem[]>(() => {
		const billItems = billsQuery.data?.items ?? [];
		const accounts = accountsQuery.data ?? [];

		return billItems
			.map((item) => {
				const matchingCard = accounts.find(
					(account) =>
						account.type === "CREDIT" &&
						account.name?.trim().toLowerCase() ===
							item.name.trim().toLowerCase(),
				);
				const availableBalance =
					matchingCard?.availableBalance != null
						? Number(matchingCard.availableBalance)
						: null;

				return {
					id: item.id,
					name: item.name,
					provider: resolveProviderForBillName(item.name, accounts),
					availableAmount:
						availableBalance != null && Number.isFinite(availableBalance)
							? availableBalance
							: null,
					paidAmount: item.paidAmount,
					totalAmount: item.totalAmount,
				};
			})
			.sort((left, right) => right.totalAmount - left.totalAmount);
	}, [accountsQuery.data, billsQuery.data?.items]);

	const totalBill = useMemo(() => {
		const bill = billsQuery.data?.bills[0];
		if (bill) {
			return bill.totalBill;
		}
		return items.reduce((sum, item) => sum + item.totalAmount, 0);
	}, [billsQuery.data?.bills, items]);

	return {
		isLoading: billsQuery.isPending,
		isError: billsQuery.isError,
		bill: items.length > 0 ? { totalBill } : null,
		items,
		month: resolvedMonth,
	};
}
