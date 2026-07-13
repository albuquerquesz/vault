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

export function useGoalsCard() {
	const goalsQuery = useGoals();
	const createGoal = useCreateGoal();
	const updateGoal = useUpdateGoal();
	const deleteGoal = useDeleteGoal();

	const [open, setOpen] = useState(false);
	const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
	const [name, setName] = useState("");
	const [targetAmount, setTargetAmount] = useState("");

	const resetForm = () => {
		setName("");
		setTargetAmount("");
		setEditingGoal(null);
	};

	const openCreate = () => {
		resetForm();
		setOpen(true);
	};

	const openEdit = (goal: Goal) => {
		setEditingGoal(goal);
		setName(goal.name);
		setTargetAmount(String(goal.targetAmount));
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

		const amount = Number.parseFloat(targetAmount);
		if (!name.trim() || Number.isNaN(amount) || amount <= 0) {
			return;
		}

		if (editingGoal) {
			updateGoal.mutate(
				{
					id: editingGoal.id,
					name: name.trim(),
					targetAmount: amount,
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
			{ name: name.trim(), targetAmount: amount },
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
		handleSubmit,
		handleComplete,
		handleDelete,
		isEditing: editingGoal !== null,
		isSubmitting: createGoal.isPending || updateGoal.isPending,
	};
}
