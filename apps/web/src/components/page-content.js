import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
/**
 * Shared content column cap for `/settings` and `/transactions`.
 * Fixed at 1200px.
 */
export const PAGE_CONTENT_MAX_WIDTH_CLASS = "max-w-[1200px]";
export function PageContent({ className, children, ...props }) {
    return (_jsx("div", { className: cn("mx-auto w-full", PAGE_CONTENT_MAX_WIDTH_CLASS, className), ...props, children: children }));
}
