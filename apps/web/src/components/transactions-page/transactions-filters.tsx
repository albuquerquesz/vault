"use client";

import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vault/ui/components/select";
import { CalendarIcon, SearchIcon, XIcon } from "lucide-react";
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
  hasActiveFilters,
  activeFilterChips,
  onClearFilters,
}: {
  selectedMonth: string;
  onSelectedMonthChange: (value: string) => void;
  monthOptions: TransactionsMonthOption[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categories: string[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  hasActiveFilters: boolean;
  activeFilterChips: TransactionsActiveFilterChip[];
  onClearFilters: () => void;
}) {
  return (
    <div className="p-4">
      <div className="grid gap-3 md:grid-cols-[auto_auto_minmax(0,1fr)_auto] md:items-center">
        <Select
          value={selectedMonth}
          onValueChange={(value) => value && onSelectedMonthChange(value)}
        >
          <SelectTrigger className="w-full rounded-md md:w-40">
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
          <SelectTrigger className="w-full rounded-md md:w-45">
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

        <div className="relative min-w-0">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar transações"
            className="w-full rounded-md pl-10"
            placeholder="Buscar por nota ou categoria"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </div>

        <Button
          className="w-full md:w-auto"
          disabled={!hasActiveFilters}
          onClick={onClearFilters}
          variant="outline"
        >
          <XIcon className="mr-2 size-4" />
          Limpar filtros
        </Button>
      </div>

      {activeFilterChips.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
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
