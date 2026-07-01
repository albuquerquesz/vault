import { Badge } from "@vault/ui/components/badge";
import { Button } from "@vault/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@vault/ui/components/sheet";
import { useMemo, useState } from "react";
import Loader from "@/components/loader";
import { formatFullCurrency } from "@/components/formater";
import {
	getMonthValue,
	useCreateExpense,
	useFinanceExpenses,
} from "@/features/finance/sdk";

const categories = [
	"Moradia",
	"Alimentação",
	"Transporte",
	"Saúde",
	"Lazer",
	"Outros",
];

export function ExpensesPage() {
	const currentMonth = useMemo(() => getMonthValue(), []);
	const expensesQuery = useFinanceExpenses(currentMonth);
	const createExpense = useCreateExpense(currentMonth);
	const [isOpen, setIsOpen] = useState(false);
	const [form, setForm] = useState({
		date: new Date().toISOString().slice(0, 10),
		amount: "",
		category: categories[0],
		note: "",
	});

	async function onAddExpense(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const amount = Number(form.amount);
		if (!form.date || Number.isNaN(amount) || amount <= 0) return;

		await createExpense.mutateAsync({
			date: form.date,
			amount,
			category: form.category,
			note: form.note.trim() || undefined,
		});

		setForm((prev) => ({
			...prev,
			date: new Date().toISOString().slice(0, 10),
			amount: "",
			note: "",
		}));
		setIsOpen(false);
	}

	if (expensesQuery.isPending) {
		return <Loader />;
	}

	if (expensesQuery.isError) {
		return (
			<Card className="border-0">
				<CardHeader>
					<CardTitle>Lista de despesas</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					Não foi possível carregar as despesas.
				</CardContent>
			</Card>
		);
	}

	const expenses = expensesQuery.data ?? [];

	return (
		<div className="grid gap-4">
			<Card className="border-0">
				<CardHeader className="flex flex-row items-center justify-between gap-2">
					<CardTitle
						className="text-2xl"
						style={{ fontFamily: '"Space Grotesk", sans-serif' }}
					>
						Lista de despesas
					</CardTitle>
					<Button onClick={() => setIsOpen(true)} size="sm">
						Adicionar despesa
					</Button>
				</CardHeader>
				<CardContent className="grid gap-2">
					{expenses.length === 0 ? (
						<div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
							Nenhuma despesa cadastrada neste mes.
						</div>
					) : (
						expenses.map((expense) => (
							<div
								key={expense.id}
								className="flex flex-wrap items-center justify-between gap-2 border border-border p-3"
							>
								<div>
									<p className="font-medium">{expense.note ?? "Despesa"}</p>
									<p className="text-sm text-muted-foreground">
										{expense.expenseDate}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant="outline">{expense.category}</Badge>
									<p className="font-semibold">
										{formatFullCurrency(expense.amount)}
									</p>
								</div>
							</div>
						))
					)}
				</CardContent>
			</Card>

			<Sheet open={isOpen} onOpenChange={setIsOpen}>
				<SheetContent side="right">
					<SheetHeader>
						<SheetTitle>Adicionar despesa</SheetTitle>
					</SheetHeader>
					<form className="mt-4 grid gap-3" onSubmit={onAddExpense}>
						<div className="grid gap-1.5">
							<Label htmlFor="expense-date">Data</Label>
							<Input
								id="expense-date"
								type="date"
								value={form.date}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, date: e.target.value }))
								}
							/>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="expense-amount">Valor</Label>
							<Input
								id="expense-amount"
								type="number"
								step="0.01"
								min={0.01}
								value={form.amount}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, amount: e.target.value }))
								}
								required
							/>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="expense-category">Categoria</Label>
							<select
								id="expense-category"
								className="h-9 rounded-md border border-input bg-background px-3 text-sm"
								value={form.category}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, category: e.target.value }))
								}
							>
								{categories.map((category) => (
									<option key={category} value={category}>
										{category}
									</option>
								))}
							</select>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="expense-note">Observação (opcional)</Label>
							<Input
								id="expense-note"
								placeholder="Para que foi esta despesa?"
								value={form.note}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, note: e.target.value }))
								}
							/>
						</div>
						<Button type="submit" disabled={createExpense.isPending}>
							{createExpense.isPending ? "Salvando..." : "Salvar despesa"}
						</Button>
					</form>
				</SheetContent>
			</Sheet>
		</div>
	);
}
