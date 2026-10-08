"use client";

import { Badge } from "@vault/ui/components/badge";
import { Button } from "@vault/ui/components/button";
import { Checkbox } from "@vault/ui/components/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@vault/ui/components/dropdown-menu";
import {
	CheckIcon,
	ExternalLinkIcon,
	MoreVerticalIcon,
	PencilIcon,
	Trash2Icon,
} from "lucide-react";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import type { Goal } from "@/features/finance/sdk";

const currencyFmt = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
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
	onToggleComplete: (goal: Goal, isCompleted: boolean) => void;
	onEdit: (goal: Goal) => void;
	onDelete: (goal: Goal) => void;
};

export function GoalList({
	goals,
	onToggleComplete,
	onEdit,
	onDelete,
}: GoalListProps) {
	return (
		<div className="flex flex-col gap-1">
			{goals.map((goal) => {
				const isCompleted = goal.isCompleted;
				const displayName = maskGoalName(goal.name);

				return (
					<div
						key={goal.id}
						className="flex items-center justify-between gap-3 py-1"
					>
						<div className="flex min-w-0 flex-1 items-center gap-2">
							<Checkbox
								aria-label={
									isCompleted
										? `Desmarcar meta ${goal.name}`
										: `Concluir meta ${goal.name}`
								}
								checked={isCompleted}
								className="size-5 rounded-full"
								onCheckedChange={(checked) => {
									onToggleComplete(goal, checked === true);
								}}
							/>
							{goal.url ? (
								<a
									href={goal.url}
									target="_blank"
									rel="noopener noreferrer"
									className="min-w-0 truncate text-lg font-medium no-underline underline-offset-4 hover:underline"
									title={goal.name}
								>
									{displayName}
								</a>
							) : (
								<span
									className="min-w-0 truncate text-lg font-medium"
									title={goal.name}
								>
									{displayName}
								</span>
							)}
							{goal.url ? (
								<a
									href={goal.url}
									target="_blank"
									rel="noopener noreferrer"
									className="shrink-0 text-muted-foreground hover:text-foreground"
									aria-label={`Abrir link da meta ${goal.name}`}
								>
									<ExternalLinkIcon className="size-3.5" />
								</a>
							) : null}
						</div>

						<div className="flex shrink-0 items-center gap-1">
							<Badge
								variant="secondary"
								className="h-auto rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-800 dark:bg-muted dark:text-foreground"
							>
								<MaskedMonetaryValue
									className="text-sm font-sans font-medium tabular-nums"
									format={(value) => currencyFmt.format(value)}
									animated
									value={goal.targetAmount}
								/>
							</Badge>

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
										<DropdownMenuItem
											onClick={() => onToggleComplete(goal, true)}
										>
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
