"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
import { motion, useAnimation } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
const eyeVariants = {
    normal: { scaleY: 1, opacity: 1 },
    animate: { scaleY: [1, 0.1, 1], opacity: [1, 0.3, 1] },
};
export const AnimatedSidebarEyeIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
    return (_jsx("div", { className: cn("flex items-center justify-center leading-none", className), onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, role: "presentation", ...props, children: _jsxs("svg", { fill: "none", height: size, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", width: size, xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-hidden": "true", children: [_jsx(motion.path, { animate: controls, d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0", style: { originY: "50%" }, transition: { duration: 0.4, ease: "easeInOut" }, variants: eyeVariants }), _jsx(motion.circle, { animate: controls, cx: "12", cy: "12", r: "3", transition: { duration: 0.4, ease: "easeInOut" }, variants: {
                        normal: { scale: 1, opacity: 1 },
                        animate: { scale: [1, 0.3, 1], opacity: [1, 0.3, 1] },
                    } })] }) }));
});
const eyeOffPathVariants = {
    normal: { pathLength: 1, opacity: 1 },
    animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: { duration: 0.4, ease: "easeInOut" },
    },
};
export const AnimatedSidebarEyeOffIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
    return (_jsx("div", { className: cn("flex items-center justify-center leading-none", className), onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, role: "presentation", ...props, children: _jsxs("svg", { fill: "none", height: size, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", width: size, xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-hidden": "true", children: [_jsx("path", { d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" }), _jsx("path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242" }), _jsx("path", { d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" }), _jsx(motion.path, { animate: controls, d: "m2 2 20 20", variants: eyeOffPathVariants })] }) }));
});
const walletVariants = {
    normal: {
        y: 0,
        rotate: 0,
        transition: { duration: 0.3, ease: "easeOut" },
    },
    animate: {
        y: [0, -3, 0],
        rotate: [0, -4, 0],
        transition: {
            duration: 0.55,
            ease: "easeInOut",
            times: [0, 0.45, 1],
        },
    },
};
export const AnimatedSidebarWalletIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
    return (_jsx("div", { className: cn(className), onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, role: "presentation", ...props, children: _jsxs(motion.svg, { animate: controls, fill: "none", height: size, initial: "normal", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", style: { transformOrigin: "12px 12px" }, variants: walletVariants, viewBox: "0 0 24 24", width: size, xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-hidden": "true", children: [_jsx("path", { d: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" }), _jsx("path", { d: "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" })] }) }));
});
const wobbleVariants = {
    normal: { rotate: 0 },
    animate: { rotate: [0, -10, 10, -10, 0] },
};
export const AnimatedSidebarCircleHelpIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
    return (_jsx("div", { className: cn(className), onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, role: "presentation", ...props, children: _jsxs("svg", { fill: "none", height: size, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", width: size, xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsxs(motion.g, { animate: controls, transition: { duration: 0.5, ease: "easeInOut" }, variants: wobbleVariants, children: [_jsx("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }), _jsx("path", { d: "M12 17h.01" })] })] }) }));
});
const pathLineVariants = {
    normal: { pathLength: 1, opacity: 1 },
    animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        transition: {
            delay: 0.15,
            duration: 0.3,
            opacity: { delay: 0.1 },
        },
    },
};
export const AnimatedSidebarChartLineIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
    return (_jsx("div", { className: cn(className), onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, role: "presentation", ...props, children: _jsxs("svg", { fill: "none", height: size, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", width: size, xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-hidden": "true", children: [_jsx("path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }), _jsx(motion.path, { animate: controls, d: "m7 13 3-3 4 4 5-5", variants: pathLineVariants })] }) }));
});
const pieVariants = {
    normal: { translateX: 0, translateY: 0 },
    animate: { translateX: 1.1, translateY: -1.1 },
};
export const AnimatedSidebarChartPieIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
    return (_jsx("div", { className: cn(className), onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, role: "presentation", ...props, children: _jsxs("svg", { fill: "none", height: size, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", width: size, xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-hidden": "true", children: [_jsx(motion.path, { animate: controls, d: "M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z", transition: {
                        type: "spring",
                        stiffness: 250,
                        damping: 15,
                        bounce: 0.6,
                    }, variants: pieVariants }), _jsx("path", { d: "M21.21 15.89A10 10 0 1 1 8 2.83" })] }) }));
});
const lineVariants = {
    visible: { pathLength: 1, opacity: 1 },
    hidden: { pathLength: 0, opacity: 0 },
};
function createBarAnimationHandlers(controls, onMouseEnter, onMouseLeave, isControlledRef) {
    const handleMouseEnter = async (e) => {
        if (isControlledRef?.current) {
            onMouseEnter?.(e);
            return;
        }
        await controls.start((i) => ({
            pathLength: 0,
            opacity: 0,
            transition: { delay: i * 0.1, duration: 0.3 },
        }));
        await controls.start((i) => ({
            pathLength: 1,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.3 },
        }));
    };
    const handleMouseLeave = (e) => {
        if (isControlledRef?.current) {
            onMouseLeave?.(e);
            return;
        }
        controls.start("visible");
    };
    return { handleMouseEnter, handleMouseLeave };
}
export const AnimatedSidebarChartColumnIncreasingIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);
    useImperativeHandle(ref, () => {
        isControlledRef.current = true;
        return {
            startAnimation: async () => {
                await controls.start((i) => ({
                    pathLength: 0,
                    opacity: 0,
                    transition: { delay: i * 0.1, duration: 0.3 },
                }));
                await controls.start((i) => ({
                    pathLength: 1,
                    opacity: 1,
                    transition: { delay: i * 0.1, duration: 0.3 },
                }));
            },
            stopAnimation: () => controls.start("visible"),
        };
    });
    const { handleMouseEnter, handleMouseLeave } = createBarAnimationHandlers(controls, onMouseEnter, onMouseLeave, isControlledRef);
    return (_jsx("div", { className: cn(className), onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, role: "presentation", ...props, children: _jsxs("svg", { fill: "none", height: size, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", width: size, xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-hidden": "true", children: [_jsx(motion.path, { animate: controls, custom: 1, d: "M13 17V9", initial: "visible", variants: lineVariants }), _jsx(motion.path, { animate: controls, custom: 2, d: "M18 17V5", initial: "visible", variants: lineVariants }), _jsx("path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }), _jsx(motion.path, { animate: controls, custom: 0, d: "M8 17v-3", initial: "visible", variants: lineVariants })] }) }));
});
export const AnimatedSidebarChartNoAxesColumnIncreasingIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);
    useImperativeHandle(ref, () => {
        isControlledRef.current = true;
        return {
            startAnimation: async () => {
                await controls.start((i) => ({
                    pathLength: 0,
                    opacity: 0,
                    transition: { delay: i * 0.1, duration: 0.3 },
                }));
                await controls.start((i) => ({
                    pathLength: 1,
                    opacity: 1,
                    transition: { delay: i * 0.1, duration: 0.3 },
                }));
            },
            stopAnimation: () => controls.start("visible"),
        };
    });
    const { handleMouseEnter, handleMouseLeave } = createBarAnimationHandlers(controls, onMouseEnter, onMouseLeave, isControlledRef);
    return (_jsx("div", { className: cn(className), onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, role: "presentation", ...props, children: _jsxs("svg", { fill: "none", height: size, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", width: size, xmlns: "http://www.w3.org/2000/svg", role: "img", "aria-hidden": "true", children: [_jsx(motion.path, { animate: controls, custom: 0, d: "M6 20v-4", initial: "visible", variants: lineVariants }), _jsx(motion.path, { animate: controls, custom: 1, d: "M12 20v-10", initial: "visible", variants: lineVariants }), _jsx(motion.path, { animate: controls, custom: 2, d: "M18 20v-16", initial: "visible", variants: lineVariants })] }) }));
});
AnimatedSidebarEyeIcon.displayName = "AnimatedSidebarEyeIcon";
AnimatedSidebarEyeOffIcon.displayName = "AnimatedSidebarEyeOffIcon";
AnimatedSidebarWalletIcon.displayName = "AnimatedSidebarWalletIcon";
AnimatedSidebarCircleHelpIcon.displayName = "AnimatedSidebarCircleHelpIcon";
AnimatedSidebarChartLineIcon.displayName = "AnimatedSidebarChartLineIcon";
AnimatedSidebarChartPieIcon.displayName = "AnimatedSidebarChartPieIcon";
AnimatedSidebarChartColumnIncreasingIcon.displayName =
    "AnimatedSidebarChartColumnIncreasingIcon";
AnimatedSidebarChartNoAxesColumnIncreasingIcon.displayName =
    "AnimatedSidebarChartNoAxesColumnIncreasingIcon";
