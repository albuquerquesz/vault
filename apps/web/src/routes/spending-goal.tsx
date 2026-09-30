import { createFileRoute, redirect } from "@tanstack/react-router";
import { MonthlySpendingGoalPage } from "@/components/monthly-spending-goal-page";
import { getMonthValue } from "@/features/finance/sdk";
import { authClient } from "@/lib/auth-client";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

export const Route = createFileRoute("/spending-goal")({
	validateSearch: (search: Record<string, unknown>) => ({
		month:
			typeof search.month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(search.month)
				? search.month
			: undefined,
	}),
	beforeLoad: async () => {
		if (isDevAuthBypassEnabled()) return;

		const session = await authClient.getSession();
		if (!session?.data) {
			throw redirect({ to: "/login", replace: true });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { month } = Route.useSearch();
	return <MonthlySpendingGoalPage initialMonth={month ?? getMonthValue()} />;
}
