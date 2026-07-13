"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage, } from "@vault/ui/components/avatar";
import { authClient } from "@/lib/auth-client";
export function NavUser() {
    const navigate = useNavigate();
    const { data: session } = authClient.useSession();
    const name = session?.user.name ?? "";
    const image = session?.user.image ?? "";
    const initials = name
        ? name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "?";
    return (_jsx("button", { type: "button", className: "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70", "aria-label": "Abrir configura\u00E7\u00F5es", onClick: () => {
            void navigate({ to: "/settings" });
        }, children: _jsxs(Avatar, { className: "size-8", children: [image ? _jsx(AvatarImage, { src: image }) : null, _jsx(AvatarFallback, { children: initials })] }) }));
}
