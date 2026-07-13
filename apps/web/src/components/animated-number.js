"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
export function AnimatedNumber({ value, start = 0, duration = 0.9, format = (nextValue) => nextValue.toString(), className, }) {
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
    return _jsx("span", { className: className, children: format(displayValue) });
}
