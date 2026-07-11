"use client";

import { Badge } from "@vault/ui/components/badge";
import { Button } from "@vault/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vault/ui/components/table";
import {
  cn,
} from "@vault/ui/lib/utils";
import { MaskedMonetaryValue } from "@/components/monetary-visibility";
import type { FinanceExpense } from "@/features/finance/sdk";
import {
  formatBRLNegative,
  getCategoryColor,
  type TransactionsActiveFilterChip,
} from "./utils";

function formatExpenseDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function TransactionsTable({
  expenses,
  hasActiveFilters,
  monthLabel,
  activeFilterChips,
  onClearFilters,
}: {
  expenses: FinanceExpense[];
  hasActiveFilters: boolean;
  monthLabel: string;
  activeFilterChips: TransactionsActiveFilterChip[];
  onClearFilters: () => void;
}) {
  return (
    expenses.length === 0 ? (
      <div className="grid gap-3 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">
          {hasActiveFilters
            ? "Nenhum resultado para os filtros atuais"
            : `Nenhuma transação em ${monthLabel}`}
        </p>
        <p className="max-w-md justify-self-center text-sm text-muted-foreground">
          {hasActiveFilters
            ? activeFilterChips.length > 0
              ? `Nenhum lançamento corresponde a ${activeFilterChips.map((chip) => chip.label.toLowerCase()).join(" e ")}.`
              : "Tente limpar os filtros para expandir a lista."
            : "Quando despesas forem registradas, elas aparecerão aqui."}
        </p>
        {hasActiveFilters ? (
          <div>
            <Button onClick={onClearFilters} variant="outline">
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </div>
    ) : (
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-muted/30">
            <TableHead className="px-4 text-muted-foreground">Data</TableHead>
            <TableHead className="px-4 text-muted-foreground">
              Descrição
            </TableHead>
            <TableHead className="px-4 text-muted-foreground">
              Categoria
            </TableHead>
            <TableHead className="px-4 text-right text-muted-foreground">
              Valor
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="h-12 hover:bg-accent/40">
              <TableCell className="px-4 py-3 font-medium whitespace-nowrap text-muted-foreground">
                {formatExpenseDate(expense.expenseDate)}
              </TableCell>
              <TableCell className="max-w-0 px-4 py-3">
                <p className="truncate text-sm font-medium text-foreground">
                  {expense.note || "Despesa"}
                </p>
              </TableCell>
              <TableCell className="px-4 py-3 whitespace-nowrap">
                <Badge
                  variant="outline"
                  className={cn("text-xs", getCategoryColor(expense.category))}
                >
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3 text-right text-base font-semibold tabular-nums whitespace-nowrap text-red-500">
                <MaskedMonetaryValue
                  format={formatBRLNegative}
                  prefix="-R$"
                  value={Number(expense.amount)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  );
}
