"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@vault/ui/lib/utils";
import { getCategoryDotColor } from "./utils";
export function CategoryMarker({ category }) {
    return (_jsx("div", { className: cn("size-2 shrink-0 rounded-full", getCategoryDotColor(category)) }));
}
