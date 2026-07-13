"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
	type Goal,
	useCreateGoal,
	useDeleteGoal,
	useGoals,
	useUpdateGoal,
} from "@/features/finance/sdk";

const brlCurrencyFmt = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

/** Format a numeric amount as BRL (e.g. 40 → "R$ 40,00"). */
export function formatBrlAmount(amount: number): string {
	return brlCurrencyFmt.format(amount);
}

/**
 * Digits-only mask: typed digits are treated as cents.
 * "4000" → "R$ 40,00"
 */
export function maskBrlInput(raw: string): string {
	const digits = raw.replace(/\D/g, "");
	if (!digits) {
		return "";
	}

	const cents = Number.parseInt(digits, 10);
	if (Number.isNaN(cents)) {
		return "";
	}

	return brlCurrencyFmt.format(cents / 100);
}

/** Parse a masked BRL string back to a number ("R$ 40,00" → 40). */
export function parseBrlInput(formatted: string): number {
	const digits = formatted.replace(/\D/g, "");
	if (!digits) {
		return Number.NaN;
	}

	return Number.parseInt(digits, 10) / 100;
}

export function useGoalsCard() {
	const goalsQuery = useGoals();
	const createGoal = useCreateGoal();
	const updateGoal = useUpdateGoal();
	const deleteGoal = useDeleteGoal();

	const [open, setOpen] = useState(false);
	const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
	const [name, setName] = useState("");
	const [targetAmount, setTargetAmount] = useState("");
	const [url, setUrl] = useState("");

	const resetForm = () => {
		setName("");
		setTargetAmount("");
		setUrl("");
		setEditingGoal(null);
	};

	const openCreate = () => {
		resetForm();
		setOpen(true);
	};

	const openEdit = (goal: Goal) => {
		setEditingGoal(goal);
		setName(goal.name);
		setTargetAmount(formatBrlAmount(goal.targetAmount));
		setUrl(goal.url ?? "");
		setOpen(true);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			resetForm();
		}
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const amount = parseBrlInput(targetAmount);
		if (!name.trim() || Number.isNaN(amount) || amount <= 0) {
			return;
		}

		const nextUrl = url.trim() || null;

		if (editingGoal) {
			updateGoal.mutate(
				{
					id: editingGoal.id,
					name: name.trim(),
					targetAmount: amount,
					url: nextUrl,
				},
				{
					onSuccess: () => {
						resetForm();
						setOpen(false);
					},
				},
			);
			return;
		}

		createGoal.mutate(
			{ name: name.trim(), targetAmount: amount, url: nextUrl },
			{
				onSuccess: () => {
					resetForm();
					setOpen(false);
				},
			},
		);
	};

	const handleComplete = (goal: Goal) => {
		updateGoal.mutate({
			id: goal.id,
			currentAmount: goal.targetAmount,
		});
	};

	const handleDelete = (goal: Goal) => {
		deleteGoal.mutate(goal.id);
	};

	return {
		goals: goalsQuery.data ?? [],
		isLoading: goalsQuery.isPending,
		isError: goalsQuery.isError,
		open,
		setOpen: handleOpenChange,
		openCreate,
		openEdit,
		name,
		setName,
		targetAmount,
		setTargetAmount,
		url,
		setUrl,
		handleSubmit,
		handleComplete,
		handleDelete,
		isEditing: editingGoal !== null,
		isSubmitting: createGoal.isPending || updateGoal.isPending,
	};
}
