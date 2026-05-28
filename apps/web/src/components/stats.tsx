import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";

type Stat = {
	label: string;
	value: string;
	delta: number;
	hint: string;
};

const stats: readonly Stat[] = [
	{
		label: "Receita total",
		value: "$284,920",
		delta: 8.2,
		hint: "vs 30 dias anteriores",
	},
	{
		label: "Pedidos",
		value: "1,842",
		delta: 4.1,
		hint: "vs 30 dias anteriores",
	},
	{
		label: "Ticket médio",
		value: "$154.60",
		delta: -1.3,
		hint: "vs 30 dias anteriores",
	},
	{
		label: "Conversão da loja",
		value: "3.06%",
		delta: 0.6,
		hint: "vs 30 dias anteriores",
	},
] as const;

export function DashboardStats() {
	return (
		<>
			{stats.map((s) => (
				<StatCard key={s.label} stat={s} />
			))}
		</>
	);
}

function StatCard({ stat }: { stat: Stat }) {
	const { label, value, delta, hint } = stat;
	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-normal text-muted-foreground text-xs">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-balance font-semibold text-2xl tabular-nums tracking-tight">
					{value}
				</p>
			</CardContent>
			<CardFooter className="gap-1.5 text-xs">
				<Delta value={delta} variant="default">
					<DeltaIcon />
					<DeltaValue />
				</Delta>
				<span className="text-pretty text-muted-foreground">{hint}</span>
			</CardFooter>
		</Card>
	);
}
