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
import { useMemo, useState } from "react";
import { formatFullCurrency, formatPercent } from "@/components/formater";

const categories = [
	"Housing",
	"Food",
	"Transport",
	"Health",
	"Leisure",
	"Other",
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
		category: "Housing",
		note: "Rent",
	},
	{
		id: "2",
		date: "2026-05-06",
		amount: 220,
		category: "Food",
		note: "Groceries",
	},
	{
		id: "3",
		date: "2026-05-12",
		amount: 90,
		category: "Transport",
		note: "Fuel",
	},
	{
		id: "4",
		date: "2026-05-18",
		amount: 180,
		category: "Leisure",
		note: "Weekend",
	},
];

export function ExpensesPage() {
	const [salary, setSalary] = useState(5000);
	const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
	const [form, setForm] = useState({
		date: new Date().toISOString().slice(0, 10),
		amount: "",
		category: categories[0],
		note: "",
	});

	const totalSpent = useMemo(
		() => expenses.reduce((acc, expense) => acc + expense.amount, 0),
		[expenses],
	);

	const spentPercentage = salary > 0 ? (totalSpent / salary) * 100 : 0;

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
	}

	return (
		<div className="grid gap-4">
			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Monthly expenses</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-3">
					<div>
						<p className="text-sm text-muted-foreground">Monthly salary</p>
						<Input
							className="mt-2"
							type="number"
							min={1}
							value={salary}
							onChange={(e) =>
								setSalary(Math.max(0, Number(e.target.value || 0)))
							}
						/>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Total spent</p>
						<p className="mt-2 text-2xl font-semibold">
							{formatFullCurrency(totalSpent)}
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Spent vs salary</p>
						<p className="mt-2 text-2xl font-semibold">
							{formatPercent(spentPercentage, 1)}
						</p>
					</div>
				</CardContent>
			</Card>

			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Add expense</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="grid gap-3 md:grid-cols-2" onSubmit={onAddExpense}>
						<div className="grid gap-1.5">
							<Label htmlFor="expense-date">Date</Label>
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
							<Label htmlFor="expense-amount">Amount</Label>
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
							<Label htmlFor="expense-category">Category</Label>
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
							<Label htmlFor="expense-note">Note (optional)</Label>
							<Input
								id="expense-note"
								placeholder="What was this expense for?"
								value={form.note}
								onChange={(e) =>
									setForm((prev) => ({ ...prev, note: e.target.value }))
								}
							/>
						</div>
						<div className="md:col-span-2">
							<Button type="submit">Save expense</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Expense list</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-2">
					{expenses.map((expense) => (
						<div
							key={expense.id}
							className="flex flex-wrap items-center justify-between gap-2 border border-border p-3"
						>
							<div>
								<p className="font-medium">{expense.note ?? "Expense"}</p>
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
		</div>
	);
}
