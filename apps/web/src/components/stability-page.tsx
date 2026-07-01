import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import { useEffect, useMemo, useState } from "react";
import { formatFullCurrency, formatPercent } from "@/components/formater";
import Loader from "@/components/loader";
import {
	getMonthValue,
	getTodayValue,
	useFinanceMonthlyOverview,
	useUpsertMonthlyBudget,
} from "@/features/finance/sdk";

export function StabilityPage() {
	const month = useMemo(() => getMonthValue(), []);
	const today = useMemo(() => getTodayValue(), []);
	const overviewQuery = useFinanceMonthlyOverview(month, today);
	const saveBudget = useUpsertMonthlyBudget(month, today);
	const [salary, setSalary] = useState(0);

	useEffect(() => {
		if (overviewQuery.data) {
			setSalary(overviewQuery.data.income);
		}
	}, [overviewQuery.data]);

	const metrics = useMemo(
		() =>
			overviewQuery.data ?? {
				month,
				income: salary,
				spent: 0,
				spentPercentage: 0,
				remainingBudget: salary,
				remainingDays: 0,
				dailyCap: 0,
			},
		[month, overviewQuery.data, salary],
	);

	async function onSaveBudget() {
		if (salary <= 0) return;
		await saveBudget.mutateAsync({
			month,
			income: salary,
		});
	}

	if (overviewQuery.isPending) {
		return <Loader />;
	}

	if (overviewQuery.isError) {
		return (
			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Planejador de estabilidade</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					Não foi possível carregar os indicadores financeiros.
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Card className="financial-panel-border md:col-span-2">
				<CardHeader>
					<CardTitle>Planejador de estabilidade</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<div>
						<p className="text-sm text-muted-foreground">Salário mensal</p>
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
							Total gasto neste mês
						</p>
						<div className="mt-2 flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-foreground">
							{formatFullCurrency(metrics.spent)}
						</div>
					</div>
					<div className="md:col-span-2">
						<Button onClick={onSaveBudget} disabled={saveBudget.isPending || salary <= 0}>
							{saveBudget.isPending ? "Salvando..." : "Salvar salário do mês"}
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Percentual gasto</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-semibold">
						{formatPercent(metrics.spentPercentage, 1)}
					</p>
				</CardContent>
			</Card>

			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Orçamento restante</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-semibold">
						{formatFullCurrency(Math.max(0, metrics.remainingBudget))}
					</p>
				</CardContent>
			</Card>

			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Dias restantes</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-semibold">{metrics.remainingDays}</p>
				</CardContent>
			</Card>

			<Card className="financial-panel-border">
				<CardHeader>
					<CardTitle>Gasto diário máximo recomendado</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-semibold">
						{formatFullCurrency(metrics.dailyCap)}
					</p>
					<p className="mt-2 text-sm text-muted-foreground">
						Fórmula: (salário - gasto) / dias restantes.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
