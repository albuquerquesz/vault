"use client";
import { useState } from "react";
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal, } from "@/features/finance/sdk";
const brlCurrencyFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});
/** Format a numeric amount as BRL (e.g. 40 → "R$ 40,00"). */
export function formatBrlAmount(amount) {
    return brlCurrencyFmt.format(amount);
}
/**
 * Digits-only mask: typed digits are treated as cents.
 * "4000" → "R$ 40,00"
 */
export function maskBrlInput(raw) {
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
export function parseBrlInput(formatted) {
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
    const [editingGoal, setEditingGoal] = useState(null);
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
    const openEdit = (goal) => {
        setEditingGoal(goal);
        setName(goal.name);
        setTargetAmount(formatBrlAmount(goal.targetAmount));
        setUrl(goal.url ?? "");
        setOpen(true);
    };
    const handleOpenChange = (nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            resetForm();
        }
    };
    const handleSubmit = (event) => {
        event.preventDefault();
        const amount = parseBrlInput(targetAmount);
        if (!name.trim() || Number.isNaN(amount) || amount <= 0) {
            return;
        }
        const nextUrl = url.trim() || null;
        if (editingGoal) {
            updateGoal.mutate({
                id: editingGoal.id,
                name: name.trim(),
                targetAmount: amount,
                url: nextUrl,
            }, {
                onSuccess: () => {
                    resetForm();
                    setOpen(false);
                },
            });
            return;
        }
        createGoal.mutate({ name: name.trim(), targetAmount: amount, url: nextUrl }, {
            onSuccess: () => {
                resetForm();
                setOpen(false);
            },
        });
    };
    const handleComplete = (goal) => {
        updateGoal.mutate({
            id: goal.id,
            currentAmount: goal.targetAmount,
        });
    };
    const handleDelete = (goal) => {
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
