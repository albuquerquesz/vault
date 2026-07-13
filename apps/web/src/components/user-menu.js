import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@vault/ui/components/dropdown-menu";
import { Skeleton } from "@vault/ui/components/skeleton";
import { authClient } from "@/lib/auth-client";
export default function UserMenu() {
    const navigate = useNavigate();
    const { data: session, isPending } = authClient.useSession();
    if (isPending) {
        return _jsx(Skeleton, { className: "h-9 w-24" });
    }
    if (!session) {
        return (_jsx(Link, { to: "/login", children: _jsx(Button, { variant: "outline", children: "Entrar" }) }));
    }
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { render: _jsx("button", { type: "button", className: "focus-visible:outline-none", children: _jsx(Button, { variant: "outline", children: session.user.name }) }) }), _jsx(DropdownMenuContent, { className: "bg-card", children: _jsxs(DropdownMenuGroup, { children: [_jsx("div", { className: "px-2 py-1.5 text-sm font-semibold text-foreground", children: "Minha conta" }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { children: session.user.email }), _jsx(DropdownMenuItem, { variant: "destructive", onClick: () => {
                                authClient.signOut({
                                    fetchOptions: {
                                        onSuccess: () => {
                                            navigate({
                                                to: "/",
                                            });
                                        },
                                    },
                                });
                            }, children: "Sair" })] }) })] }));
}
