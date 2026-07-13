"use client";

import { Button } from "@vault/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@vault/ui/components/dropdown-menu";
import { CheckIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { Goal } from "@/features/finance/sdk";

type GoalListProps = {
	goals: Goal[];
	onComplete: (goal: Goal) => void;
	onEdit: (goal: Goal) => void;
	onDelete: (goal: Goal) => void;
};

export function GoalList({
	goals,
	onComplete,
	onEdit,
	onDelete,
}: GoalListProps) {
	return (
		<div className="flex flex-col gap-1">
			{goals.map((goal) => {
				const isCompleted = goal.currentAmount >= goal.targetAmount;

				return (
					<div
						key={goal.id}
						className="flex items-center justify-between gap-3 py-1.5"
					>
						<span className="truncate text-sm font-medium">{goal.name}</span>

						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-8 shrink-0 text-muted-foreground"
										aria-label={`Opções da meta ${goal.name}`}
									>
										<MoreHorizontalIcon className="size-4" />
									</Button>
								}
							/>
							<DropdownMenuContent align="end" className="min-w-36 bg-card">
								{!isCompleted && (
									<DropdownMenuItem onClick={() => onComplete(goal)}>
										<CheckIcon className="size-4" />
										Concluir
									</DropdownMenuItem>
								)}
								<DropdownMenuItem onClick={() => onEdit(goal)}>
									<PencilIcon className="size-4" />
									Editar
								</DropdownMenuItem>
								<DropdownMenuItem
									variant="destructive"
									onClick={() => onDelete(goal)}
								>
									<Trash2Icon className="size-4" />
									Deletar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			})}
		</div>
	);
}
