"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
import { motion } from "motion/react";
import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useChart, useChartStable } from "./chart-context";
function BarYAxisLabel({ label, y, bandHeight, isHovered, }) {
    return (_jsx("div", { className: "absolute right-0 flex items-center justify-end pr-2", style: {
            top: y,
            height: bandHeight,
        }, children: _jsx(motion.span, { animate: {
                opacity: isHovered ? 1 : 0.7,
                color: isHovered
                    ? "var(--foreground)"
                    : "var(--chart-label, var(--color-zinc-500))",
            }, className: cn("truncate whitespace-nowrap text-right text-xs"), initial: {
                opacity: 0.7,
                color: "var(--chart-label, var(--color-zinc-500))",
            }, style: { maxWidth: 70 }, transition: { duration: 0.15 }, children: label }) }));
}
export function BarYAxis(props) {
    const { containerRef, barScale } = useChartStable();
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const container = containerRef.current;
    if (!(mounted && container)) {
        return null;
    }
    if (!barScale) {
        return null;
    }
    return _jsx(BarYAxisInner, { ...props, container: container });
}
const BarYAxisInner = memo(function BarYAxisInner({ showAllLabels = true, maxLabels = 20, container, }) {
    const { margin, barScale, bandWidth, barXAccessor, data, hoveredBarIndex } = useChart();
    // Generate labels for each bar
    const labelsToShow = useMemo(() => {
        if (!(barScale && bandWidth && barXAccessor)) {
            return [];
        }
        const allLabels = data.map((d, i) => {
            const label = barXAccessor(d);
            const bandY = barScale(label) ?? 0;
            // Center the label vertically within the band
            const y = bandY + margin.top;
            return { label, y, bandHeight: bandWidth, index: i };
        });
        // If showAllLabels is true or we have fewer than maxLabels, show all
        if (showAllLabels || allLabels.length <= maxLabels) {
            return allLabels;
        }
        // Otherwise, skip some labels to avoid crowding
        const step = Math.ceil(allLabels.length / maxLabels);
        return allLabels.filter((_, i) => i % step === 0);
    }, [
        barScale,
        bandWidth,
        barXAccessor,
        data,
        margin.top,
        showAllLabels,
        maxLabels,
    ]);
    return createPortal(_jsx("div", { className: "pointer-events-none absolute top-0 bottom-0", style: {
            left: 0,
            width: margin.left,
        }, children: labelsToShow.map((item) => (_jsx(BarYAxisLabel, { bandHeight: item.bandHeight, isHovered: hoveredBarIndex === item.index, label: item.label, y: item.y }, `${item.label}-${item.y}`))) }), container);
});
BarYAxis.displayName = "BarYAxis";
export default BarYAxis;
