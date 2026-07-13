"use client";

import { Button } from "@vault/ui/components/button";
import { Skeleton } from "@vault/ui/components/skeleton";
import { Target } from "lucide-react";
import { GoalList } from "@/components/overview/goals/goal-list";
import { CreateGoalDialog } from "@/components/overview/goals/create-goal-dialog";
import { useGoalsCard } from "@/components/overview/goals/use-goals-card";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
} from "@/components/overview/shared/overview-card-state";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";

function GoalsLoadingState() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-8 w-28" />
			<div className="space-y-3">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-1.5 w-full" />
			</div>
			<div className="space-y-3">
				<Skeleton className="h-4 w-4/5" />
				<Skeleton className="h-1.5 w-full" />
			</div>
		</div>
	);
}

export function GoalsCard() {
	const {
		goals,
		handleSubmit,
		isCreating,
		isError,
		isLoading,
		name,
		open,
		setName,
		setOpen,
		setTargetAmount,
		targetAmount,
	} = useGoalsCard();

	return (
		<>
			<OverviewCardShell
				title="Metas"
				icon={<Target className="size-4 text-muted-foreground" />}
				tooltip="Acompanhe o progresso das suas metas financeiras"
				contentClassName="flex flex-1 flex-col space-y-4"
				footer={
					<Button className="ml-auto" size="sm" onClick={() => setOpen(true)}>
						Nova meta
					</Button>
				}
			>
				{isLoading ? (
					<GoalsLoadingState />
				) : isError ? (
					<OverviewCardErrorState message="Não foi possível carregar as metas." />
				) : goals.length === 0 ? (
					<OverviewCardEmptyState message="Nenhuma meta definida" />
				) : (
					<GoalList goals={goals} />
				)}
			</OverviewCardShell>

			<CreateGoalDialog
				isSubmitting={isCreating}
				name={name}
				onNameChange={setName}
				onOpenChange={setOpen}
				onSubmit={handleSubmit}
				onTargetAmountChange={setTargetAmount}
				open={open}
				targetAmount={targetAmount}
			/>
		</>
	);
}
