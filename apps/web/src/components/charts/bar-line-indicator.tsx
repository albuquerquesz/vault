"use client";

import { motion, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useChart } from "./chart-context";

export type BarLineIndicatorProps = {
	/** Chart data series (same array passed to BarChart). */
	data: Record<string, unknown>[];
	/** Numeric value key on each datum. */
	valueKey: string;
	/** Categorical x key on each datum. */
	xKey: string;
	/** Indicator fill color. Default: var(--chart-1) */
	color?: string;
};

function AnimatedBarLine({
	barX,
	barTopY,
	barBottomY,
	width,
	isHovered,
	color,
}: {
	barX: number;
	barTopY: number;
	barBottomY: number;
	width: number;
	isHovered: boolean;
	color: string;
}) {
	const animatedY = useSpring(barBottomY, { stiffness: 300, damping: 30 });
	const animatedOpacity = useSpring(0, { stiffness: 300, damping: 30 });

	useEffect(() => {
		animatedY.set(isHovered ? barTopY : barBottomY);
		animatedOpacity.set(isHovered ? 1 : 0);
	}, [isHovered, barTopY, barBottomY, animatedY, animatedOpacity]);

	return (
		<motion.rect
			fill={color}
			height={2}
			style={{
				opacity: animatedOpacity,
				y: animatedY,
			}}
			width={width}
			x={barX}
		/>
	);
}

/**
 * Horizontal line that rises to the top of the hovered bar.
 * Pair with `<ChartTooltip showCrosshair={false} showDots={false} />`.
 */
export function BarLineIndicator({
	data,
	valueKey,
	xKey,
	color = "var(--chart-1)",
}: BarLineIndicatorProps) {
	const {
		barScale,
		bandWidth,
		innerHeight,
		margin,
		containerRef,
		hoveredBarIndex,
		yScale,
	} = useChart();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const container = containerRef.current;
	if (!(mounted && container && bandWidth && barScale && yScale)) {
		return null;
	}

	return createPortal(
		<svg
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 z-50"
			height="100%"
			width="100%"
		>
			<g transform={`translate(${margin.left},${margin.top})`}>
				{data.map((datum, index) => {
					const category = String(datum[xKey] ?? "");
					const rawValue = datum[valueKey];
					const value = typeof rawValue === "number" ? rawValue : 0;
					const barX = barScale(category) ?? 0;
					const barTopY = yScale(value) ?? innerHeight;
					const isHovered = hoveredBarIndex === index;

					return (
						<AnimatedBarLine
							barBottomY={innerHeight}
							barTopY={barTopY}
							barX={barX}
							color={color}
							isHovered={isHovered}
							key={`bar-line-${category}`}
							width={bandWidth}
						/>
					);
				})}
			</g>
		</svg>,
		container,
	);
}

BarLineIndicator.displayName = "BarLineIndicator";

export default BarLineIndicator;
