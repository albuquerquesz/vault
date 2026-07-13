"use client";

import { useMemo } from "react";
import { type PluggyAccount, usePluggyAccounts } from "@/features/pluggy/sdk";

export type CreditCardListItem = {
	id: string;
	name: string;
	/** Best-effort institution label for brand mark (bank / Open Finance). */
	provider: string | null;
	/** Outstanding balance (used credit). */
	paidAmount: number;
	/** Credit limit when available; otherwise balance. */
	totalAmount: number;
};

const GENERIC_ITEM_PROVIDER = /^(meu\s*pluggy|unknown institution|pluggy)$/i;

/**
 * Patterns that identify a real bank/institution in an account display name.
 * Used when Pluggy item.provider is a sandbox multipurpose connector (MeuPluggy).
 */
const INSTITUTION_NAME_HINT =
	/nu\s*pagamentos|nubank|\bnu\b|mercado\s*pago|mercadopago|banco do brasil|\bbb\b|ita[uú]|bradesco|santander|inter|c6|picpay|caixa|btg|xp|will|neon|original|safra|sicoob|sicredi/i;

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

	// Prefer BANK / checking labels (usually the legal institution name).
	const bankHint = siblings.find((account) => {
		if (account.type !== "BANK") return false;
		return Boolean(
			account.name?.trim() && INSTITUTION_NAME_HINT.test(account.name),
		);
	});
	if (bankHint?.name?.trim()) {
		return bankHint.name.trim();
	}

	// Any sibling (including the card itself) with a clear institution name.
	const anyHint = siblings.find(
		(account) =>
			account.name?.trim() && INSTITUTION_NAME_HINT.test(account.name),
	);
	if (anyHint?.name?.trim()) {
		return anyHint.name.trim();
	}

	// Fall back to card name (e.g. "Mercado Pago") or generic provider.
	if (card.name?.trim() && INSTITUTION_NAME_HINT.test(card.name)) {
		return card.name.trim();
	}

	return itemProvider;
}

/**
 * Lists connected Pluggy credit cards for the dashboard card.
 * `month` is ignored (cards are not month-scoped); kept for call-site compatibility.
 */
export function useMonthlyBillCard(_month?: string) {
	const accountsQuery = usePluggyAccounts();

	const items = useMemo<CreditCardListItem[]>(() => {
		const accounts = accountsQuery.data ?? [];
		return accounts
			.filter((account) => account.type === "CREDIT")
			.map((card) => {
				const balance = Number(card.balance) || 0;
				const available = Number(card.availableBalance) || 0;
				const limit = available > 0 ? balance + available : balance;

				return {
					id: card.id,
					name:
						card.name?.trim() ||
						card.brand?.trim() ||
						card.provider ||
						"Cartão",
					provider: resolveCardInstitution(card, accounts),
					paidAmount: balance,
					totalAmount: limit,
				};
			})
			.sort((left, right) => right.paidAmount - left.paidAmount);
	}, [accountsQuery.data]);

	const totalBill = useMemo(
		() => items.reduce((sum, item) => sum + item.paidAmount, 0),
		[items],
	);

	return {
		isLoading: accountsQuery.isPending,
		isError: accountsQuery.isError,
		bill: items.length > 0 ? { totalBill } : null,
		items,
	};
}
