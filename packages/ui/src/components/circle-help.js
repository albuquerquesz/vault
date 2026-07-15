"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
import { motion, useAnimation } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
const VARIANTS = {
    normal: { rotate: 0 },
    animate: { rotate: [0, -10, 10, -10, 0] },
};
const CircleHelpIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);
    useImperativeHandle(ref, () => {
        isControlledRef.current = true;
        return {
            startAnimation: () => controls.start("animate"),
            stopAnimation: () => controls.start("normal"),
        };
    });
    const handleMouseEnter = useCallback((e) => {
        if (isControlledRef.current) {
            onMouseEnter?.(e);
            return;
        }
        controls.start("animate");
    }, [controls, onMouseEnter]);
    const handleMouseLeave = useCallback((e) => {
        if (isControlledRef.current) {
            onMouseLeave?.(e);
            return;
        }
        controls.start("normal");
    }, [controls, onMouseLeave]);
    return (_jsx("div", { "aria-label": "Help icon", className: cn(className), onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, role: "img", ...props, children: _jsxs("svg", { "aria-hidden": "true", fill: "none", focusable: "false", height: size, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", width: size, xmlns: "http://www.w3.org/2000/svg", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsxs(motion.g, { animate: controls, transition: {
                        duration: 0.5,
                        ease: "easeInOut",
                    }, variants: VARIANTS, children: [_jsx("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }), _jsx("path", { d: "M12 17h.01" })] })] }) }));
});
CircleHelpIcon.displayName = "CircleHelpIcon";
export { CircleHelpIcon };
