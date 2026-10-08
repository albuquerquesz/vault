"use client";

import { useMemo, useState } from "react";
import { buildFinanceMonthOptions } from "@/components/shared/finance-month-options";
import { getMonthValue } from "@/features/finance/sdk";
import { authClient } from "@/lib/auth-client";

export function useDashboardOverview() {
	const { data: session } = authClient.useSession();
	const [selectedMonth, setSelectedMonth] = useState(getMonthValue());
	const monthOptions = useMemo(() => buildFinanceMonthOptions(6), []);
	const firstName = session?.user.name?.trim().split(/\s+/)[0] ?? "";

	return {
		selectedMonth,
		setSelectedMonth,
		monthOptions,
		firstName,
	};
}
