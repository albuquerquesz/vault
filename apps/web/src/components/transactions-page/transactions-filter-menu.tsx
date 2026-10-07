"use client";

import { Button } from "@vault/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@vault/ui/components/dropdown-menu";
import { cn } from "@vault/ui/lib/utils";
import {
	CalendarIcon,
	LandmarkIcon,
	SlidersHorizontalIcon,
	TagsIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FinanceTransaction } from "@/features/finance/sdk";
import {
	collectFilterOptions,
	EMPTY_TRANSACTIONS_FILTERS,
	formatTransactionDayLabel,
	hasActiveTransactionFilters,
	type TransactionsFilters,
} from "./utils";

function toggleValue(values: string[], value: string): string[] {
	return values.includes(value)
		? values.filter((item) => item !== value)
		: [...values, value];
}

export function TransactionsFilterMenu({
	transactions,
	appliedFilters,
	onAppliedFiltersChange,
}: {
	transactions: FinanceTransaction[];
	appliedFilters: TransactionsFilters;
	onAppliedFiltersChange: (filters: TransactionsFilters) => void;
}) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<TransactionsFilters>(appliedFilters);

	const options = useMemo(
		() => collectFilterOptions(transactions),
		[transactions],
	);
	const isActive = hasActiveTransactionFilters(appliedFilters);

	useEffect(() => {
		if (open) {
			setDraft(appliedFilters);
		}
	}, [open, appliedFilters]);

	const handleApply = () => {
		onAppliedFiltersChange(draft);
		setOpen(false);
	};

	const handleClear = () => {
		const empty = EMPTY_TRANSACTIONS_FILTERS;
		setDraft(empty);
		onAppliedFiltersChange(empty);
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger
				render={
					<button
						aria-label="Filtrar transações"
						className="focus-visible:outline-none"
						type="button"
					>
						<span
							className={cn(
						"inline-flex min-h-11 min-w-[60px] shrink-0 items-center justify-center rounded-lg border border-border/70 bg-transparent text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
								isActive && "border-primary/60 bg-primary/10 text-foreground",
							)}
						>
							<SlidersHorizontalIcon className="size-4" />
						</span>
					</button>
				}
			/>
			<DropdownMenuContent
				align="end"
				className="w-[min(20rem,calc(100vw-1.5rem))] rounded-lg bg-card p-1"
				sideOffset={6}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel className="px-2.5 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
						Filtrar por
					</DropdownMenuLabel>

					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2 px-2.5 py-2 text-sm">
							<LandmarkIcon className="size-4 text-muted-foreground" />
							Conta
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="max-h-64 min-w-48 overflow-y-auto rounded-lg bg-card p-1">
							{options.accounts.length === 0 ? (
								<div className="px-2 py-2 text-xs text-muted-foreground">
									Nenhuma conta
								</div>
							) : (
								options.accounts.map((account) => (
									<DropdownMenuCheckboxItem
										checked={draft.accounts.includes(account)}
										className="text-sm"
										key={account}
										onCheckedChange={() =>
											setDraft((current) => ({
												...current,
												accounts: toggleValue(current.accounts, account),
											}))
										}
									>
										{account}
									</DropdownMenuCheckboxItem>
								))
							)}
						</DropdownMenuSubContent>
					</DropdownMenuSub>

					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2 px-2.5 py-2 text-sm">
							<CalendarIcon className="size-4 text-muted-foreground" />
							Data
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="max-h-64 min-w-48 overflow-y-auto rounded-lg bg-card p-1">
							{options.dates.length === 0 ? (
								<div className="px-2 py-2 text-xs text-muted-foreground">
									Nenhuma data
								</div>
							) : (
								options.dates.map((date) => (
									<DropdownMenuCheckboxItem
										checked={draft.dates.includes(date)}
										className="text-sm"
										key={date}
										onCheckedChange={() =>
											setDraft((current) => ({
												...current,
												dates: toggleValue(current.dates, date),
											}))
										}
									>
										{formatTransactionDayLabel(date)}
									</DropdownMenuCheckboxItem>
								))
							)}
						</DropdownMenuSubContent>
					</DropdownMenuSub>

					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2 px-2.5 py-2 text-sm">
							<TagsIcon className="size-4 text-muted-foreground" />
							Categoria
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="max-h-64 min-w-48 overflow-y-auto rounded-lg bg-card p-1">
							{options.categories.length === 0 ? (
								<div className="px-2 py-2 text-xs text-muted-foreground">
									Nenhuma categoria
								</div>
							) : (
								options.categories.map((category) => (
									<DropdownMenuCheckboxItem
										checked={draft.categories.includes(category)}
										className="text-sm"
										key={category}
										onCheckedChange={() =>
											setDraft((current) => ({
												...current,
												categories: toggleValue(current.categories, category),
											}))
										}
									>
										{category}
									</DropdownMenuCheckboxItem>
								))
							)}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuGroup>

				<DropdownMenuSeparator className="my-1" />

				<div className="flex items-center justify-between gap-2 px-2 py-1.5">
					<button
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						onClick={handleClear}
						type="button"
					>
						Limpar tudo
					</button>
					<Button className="h-8 px-3 text-sm" onClick={handleApply} size="sm">
						Aplicar
					</Button>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
