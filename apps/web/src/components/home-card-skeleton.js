import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Card, CardContent, CardHeader } from "@vault/ui/components/card";
import { Skeleton } from "@vault/ui/components/skeleton";
import { cn } from "@vault/ui/lib/utils";
function HeaderBlock({ left, right, className, }) {
    return (_jsx(CardHeader, { className: cn("gap-4", className), children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsx("div", { className: "min-w-0 flex-1", children: left }), right ? _jsx("div", { className: "shrink-0", children: right }) : null] }) }));
}
function SavingsSkeleton() {
    return (_jsxs(_Fragment, { children: [_jsx(HeaderBlock, { left: _jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-5 w-40" }), _jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [_jsx(Skeleton, { className: "h-10 w-36" }), _jsx(Skeleton, { className: "h-7 w-44" })] })] }) }), _jsx(CardContent, { className: "flex h-full flex-col", children: _jsxs("div", { className: "relative h-56", children: [_jsx(Skeleton, { className: "h-full w-full" }), _jsxs("div", { className: "absolute inset-x-0 bottom-4 flex items-center justify-between px-4", children: [_jsx(Skeleton, { className: "h-2.5 w-10" }), _jsx(Skeleton, { className: "h-2.5 w-10" }), _jsx(Skeleton, { className: "h-2.5 w-10" }), _jsx(Skeleton, { className: "h-2.5 w-10" })] })] }) })] }));
}
function MixSkeleton() {
    return (_jsxs(_Fragment, { children: [_jsx(HeaderBlock, { className: "gap-4", left: _jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-10 w-32" }), _jsx(Skeleton, { className: "h-6 w-52" })] }), right: _jsxs("div", { className: "space-y-2 text-right", children: [_jsx(Skeleton, { className: "ml-auto h-8 w-16" }), _jsx(Skeleton, { className: "ml-auto h-5 w-36" })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:items-center", children: [_jsx(Skeleton, { className: "mx-auto h-72 w-full max-w-72 rounded-full" }), _jsx("div", { className: "space-y-4", children: Array.from({ length: 5 }).map((_, index) => (_jsxs("div", { className: "flex flex-col gap-2 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-x-4", children: [_jsxs("div", { className: "flex items-center gap-3 sm:contents", children: [_jsx(Skeleton, { className: "h-3 w-3" }), _jsx(Skeleton, { className: "h-5 w-full" })] }), _jsx(Skeleton, { className: "h-5 w-12" }), _jsx(Skeleton, { className: "h-5 w-20" }), _jsx(Skeleton, { className: "h-5 w-5" })] }, `mix-row-${index}`))) })] }) })] }));
}
export function HeatmapSkeletonContent() {
    return (_jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "hidden grid-cols-[1.8rem_minmax(0,1fr)] items-start gap-3 md:grid", children: [_jsx("div", { className: "grid gap-2 pt-0.5", children: Array.from({ length: 7 }).map((_, index) => (_jsx(Skeleton, { className: "h-3 w-5" }, `heatmap-label-${index}`))) }), _jsx("div", { className: "grid gap-2", children: Array.from({ length: 7 }).map((_, rowIndex) => (_jsx("div", { className: "grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1", children: Array.from({ length: 24 }).map((_, colIndex) => (_jsx(Skeleton, { className: "h-3 w-full rounded-[2px]" }, `heatmap-cell-${rowIndex}-${colIndex}`))) }, `heatmap-row-${rowIndex}`))) })] }), _jsxs("div", { className: "hidden grid-cols-[1.8rem_minmax(0,1fr)] gap-3 md:grid", children: [_jsx("span", {}), _jsx("div", { className: "grid grid-cols-5 gap-2", children: Array.from({ length: 5 }).map((_, index) => (_jsx(Skeleton, { className: "h-3 w-full" }, `heatmap-hour-${index}`))) })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Skeleton, { className: "h-3 w-10" }), _jsx("div", { className: "flex items-center gap-1.5", children: Array.from({ length: 5 }).map((_, index) => (_jsx(Skeleton, { className: "h-2.5 w-3.5" }, `heatmap-legend-${index}`))) }), _jsx(Skeleton, { className: "h-3 w-10" })] })] }));
}
function BillsSkeleton() {
    return (_jsxs(_Fragment, { children: [_jsx(HeaderBlock, { className: "gap-4", left: _jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-5 w-28" }), _jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-12 w-40" }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx(Skeleton, { className: "h-5 w-28" }), _jsx(Skeleton, { className: "h-5 w-5" }), _jsx(Skeleton, { className: "h-5 w-24" })] })] })] }) }), _jsxs(CardContent, { className: "flex h-full flex-col", children: [_jsxs("div", { className: "mt-2 flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [_jsx(Skeleton, { className: "h-9 w-9 rounded-xl" }), _jsx(Skeleton, { className: "h-6 w-20" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Skeleton, { className: "h-6 w-32" }), _jsx(Skeleton, { className: "h-8 w-14 rounded-full" })] })] }), _jsx(Skeleton, { className: "mt-5 h-px w-full" })] })] }));
}
function CategorySkeleton() {
    return (_jsxs(_Fragment, { children: [_jsx(HeaderBlock, { left: _jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-7 w-56" }), _jsx(Skeleton, { className: "h-5 w-28" })] }) }), _jsx(CardContent, { className: "my-auto p-0", children: _jsxs("div", { className: "flex h-80 w-full flex-col items-center justify-center gap-8 px-4", children: [_jsx(Skeleton, { className: "h-52 w-52 rounded-full" }), _jsx("div", { className: "flex w-full flex-wrap justify-center gap-3", children: Array.from({ length: 5 }).map((_, index) => (_jsx(Skeleton, { className: "h-6 w-24" }, `category-legend-${index}`))) })] }) })] }));
}
function InvestmentSkeleton() {
    return (_jsxs(_Fragment, { children: [_jsx(HeaderBlock, { left: _jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-5 w-28" }), _jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [_jsx(Skeleton, { className: "h-10 w-40" }), _jsx(Skeleton, { className: "h-7 w-20" })] })] }), right: _jsx(Skeleton, { className: "h-5 w-24" }) }), _jsxs(CardContent, { className: "flex h-full flex-col", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between gap-3", children: [_jsx(Skeleton, { className: "h-4 w-28" }), _jsx(Skeleton, { className: "h-4 w-32" })] }), _jsxs("div", { className: "relative h-[15.5rem]", children: [_jsx(Skeleton, { className: "absolute inset-0" }), _jsx("div", { className: "absolute inset-x-4 bottom-3 flex items-end justify-between gap-2", children: Array.from({ length: 6 }).map((_, index) => (_jsx(Skeleton, { className: "h-16 w-full rounded-t-xl" }, `investment-bar-${index}`))) })] })] })] }));
}
function SpendingLimitSkeleton() {
    return (_jsxs(_Fragment, { children: [_jsx(CardHeader, { className: "border-b" }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-10 w-48" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Skeleton, { className: "h-3 w-32" }), _jsx(Skeleton, { className: "h-3 w-24" })] }), _jsx(Skeleton, { className: "h-1.5 w-full rounded-full" })] })] })] }));
}
const skeletonByVariant = {
    savings: SavingsSkeleton,
    mix: MixSkeleton,
    heatmap: HeatmapSkeletonContent,
    bills: BillsSkeleton,
    category: CategorySkeleton,
    investment: InvestmentSkeleton,
    "spending-limit": SpendingLimitSkeleton,
};
export function HomeCardSkeleton({ variant, className, }) {
    const SkeletonContent = skeletonByVariant[variant];
    return (_jsx(Card, { className: cn("financial-panel-border h-full min-h-[32rem] ring-0", className), children: _jsx(SkeletonContent, {}) }));
}
