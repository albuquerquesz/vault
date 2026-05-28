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
import { useState } from "react";
import { formatFullCurrency } from "@/components/formater";

const categories = [
	"Moradia",
	"Alimentação",
	"Transporte",
	"Saúde",
	"Lazer",
	"Outros",
];

type Expense = {
	id: string;
	date: string;
	amount: number;
	category: string;
	note?: string;
};

const initialExpenses: Expense[] = [
	{
		id: "1",
		date: "2026-05-02",
		amount: 1200,
		category: "Moradia",
		note: "Aluguel",
	},
	{
		id: "2",
		date: "2026-05-06",
		amount: 220,
		category: "Alimentação",
		note: "Mercado",
	},
	{
		id: "3",
		date: "2026-05-12",
		amount: 90,
		category: "Transporte",
		note: "Combustível",
	},
	{
		id: "4",
		date: "2026-05-18",
		amount: 180,
		category: "Lazer",
		note: "Fim de semana",
	},
];

export function ExpensesPage() {
	const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
	const [isOpen, setIsOpen] = useState(false);
	const [form, setForm] = useState({
		date: new Date().toISOString().slice(0, 10),
		amount: "",
		category: categories[0],
		note: "",
	});

	function onAddExpense(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const amount = Number(form.amount);
		if (!form.date || Number.isNaN(amount) || amount <= 0) return;

		setExpenses((prev) => [
			{
				id: crypto.randomUUID(),
				date: form.date,
				amount,
				category: form.category,
				note: form.note.trim() || undefined,
			},
			...prev,
		]);

		setForm((prev) => ({ ...prev, amount: "", note: "" }));
		setIsOpen(false);
	}

	return (
		<div className="grid gap-4">
			<Card className="border-0">
				<CardHeader className="flex flex-row items-center justify-between gap-2">
					<CardTitle className="text-2xl" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
						Lista de despesas
					</CardTitle>
					<Button onClick={() => setIsOpen(true)} size="sm">
						Adicionar despesa
					</Button>
				</CardHeader>
				<CardContent className="grid gap-2">
					{expenses.map((expense) => (
						<div
							key={expense.id}
							className="flex flex-wrap items-center justify-between gap-2 border border-border p-3"
						>
							<div>
								<p className="font-medium">{expense.note ?? "Despesa"}</p>
								<p className="text-sm text-muted-foreground">{expense.date}</p>
							</div>
							<div className="flex items-center gap-3">
								<Badge variant="outline">{expense.category}</Badge>
								<p className="font-semibold">
									{formatFullCurrency(expense.amount)}
								</p>
							</div>
						</div>
					))}
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
						<Button type="submit">Salvar despesa</Button>
					</form>
				</SheetContent>
			</Sheet>
		</div>
	);
}
