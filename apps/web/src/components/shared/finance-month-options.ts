import { getMonthValue } from "@/features/finance/sdk";
import type { FinanceMonthOption } from "./finance-month-select";

export function buildFinanceMonthOptions(count = 12): FinanceMonthOption[] {
	const now = new Date();
	const currentYear = now.getFullYear();

	return Array.from({ length: count }, (_, index) => {
		const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
		const month = date.toLocaleDateString("pt-BR", { month: "long" });
		const label = `${month.charAt(0).toUpperCase()}${month.slice(1)}`;

		return {
			value: getMonthValue(date),
			label: date.getFullYear() === currentYear ? label : `${label} ${date.getFullYear()}`,
		};
	});
}

export function formatFinanceMonth(month: string) {
	return new Date(`${month}-01T12:00:00`).toLocaleDateString("pt-BR", {
		month: "long",
		year: "numeric",
	});
}
