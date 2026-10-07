import { useChartStable } from "@/components/charts/chart-context";
import { maskMonetaryText, useMonetaryVisibility } from "@/components/monetary-visibility";

const compactCurrency = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
	notation: "compact",
	maximumFractionDigits: 1,
});

export function SummarySelectedBarLabel() {
	const { data, barScale, bandWidth, yScale, innerHeight, chartStatus } = useChartStable();
	const { isVisible } = useMonetaryVisibility();
	const point = data.find((datum) => datum.selected);
	if (chartStatus === "loading" || !point || typeof point.balance !== "number" || !barScale || !bandWidth) {
		return null;
	}
	const bandX = barScale(String(point.name));
	if (bandX === undefined) return null;
	const top = Math.min(yScale(point.balance), yScale(0));
	return (
		<text
			x={bandX + bandWidth / 2}
			y={Math.max(-12, Math.min(innerHeight - 12, top - 10))}
			textAnchor="middle"
			fill="var(--foreground)"
			className="pointer-events-none text-xs font-semibold"
		>
			{maskMonetaryText(compactCurrency.format(point.balance), isVisible)}
		</text>
	);
}
