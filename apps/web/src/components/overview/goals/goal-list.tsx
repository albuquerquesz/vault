"use client";

import { Button } from "@vault/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@vault/ui/components/dropdown-menu";
import { CheckIcon, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import type { Goal } from "@/features/finance/sdk";

const currencyFmt = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

const MAX_NAME_LENGTH = 20;

function maskGoalName(name: string) {
	if (name.length <= MAX_NAME_LENGTH) {
		return name;
	}

	return `${name.slice(0, MAX_NAME_LENGTH)}…`;
}

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
				const displayName = maskGoalName(goal.name);

				return (
					<div
						key={goal.id}
						className="flex items-center justify-between gap-3 py-1.5"
					>
						<span
							className="min-w-0 flex-1 truncate text-lg font-medium"
							title={goal.name}
						>
							{displayName}
						</span>

						<div className="flex shrink-0 items-center gap-1">
							<AnimatedNumber
								className="text-xl font-semibold tabular-nums text-white"
								format={(value) => currencyFmt.format(value)}
								value={goal.targetAmount}
							/>

							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button
											variant="ghost"
											size="icon-sm"
											className="size-8 shrink-0 text-muted-foreground"
											aria-label={`Opções da meta ${goal.name}`}
										>
											<MoreVerticalIcon className="size-4" />
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
					</div>
				);
			})}
		</div>
	);
}
