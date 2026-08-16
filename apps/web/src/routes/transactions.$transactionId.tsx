import { createFileRoute } from "@tanstack/react-router";
import { TransactionDetailPage } from "@/components/transaction-detail-page";

export const Route = createFileRoute("/transactions/$transactionId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { transactionId } = Route.useParams();
	return <TransactionDetailPage transactionId={transactionId} />;
}
