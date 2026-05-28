import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import { useMemo, useState } from "react";
import { formatFullCurrency, formatPercent } from "@/components/formater";

const monthDays = new Date(
	new Date().getFullYear(),
	new Date().getMonth() + 1,
	0,
).getDate();

export function StabilityPage() {
	const [salary, setSalary] = useState(5000);
	const [spent, setSpent] = useState(1690);
	const today = new Date().getDate();

	const metrics = useMemo(() => {
		const remainingBudget = salary - spent;
		const remainingDays = Math.max(1, monthDays - today + 1);
		const dailyCap = remainingBudget > 0 ? remainingBudget / remainingDays : 0;
		const spentPct = salary > 0 ? (spent / salary) * 100 : 0;
		return { remainingBudget, remainingDays, dailyCap, spentPct };
	}, [salary, spent, today]);

	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Card className="financial-panel-border md:col-span-2">
				<CardHeader>
					<CardTitle>Stability planner</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
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
						<p className="text-sm text-muted-foreground">
							Total spent this month
						</p>
						<Input
							className="mt-2"
							type="number"
							min={0}
							value={spent}
							onChange={(e) =>
								setSpent(Math.max(0, Number(e.target.value || 0)))
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Spent percentage</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-semibold">
						{formatPercent(metrics.spentPct, 1)}
					</p>
				</CardContent>
			</Card>

			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Remaining budget</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-semibold">
						{formatFullCurrency(Math.max(0, metrics.remainingBudget))}
					</p>
				</CardContent>
			</Card>

			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Remaining days</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-semibold">{metrics.remainingDays}</p>
				</CardContent>
			</Card>

			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Recommended daily max spend</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-semibold">
						{formatFullCurrency(metrics.dailyCap)}
					</p>
					<p className="mt-2 text-sm text-muted-foreground">
						Formula: (salary - spent) / remaining days.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
