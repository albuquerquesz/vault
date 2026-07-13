import { jsx as _jsx } from "react/jsx-runtime";
import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/components/transactions-page";
export const Route = createFileRoute("/transactions")({
    component: RouteComponent,
});
function RouteComponent() {
    return _jsx(TransactionsPage, {});
}
