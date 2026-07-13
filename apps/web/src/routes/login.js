import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { GoogleIcon } from "@/components/google-icon";
import { LogoIcon } from "@/components/logo";
import { authClient } from "@/lib/auth-client";
export const Route = createFileRoute("/login")({
    beforeLoad: async () => {
        const session = await authClient.getSession();
        if (session?.data) {
            throw redirect({ to: "/", replace: true });
        }
    },
    component: RouteComponent,
});
function RouteComponent() {
    async function handleGoogleSignIn() {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: `${window.location.origin}/`,
        });
    }
    return (_jsxs("main", { className: "flex min-h-screen bg-[#0c0a09] text-white", children: [_jsx("section", { className: "flex flex-1 flex-col items-center justify-center px-6 py-12", children: _jsxs("div", { className: "mx-auto w-full max-w-sm space-y-6", children: [_jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx(LogoIcon, { className: "h-6 w-auto text-white" }), _jsx("p", { className: "text-sm text-white/80", children: "login or create your account." })] }), _jsx("div", { className: "space-y-2", children: _jsxs(Button, { variant: "outline", size: "lg", className: "h-12 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 text-sm text-white/80 hover:bg-zinc-800/50 hover:text-white", onClick: handleGoogleSignIn, children: [_jsx(GoogleIcon, { className: "size-5 self-center" }), "Continue with Google"] }) })] }) }), _jsxs("section", { className: "relative hidden flex-col overflow-hidden border-l border-zinc-800/50 lg:flex lg:flex-1", children: [_jsx("div", { className: "absolute inset-0 grid grid-cols-3 grid-rows-5 gap-2 p-4", children: Array.from({ length: 15 }).map((_, i) => (_jsx("div", { className: "rounded-2xl bg-zinc-900/20" }, i))) }), _jsx("div", { className: "relative z-10 mx-auto flex flex-1 flex-col items-center justify-center px-12", children: _jsxs("div", { className: "space-y-8 text-center", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "text-3xl font-medium tracking-tight text-white", style: { fontFamily: '"Space Grotesk", sans-serif' }, children: "Ready to join Vault?" }), _jsx("p", { className: "text-sm text-zinc-400", children: "Join thousands of teams shipping beautiful, production-ready interfaces in record time." })] }), _jsxs("div", { className: "w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-left backdrop-blur", children: [_jsx("blockquote", { className: "mb-4 text-sm leading-relaxed text-white/90", children: "\"Vault is why I still have hair. No more worrying about UI blocks.\"" }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white", children: "Victor Albuquerque" }), _jsx("p", { className: "text-xs text-zinc-500", children: "Software Engineer" })] }) })] })] }) })] })] }));
}
