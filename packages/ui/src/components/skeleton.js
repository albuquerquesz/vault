import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
function Skeleton({ className, ...props }) {
    return (_jsx("div", { "data-slot": "skeleton", className: cn("animate-pulse rounded-none bg-muted", className), ...props }));
}
export { Skeleton };
