"use client";

import { Button } from "@vault/ui/components/button";
import { Skeleton } from "@vault/ui/components/skeleton";
import { Target } from "lucide-react";
import { CreateGoalDialog } from "@/components/overview/goals/create-goal-dialog";
import { GoalList } from "@/components/overview/goals/goal-list";
import { useGoalsCard } from "@/components/overview/goals/hooks/use-goals-card";
import { OverviewCardShell } from "@/components/overview/shared/overview-card-shell";
import {
	OverviewCardEmptyState,
	OverviewCardErrorState,
} from "@/components/overview/shared/overview-card-state";

function GoalsLoadingState() {
	return (
		<div className="space-y-3">
			<Skeleton className="h-5 w-28" />
			<Skeleton className="h-5 w-4/5" />
			<Skeleton className="h-5 w-2/3" />
		</div>
	);
}

type GoalsCardProps = {
	className?: string;
};

export function GoalsCard({ className }: GoalsCardProps) {
	const {
		goals,
		handleComplete,
		handleDelete,
		handleSubmit,
		isEditing,
		isError,
		isLoading,
		isSubmitting,
		name,
		open,
		openCreate,
		openEdit,
		setName,
		setOpen,
		setTargetAmount,
		setUrl,
		targetAmount,
		url,
	} = useGoalsCard();

	return (
		<>
			<OverviewCardShell
				className={className}
				title="Metas"
				icon={<Target className="size-4 text-muted-foreground" />}
				tooltip="Acompanhe o progresso das suas metas financeiras"
				contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
				footer={
					<Button className="ml-auto" size="sm" onClick={openCreate}>
						Nova meta
					</Button>
				}
			>
				<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
					{isLoading ? (
						<GoalsLoadingState />
					) : isError ? (
						<OverviewCardErrorState message="Não foi possível carregar as metas." />
					) : goals.length === 0 ? (
						<OverviewCardEmptyState message="Nenhuma meta definida" />
					) : (
						<GoalList
							goals={goals}
							onComplete={handleComplete}
							onDelete={handleDelete}
							onEdit={openEdit}
						/>
					)}
				</div>
			</OverviewCardShell>

			<CreateGoalDialog
				isEditing={isEditing}
				isSubmitting={isSubmitting}
				name={name}
				onNameChange={setName}
				onOpenChange={setOpen}
				onSubmit={handleSubmit}
				onTargetAmountChange={setTargetAmount}
				onUrlChange={setUrl}
				open={open}
				targetAmount={targetAmount}
				url={url}
			/>
		</>
	);
}
