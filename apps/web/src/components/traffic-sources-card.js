"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, } from "@vault/ui/components/card";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@vault/ui/components/tooltip";
import { cn } from "@vault/ui/lib/utils";
import { Clock3Icon, Info } from "lucide-react";
const DEFAULT_DATA = [
    { label: "Organic search", value: 4100 },
    { label: "Direct", value: 2900 },
    { label: "Referral", value: 1600 },
    { label: "Paid social", value: 980 },
];
const FILLED_SEGMENT_CLASSES = [
    "bg-foreground/62",
    "bg-foreground/54",
    "bg-foreground/46",
    "bg-foreground/38",
    "bg-foreground/30",
];
const TRACK_SEGMENT_CLASS = "bg-foreground/[0.10]";
const SEGMENT_COUNT = 28;
function formatCompactNumber(value, locale = "en-US") {
    return new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}
function SegmentedBar({ filledSegments, filledClassName, }) {
    return (_jsx("div", { className: "grid gap-1", style: {
            gridTemplateColumns: `repeat(${SEGMENT_COUNT}, minmax(0, 1fr))`,
        }, children: Array.from({ length: SEGMENT_COUNT }, (_, index) => (_jsx("span", { className: cn("h-[4px] rounded-full", index < filledSegments ? filledClassName : TRACK_SEGMENT_CLASS) }, `segment-${index}`))) }));
}
export function TrafficSourcesCard({ title = "Canais de origem", data = DEFAULT_DATA, detailHref, }) {
    const maxValue = Math.max(...data.map((item) => item.value), 1);
    return (_jsxs(Card, { className: "financial-panel-border h-full min-h-[18rem] w-full ring-0", children: [_jsx(CardHeader, { className: "border-b", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsxs(CardDescription, { className: "flex items-center gap-2 text-base", children: [_jsx(Clock3Icon, { className: "size-4 text-muted-foreground" }), _jsx("span", { children: title })] }) }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { render: () => (_jsx(Info, { className: "mt-0.5 size-4 text-muted-foreground" })) }), _jsx(TooltipContent, { children: "Principais canais de origem de tr\u00E1fego" })] })] }) }), _jsx(CardContent, { className: "flex h-full flex-col", children: _jsx("div", { className: "flex h-full flex-col gap-5", children: data.map((item, index) => {
                        const filledSegments = Math.max(2, Math.round((item.value / maxValue) * SEGMENT_COUNT));
                        return (_jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex items-baseline justify-between gap-4", children: [_jsx("span", { className: "text-[1.1rem] font-medium tracking-tight text-foreground md:text-[1.25rem]", children: item.label }), _jsx("span", { className: "font-['Space_Grotesk'] text-[1.05rem] text-muted-foreground md:text-[1.15rem]", children: formatCompactNumber(item.value) })] }), _jsx(SegmentedBar, { filledSegments: filledSegments, filledClassName: FILLED_SEGMENT_CLASSES[index % FILLED_SEGMENT_CLASSES.length] })] }, item.label));
                    }) }) })] }));
}
