"use client";

import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type AnimatedNumberProps = {
	value: number;
	start?: number;
	duration?: number;
	format?: (value: number) => string;
	className?: string;
};

export function AnimatedNumber({
	value,
	start = 0,
	duration = 0.9,
	format = (nextValue) => nextValue.toString(),
	className,
}: AnimatedNumberProps) {
	const prefersReducedMotion = useReducedMotion();
	const motionValue = useMotionValue(start);
	const [displayValue, setDisplayValue] = useState(start);
	const hasAnimated = useRef(false);

	useEffect(() => {
		const from = hasAnimated.current ? motionValue.get() : start;
		motionValue.set(from);

		if (prefersReducedMotion) {
			motionValue.set(value);
			setDisplayValue(value);
			hasAnimated.current = true;
			return;
		}

		setDisplayValue(from);
		const unsubscribe = motionValue.on("change", (latest) => {
			setDisplayValue(latest);
		});
		const controls = animate(motionValue, value, {
			duration,
			ease: [0.22, 1, 0.36, 1],
		});

		hasAnimated.current = true;

		return () => {
			unsubscribe();
			controls.stop();
		};
	}, [duration, motionValue, prefersReducedMotion, start, value]);

	return <span className={className}>{format(displayValue)}</span>;
}
