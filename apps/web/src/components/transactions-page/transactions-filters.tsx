"use client";

import { Input } from "@vault/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import { CalendarIcon, SearchIcon } from "lucide-react";
import { ActiveFilterChip } from "./active-filter-chip";
import type {
	TransactionsActiveFilterChip,
	TransactionsMonthOption,
} from "./utils";

export function TransactionsFilters({
	selectedMonth,
	onSelectedMonthChange,
	monthOptions,
	categoryFilter,
	onCategoryFilterChange,
	categories,
	searchQuery,
	onSearchQueryChange,
	activeFilterChips,
}: {
	selectedMonth: string;
	onSelectedMonthChange: (value: string) => void;
	monthOptions: TransactionsMonthOption[];
	categoryFilter: string;
	onCategoryFilterChange: (value: string) => void;
	categories: string[];
	searchQuery: string;
	onSearchQueryChange: (value: string) => void;
	activeFilterChips: TransactionsActiveFilterChip[];
}) {
	// Override Select/Input dark:bg-input/30 so only the border shows.
	const filterControlClass =
		"!bg-transparent shadow-none dark:!bg-transparent dark:hover:!bg-transparent dark:focus-visible:!bg-transparent";

	return (
		<div className="pb-0">
			<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
				<Select
					value={selectedMonth}
					onValueChange={(value) => value && onSelectedMonthChange(value)}
				>
					<SelectTrigger
						className={`w-full rounded-md border-border/70 sm:w-40 ${filterControlClass}`}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{monthOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={categoryFilter}
					onValueChange={(value) => value && onCategoryFilterChange(value)}
				>
					<SelectTrigger
						className={`w-full rounded-md border-border/70 sm:w-45 ${filterControlClass}`}
					>
						<SelectValue placeholder="Todas categorias" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas categorias</SelectItem>
						{categories.map((category) => (
							<SelectItem key={category} value={category}>
								{category}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="relative w-full min-w-0 sm:w-[min(100%,16rem)]">
					<SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						aria-label="Buscar transações"
						className={`w-full rounded-md border-border/70 pl-10 ${filterControlClass}`}
						placeholder="Buscar por nota ou categoria"
						value={searchQuery}
						onChange={(event) => onSearchQueryChange(event.target.value)}
					/>
				</div>
			</div>

			{activeFilterChips.length > 0 ? (
				<div className="mt-2 flex flex-wrap items-center justify-end gap-2">
					{activeFilterChips.map((chip) => (
						<ActiveFilterChip
							key={chip.label}
							label={chip.label}
							onRemove={chip.onRemove}
						/>
					))}
				</div>
			) : null}
		</div>
	);
}
