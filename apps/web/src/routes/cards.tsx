import { createFileRoute, redirect } from "@tanstack/react-router";
import { CreditCardsPage } from "@/components/credit-cards-page";
import { getMonthValue } from "@/features/finance/sdk";
import { authClient } from "@/lib/auth-client";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

export const Route = createFileRoute("/cards")({
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
	return <CreditCardsPage initialMonth={month ?? getMonthValue()} />;
}
