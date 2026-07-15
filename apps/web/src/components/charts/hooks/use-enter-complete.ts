import { useEffect, useRef, useState } from "react";

/**
 * Returns true once the initial enter animation has completed.
 */
export function useEnterComplete(durationMs: number = 1100): boolean {
	const [complete, setComplete] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => {
		timerRef.current = setTimeout(() => setComplete(true), durationMs);
		return () => clearTimeout(timerRef.current);
	}, [durationMs]);

	return complete;
}
