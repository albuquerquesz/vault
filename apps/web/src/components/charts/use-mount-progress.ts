import { useEffect, useState } from "react";

/**
 * Returns a value from 0→1 that represents how far through the mount animation we are.
 * Useful for driving progress-based animations.
 */
export function useMountProgress(durationMs: number = 1100): number {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const start = performance.now();
		const frame = requestAnimationFrame(function tick(now) {
			const elapsed = now - start;
			const p = Math.min(elapsed / durationMs, 1);
			setProgress(p);
			if (p < 1) {
				requestAnimationFrame(tick);
			}
		});
		return () => cancelAnimationFrame(frame);
	}, [durationMs]);

	return progress;
}