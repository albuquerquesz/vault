import { createFileRoute, redirect } from "@tanstack/react-router";
import { MonetaryVisibilityProvider } from "@/components/monetary-visibility";
import {
	ExpenseDistribution,
	PersonalFinanceSummary,
} from "@/components/personal-finance-summary";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard-v2")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session?.data) {
			throw redirect({ to: "/login", replace: true });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<main className="h-full w-full p-6">
			<MonetaryVisibilityProvider>
				<div className="space-y-6">
					<PersonalFinanceSummary />
					<ExpenseDistribution />
				</div>
			</MonetaryVisibilityProvider>
		</main>
	);
}
