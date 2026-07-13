import type { Transition } from "motion/react";
import { useEffect, useState } from "react";
import { DEFAULT_ANIMATION_DURATION_MS } from "../animation";

/**
 * Returns a value from 0→1 that represents how far through the mount animation we are.
 * Useful for driving progress-based animations.
 */
export function useMountProgress(
	enterTransition?: Transition,
	animationDelay: number = 0,
	animationKey: number = 0,
): number {
	const [progress, setProgress] = useState(0);
	const duration =
		typeof enterTransition?.duration === "number"
			? enterTransition.duration * 1000
			: DEFAULT_ANIMATION_DURATION_MS;

	useEffect(() => {
		const start = performance.now() + animationDelay * 1000;
		const frame = requestAnimationFrame(function tick(now) {
			const elapsed = now - start;
			const p = Math.min(elapsed / duration, 1);
			setProgress(p);
			if (p < 1) {
				requestAnimationFrame(tick);
			}
		});
		return () => cancelAnimationFrame(frame);
	}, [duration, animationDelay, animationKey]);

	return progress;
}