import { Button } from "@vault/ui/components/button";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@vault/ui/components/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@vault/ui/components/empty";
import { ArrowRightIcon, CircleCheckIcon } from "lucide-react";
import { DashboardCard } from "@/components/dashboard-card";

export function BillingHealth() {
	return (
		<DashboardCard className="gap-0">
			<CardHeader className="border-b">
				<CardTitle className="text-balance text-base">Billing health</CardTitle>
				<CardDescription className="text-pretty">
					Nothing urgent needs your attention.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex h-full items-center px-0">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<CircleCheckIcon aria-hidden="true" />
						</EmptyMedia>
						<EmptyTitle>You're caught up.</EmptyTitle>
						<EmptyDescription className="text-xs">
							Balances and payouts look fine. nothing overdue in this snapshot.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button
							variant="ghost"
							render={<a href="/#" />}
							nativeButton={false}
						>
							Review open invoices
							<ArrowRightIcon aria-hidden="true" />
						</Button>
					</EmptyContent>
				</Empty>
			</CardContent>
		</DashboardCard>
	);
}
