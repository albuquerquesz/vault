import { jsx as _jsx } from "react/jsx-runtime";
import { Card } from "@vault/ui/components/card";
import { cn } from "@vault/ui/lib/utils";
export function DashboardCard({ className, ...props }) {
    return (_jsx(Card, { className: cn("rounded-none bg-transparent shadow-none ring-0", className), ...props }));
}
