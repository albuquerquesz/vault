import { useEffect, useRef, useState } from "react";
/**
 * Returns true once the initial enter animation has completed.
 */
export function useEnterComplete(durationMs = 1100) {
    const [complete, setComplete] = useState(false);
    const timerRef = useRef(undefined);
    useEffect(() => {
        timerRef.current = setTimeout(() => setComplete(true), durationMs);
        return () => clearTimeout(timerRef.current);
    }, [durationMs]);
    return complete;
}
