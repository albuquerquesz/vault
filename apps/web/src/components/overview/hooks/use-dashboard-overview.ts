"use client";

import { useMemo, useState } from "react";
import { getMonthValue } from "@/features/finance/sdk";
import { authClient } from "@/lib/auth-client";

type MonthOption = {
	value: string;
	label: string;
};

function formatMonthLabel(date: Date, currentYear: number): string {
	const monthName = date.toLocaleDateString("pt-BR", { month: "long" });
	const capitalized =
		monthName.charAt(0).toUpperCase() + monthName.slice(1);

	// Include year only when the option is outside the current year
	// so labels stay short ("Julho") but stay unique across Dec/Jan.
	if (date.getFullYear() !== currentYear) {
		return `${capitalized} ${date.getFullYear()}`;
	}

	return capitalized;
}

function generateMonthOptions(count = 6): MonthOption[] {
	const now = new Date();
	const currentYear = now.getFullYear();
	const options: MonthOption[] = [];

	for (let index = 0; index < count; index++) {
		const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
		const value = getMonthValue(monthDate);

		options.push({
			value,
			label: formatMonthLabel(monthDate, currentYear),
		});
	}

	return options;
}

export function useDashboardOverview() {
	const { data: session } = authClient.useSession();
	const [selectedMonth, setSelectedMonth] = useState(getMonthValue());
	const monthOptions = useMemo(() => generateMonthOptions(6), []);
	const firstName = session?.user.name?.trim().split(/\s+/)[0] ?? "";

	return {
		selectedMonth,
		setSelectedMonth,
		monthOptions,
		firstName,
	};
}
