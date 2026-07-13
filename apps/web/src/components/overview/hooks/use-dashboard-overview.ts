"use client";

import { useMemo, useState } from "react";
import { getMonthValue } from "@/features/finance/sdk";
import { authClient } from "@/lib/auth-client";

type MonthOption = {
	value: string;
	label: string;
};

function generateMonthOptions(count = 6): MonthOption[] {
	const now = new Date();
	const options: MonthOption[] = [];

	for (let index = 0; index < count; index++) {
		const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
		const value = getMonthValue(monthDate);
		const label = monthDate.toLocaleDateString("pt-BR", {
			month: "long",
			year: "numeric",
		});

		options.push({
			value,
			label: label.charAt(0).toUpperCase() + label.slice(1),
		});
	}

	return options;
}

export function useDashboardOverview() {
	const { data: session } = authClient.useSession();
	const [selectedMonth, setSelectedMonth] = useState(getMonthValue());
	const monthOptions = useMemo(() => generateMonthOptions(6), []);
	const firstName = session?.user.name?.split(" ")[0] ?? "";

	return {
		selectedMonth,
		setSelectedMonth,
		monthOptions,
		firstName,
	};
}
