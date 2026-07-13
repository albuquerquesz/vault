"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useCreateGoal, useGoals } from "@/features/finance/sdk";

export function useGoalsCard() {
	const goalsQuery = useGoals();
	const createGoal = useCreateGoal();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [targetAmount, setTargetAmount] = useState("");

	const resetForm = () => {
		setName("");
		setTargetAmount("");
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const amount = Number.parseFloat(targetAmount);
		if (!name.trim() || Number.isNaN(amount) || amount <= 0) {
			return;
		}

		createGoal.mutate(
			{ name: name.trim(), targetAmount: amount },
			{
				onSuccess: () => {
					resetForm();
					setOpen(false);
				},
			},
		);
	};

	return {
		goals: goalsQuery.data ?? [],
		isLoading: goalsQuery.isPending,
		isError: goalsQuery.isError,
		open,
		setOpen,
		name,
		setName,
		targetAmount,
		setTargetAmount,
		handleSubmit,
		isCreating: createGoal.isPending,
	};
}
