"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { createContext, useContext, useEffect, useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { AnimatedSidebarEyeIcon, AnimatedSidebarEyeOffIcon, } from "@/components/animated-sidebar-icons";
const STORAGE_KEY = "vault-monetary-visibility";
const MASKED_VALUE = "...";
const MonetaryVisibilityContext = createContext(null);
function readStoredVisibility() {
    if (typeof window === "undefined") {
        return true;
    }
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue === null) {
        return true;
    }
    return storedValue === "true";
}
export function MonetaryVisibilityProvider({ children, }) {
    const [isVisible, setVisible] = useState(readStoredVisibility);
    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, String(isVisible));
    }, [isVisible]);
    return (_jsx(MonetaryVisibilityContext.Provider, { value: {
            isVisible,
            setVisible,
            toggle: () => setVisible((currentValue) => !currentValue),
        }, children: children }));
}
export function useMonetaryVisibility() {
    const context = useContext(MonetaryVisibilityContext);
    if (!context) {
        throw new Error("useMonetaryVisibility must be used within MonetaryVisibilityProvider.");
    }
    return context;
}
export function maskMonetaryText(value, isVisible, mask = MASKED_VALUE, prefix = "R$") {
    return isVisible ? value : `${prefix} ${mask}`;
}
export function MonetaryMask({ className, prefix = "R$", }) {
    return (_jsxs("span", { className: cn("inline-flex items-center gap-1.5 align-middle leading-none", className), children: [prefix ? (_jsx("span", { className: "shrink-0 font-inherit leading-none text-current", children: prefix })) : null, _jsxs("span", { className: "inline-flex translate-y-px items-center gap-1", children: [_jsx("span", { className: "size-[0.34em] rounded-full bg-current" }), _jsx("span", { className: "size-[0.34em] rounded-full bg-current" }), _jsx("span", { className: "size-[0.34em] rounded-full bg-current" })] })] }));
}
export function MaskedMonetaryText({ children, className, mask = MASKED_VALUE, prefix = "R$", }) {
    const { isVisible } = useMonetaryVisibility();
    return (_jsx("span", { className: className, children: isVisible ? children : _jsx(MonetaryMask, { prefix: prefix ?? mask }) }));
}
export function MaskedMonetaryValue({ value, format, animated = false, start = 0, duration = 0.9, className, mask = MASKED_VALUE, prefix = "R$", }) {
    const { isVisible } = useMonetaryVisibility();
    if (!isVisible) {
        return (_jsx("span", { className: className, children: _jsx(MonetaryMask, { prefix: prefix ?? mask }) }));
    }
    if (animated) {
        return (_jsx(AnimatedNumber, { className: className, duration: duration, format: format, start: start, value: value }));
    }
    return _jsx("span", { className: className, children: format(value) });
}
export function MonetaryVisibilityToggle() {
    const { isVisible, toggle } = useMonetaryVisibility();
    return (_jsx(Button, { "aria-label": isVisible ? "Ocultar valores monetários" : "Mostrar valores monetários", "aria-pressed": !isVisible, className: "size-10 rounded-full p-0 text-muted-foreground", onClick: toggle, size: "icon", type: "button", variant: "ghost", children: isVisible ? (_jsx(AnimatedSidebarEyeIcon, { className: "size-10 [&_svg]:scale-125", size: 48 })) : (_jsx(AnimatedSidebarEyeOffIcon, { className: "size-10 [&_svg]:scale-125", size: 48 })) }));
}
