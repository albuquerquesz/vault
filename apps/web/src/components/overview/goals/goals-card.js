"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { Skeleton } from "@vault/ui/components/skeleton";
import { Target } from "lucide-react";
import { CreateGoalDialog } from "@/components/overview/goals/create-goal-dialog";
import { GoalList } from "@/components/overview/goals/goal-list";
import { useGoalsCard } from "@/components/overview/goals/hooks/use-goals-card";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import { OverviewCardEmptyState, OverviewCardErrorState, } from "@/components/overview/shared/overview-card-state";
function GoalsLoadingState() {
    return (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-5 w-28" }), _jsx(Skeleton, { className: "h-5 w-4/5" }), _jsx(Skeleton, { className: "h-5 w-2/3" })] }));
}
export function GoalsCard() {
    const { goals, handleComplete, handleDelete, handleSubmit, isEditing, isError, isLoading, isSubmitting, name, open, openCreate, openEdit, setName, setOpen, setTargetAmount, setUrl, targetAmount, url, } = useGoalsCard();
    return (_jsxs(_Fragment, { children: [_jsx(OverviewCardShell, { title: "Metas", icon: _jsx(Target, { className: "size-4 text-muted-foreground" }), tooltip: "Acompanhe o progresso das suas metas financeiras", contentClassName: "flex flex-1 flex-col space-y-4", footer: _jsx(Button, { className: "ml-auto", size: "sm", onClick: openCreate, children: "Nova meta" }), children: isLoading ? (_jsx(GoalsLoadingState, {})) : isError ? (_jsx(OverviewCardErrorState, { message: "N\u00E3o foi poss\u00EDvel carregar as metas." })) : goals.length === 0 ? (_jsx(OverviewCardEmptyState, { message: "Nenhuma meta definida" })) : (_jsx(GoalList, { goals: goals, onComplete: handleComplete, onDelete: handleDelete, onEdit: openEdit })) }), _jsx(CreateGoalDialog, { isEditing: isEditing, isSubmitting: isSubmitting, name: name, onNameChange: setName, onOpenChange: setOpen, onSubmit: handleSubmit, onTargetAmountChange: setTargetAmount, onUrlChange: setUrl, open: open, targetAmount: targetAmount, url: url })] }));
}
