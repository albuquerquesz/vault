"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage, } from "@vault/ui/components/avatar";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, } from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import { Tabs, TabsList, TabsTrigger } from "@vault/ui/components/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@vault/ui/components/tooltip";
import { cn } from "@vault/ui/lib/utils";
import { CameraIcon, CircleHelpIcon, InfoIcon, Loader2, LogOutIcon, MonitorIcon, MoonIcon, SunIcon, } from "lucide-react";
import * as React from "react";
import { PageContent } from "@/components/page-content";
import { PluggyConnectWidget } from "@/components/pluggy-connect-widget";
import { useTheme } from "@/components/theme-provider";
import { usePluggyDeleteItem, usePluggyItems, usePluggyRegisterItem, } from "@/features/pluggy/sdk";
import { useDeletePluggyCredentials, usePluggyCredentialsStatus, useSavePluggyCredentials, useUpdateAvatar, useUpdatePreferences, useUpdateProfile, useUserPreferences, useUserProfile, } from "@/features/settings/sdk";
import { authClient } from "@/lib/auth-client";
const SETTINGS_SECTIONS = ["general", "account", "about"];
const settingsSections = [
    { id: "general", label: "Geral" },
    { id: "account", label: "Conta" },
    { id: "about", label: "Sobre" },
];
function isSettingsSection(value) {
    return (typeof value === "string" &&
        SETTINGS_SECTIONS.includes(value));
}
const headingStyle = { fontFamily: '"Space Grotesk", sans-serif' };
const PLUGGY_ORPHANED_STATUS = "ITEM_NOT_FOUND";
function getPluggyStatusLabel(status) {
    if (status === PLUGGY_ORPHANED_STATUS) {
        return "Conexao perdida";
    }
    return status;
}
function getPluggyStatusHint(status) {
    if (status === PLUGGY_ORPHANED_STATUS) {
        return "Esse item nao existe mais na Pluggy para essas chaves. Remova e conecte novamente.";
    }
    return null;
}
function SettingsSectionCard({ children, className, }) {
    return (_jsx(Card, { className: cn("rounded-2xl border border-border/70 bg-background/60 ring-0", className), children: _jsx(CardContent, { className: "space-y-4", children: children }) }));
}
/** Horizontal chip section nav (shadcn Tabs, pill style — PRD 06). */
function SettingsSectionChips({ activeSection, onSectionChange, }) {
    return (_jsx(Tabs, { value: activeSection, onValueChange: (value) => {
            if (isSettingsSection(value))
                onSectionChange(value);
        }, children: _jsx(TabsList, { "aria-label": "Se\u00E7\u00F5es de configura\u00E7\u00F5es", className: "h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0", children: settingsSections.map((section) => (_jsx(TabsTrigger, { value: section.id, className: cn(
                // Loose chips (not a single segmented track): full pill, muted active fill
                "h-8 flex-none rounded-full border-0 px-4 text-sm font-medium shadow-none after:hidden", "text-muted-foreground hover:bg-muted/50 hover:text-foreground", "data-active:bg-muted data-active:text-foreground", "dark:data-active:border-transparent dark:data-active:bg-muted dark:data-active:text-foreground"), children: section.label }, section.id))) }) }));
}
const THEME_OPTIONS = [
    { value: "light", label: "Claro", icon: SunIcon },
    { value: "system", label: "Sistema", icon: MonitorIcon },
    { value: "dark", label: "Escuro", icon: MoonIcon },
];
function ConnectedAccountsList() {
    const { data: items, isLoading } = usePluggyItems();
    const deleteItem = usePluggyDeleteItem();
    const [deletingId, setDeletingId] = React.useState(null);
    if (isLoading) {
        return _jsx("p", { className: "text-sm text-muted-foreground", children: "Carregando contas\u2026" });
    }
    if (!items || items.length === 0) {
        return (_jsx("p", { className: "text-sm text-muted-foreground", children: "Nenhuma conta conectada ainda." }));
    }
    return (_jsx("div", { className: "space-y-2", children: items.map((item) => (_jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm font-medium truncate", children: item.provider }), _jsx("p", { className: "text-xs text-muted-foreground capitalize", children: getPluggyStatusLabel(item.status) }), getPluggyStatusHint(item.status) ? (_jsx("p", { className: "mt-1 text-xs text-amber-700 dark:text-amber-400", children: getPluggyStatusHint(item.status) })) : null] }), _jsx(Button, { size: "sm", variant: "destructive", onClick: async () => {
                        setDeletingId(item.pluggyItemId);
                        await deleteItem.mutateAsync(item.id);
                        setDeletingId(null);
                    }, disabled: deletingId !== null, className: "shrink-0", children: deletingId === item.pluggyItemId ? (_jsx(Loader2, { className: "size-3.5 animate-spin" })) : ("Remover") })] }, item.id))) }));
}
function GeneralSettings() {
    const { theme, setTheme } = useTheme();
    const { data: session } = authClient.useSession();
    const { data: prefs, isLoading: prefsLoading } = useUserPreferences();
    const updatePreferences = useUpdatePreferences();
    // Local editing state — synced from prefs on load
    const [incomeAmount, setIncomeAmount] = React.useState("");
    const [incomeDay, setIncomeDay] = React.useState("");
    const [pluggyClientId, setPluggyClientId] = React.useState("");
    const [pluggyClientSecret, setPluggyClientSecret] = React.useState("");
    const { data: pluggyStatus, isLoading: isLoadingPluggyStatus, isFetching: isFetchingPluggyStatus, } = usePluggyCredentialsStatus({ enabled: Boolean(session?.user) });
    const savePluggyCredentials = useSavePluggyCredentials();
    const deletePluggyCredentials = useDeletePluggyCredentials();
    const registerItem = usePluggyRegisterItem();
    const [pluggyConnectError, setPluggyConnectError] = React.useState(null);
    // Sync income/day from API prefs
    React.useEffect(() => {
        if (prefs) {
            setIncomeAmount(prefs.monthlyIncome?.toString() ?? "");
            setIncomeDay(prefs.incomeDay?.toString() ?? "");
        }
    }, [prefs]);
    // Apply saved theme from API on first load
    React.useEffect(() => {
        if (prefs?.theme) {
            setTheme(prefs.theme);
        }
    }, [prefs?.theme, setTheme]);
    const selectedTheme = theme ?? "system";
    const handleSaveIncome = () => {
        const monthlyIncomeValue = incomeAmount
            ? parseFloat(incomeAmount.replace(",", "."))
            : null;
        const incomeDayValue = incomeDay ? parseInt(incomeDay, 10) : null;
        updatePreferences.mutate({
            monthlyIncome: monthlyIncomeValue === null || Number.isNaN(monthlyIncomeValue)
                ? null
                : monthlyIncomeValue,
            incomeDay: incomeDayValue === null ||
                Number.isNaN(incomeDayValue) ||
                incomeDayValue < 1 ||
                incomeDayValue > 28
                ? null
                : incomeDayValue,
        });
    };
    const handleSavePluggyCredentials = (event) => {
        event.preventDefault();
        const clientId = pluggyClientId.trim();
        const clientSecret = pluggyClientSecret.trim();
        if (!clientId || !clientSecret || savePluggyCredentials.isPending)
            return;
        savePluggyCredentials.mutate({ clientId, clientSecret }, {
            onSuccess: () => {
                setPluggyClientId("");
                setPluggyClientSecret("");
            },
        });
    };
    if (prefsLoading) {
        return _jsx("p", { className: "text-sm text-muted-foreground", children: "Carregando\u2026" });
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(SettingsSectionCard, { className: "min-h-48", children: [_jsx("div", { children: _jsx("p", { className: "text-lg font-medium", style: headingStyle, children: "Tema" }) }), _jsx("div", { className: "grid grid-cols-1 gap-2 sm:grid-cols-3", children: THEME_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isSelected = selectedTheme === option.value;
                            return (_jsxs(Button, { className: cn("h-10 rounded-xl text-sm", isSelected
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "text-muted-foreground hover:bg-muted"), onClick: () => {
                                    setTheme(option.value);
                                    // Persist theme to API — map "system" to null
                                    updatePreferences.mutate({
                                        theme: option.value === "system" ? null : option.value,
                                    });
                                }, type: "button", variant: "ghost", children: [_jsx(Icon, { className: "size-4" }), option.label] }, option.value));
                        }) })] }), _jsxs(SettingsSectionCard, { children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg font-medium", style: headingStyle, children: "Quanto voc\u00EA recebe?" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Preencha o valor mensal para futuras automa\u00E7\u00F5es." })] }), _jsxs("div", { className: "flex flex-col gap-3 pt-4 sm:flex-row sm:items-end", children: [_jsxs("div", { className: "w-full max-w-sm space-y-2", children: [_jsx(Label, { htmlFor: "settings-income-amount", children: "Valor mensal" }), _jsx(Input, { id: "settings-income-amount", inputMode: "decimal", placeholder: "R$ 0,00", value: incomeAmount, onChange: (event) => setIncomeAmount(event.target.value), className: "h-9 rounded-md px-3 text-sm" })] }), _jsx(Button, { className: "h-9 rounded-md px-4 sm:self-end", onClick: handleSaveIncome, type: "button", disabled: updatePreferences.isPending, children: updatePreferences.isPending ? "Salvando…" : "Salvar" })] })] }), _jsxs(SettingsSectionCard, { className: "min-h-48", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg font-medium", style: headingStyle, children: "Quando voc\u00EA recebe?" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Escolha o dia do m\u00EAs em que o sal\u00E1rio cai na conta." })] }), _jsxs("div", { className: "flex flex-col gap-3 pt-4 sm:flex-row sm:items-end", children: [_jsxs("div", { className: "w-full max-w-[12rem] space-y-2", children: [_jsx(Label, { htmlFor: "settings-income-day", children: "Dia do m\u00EAs" }), _jsx(Input, { id: "settings-income-day", max: "28", min: "1", placeholder: "1", type: "number", value: incomeDay, onChange: (event) => setIncomeDay(event.target.value), className: "h-9 rounded-md px-3 text-sm" })] }), _jsx(Button, { className: "h-9 rounded-md px-4 sm:self-end", onClick: handleSaveIncome, type: "button", disabled: updatePreferences.isPending, children: updatePreferences.isPending ? "Salvando…" : "Salvar" })] })] }), _jsxs(SettingsSectionCard, { className: "min-h-48", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("p", { className: "text-lg font-medium", style: headingStyle, children: "Pluggy" }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { delay: 200, "aria-label": "Sobre Pluggy BYOK", className: "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", children: _jsx(InfoIcon, { className: "size-4" }) }), _jsx(TooltipContent, { className: "max-w-xs bg-black text-left leading-relaxed text-white [&>[data-side]]:bg-black [&>[data-side]]:fill-black", children: "Suas chaves Pluggy (BYOK). O secret \u00E9 criptografado e nunca volta ao navegador." })] })] }), _jsxs("form", { className: "space-y-4", onSubmit: handleSavePluggyCredentials, children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "settings-pluggy-client-id", children: "Client ID" }), _jsx(Input, { id: "settings-pluggy-client-id", name: "pluggyClientId", className: "h-9 rounded-md px-3 font-mono text-sm", placeholder: "f47ac10b-58cc-4372-a567-0e02b2c3d479", autoComplete: "off", spellCheck: false, value: pluggyClientId, onChange: (event) => setPluggyClientId(event.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "settings-pluggy-client-secret", children: "Client Secret" }), _jsx(Input, { id: "settings-pluggy-client-secret", name: "pluggyClientSecret", className: "h-9 rounded-md px-3 font-mono text-sm", placeholder: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", type: "password", autoComplete: "new-password", spellCheck: false, value: pluggyClientSecret, onChange: (event) => setPluggyClientSecret(event.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", children: [_jsx(Button, { className: "h-9 rounded-md px-4", type: "submit", disabled: !pluggyClientId.trim() ||
                                            !pluggyClientSecret.trim() ||
                                            savePluggyCredentials.isPending, children: savePluggyCredentials.isPending
                                            ? "Validando no Pluggy…"
                                            : pluggyStatus?.configured
                                                ? "Atualizar chaves"
                                                : "Salvar chaves" }), pluggyStatus?.configured ? (_jsx(Button, { className: "h-9 rounded-md px-4", type: "button", variant: "outline", disabled: deletePluggyCredentials.isPending, onClick: () => deletePluggyCredentials.mutate(), children: deletePluggyCredentials.isPending
                                            ? "Removendo…"
                                            : "Remover minhas chaves" })) : null] })] })] }), _jsxs(SettingsSectionCard, { className: "min-h-48", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg font-medium", style: headingStyle, children: "Bancos dispon\u00EDveis" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Conecte sua conta banc\u00E1ria para importar transa\u00E7\u00F5es automaticamente." })] }), !pluggyStatus?.configured && !isLoadingPluggyStatus ? (_jsx("div", { className: "mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400", children: "Configure suas chaves Pluggy acima para conectar seus bancos." })) : (_jsxs("div", { className: "pt-4", children: [_jsx(PluggyConnectWidget, { onSuccess: ({ item }) => {
                                    setPluggyConnectError(null);
                                    registerItem.mutate(item.id, {
                                        onError: (error) => {
                                            setPluggyConnectError(error.message);
                                        },
                                        onSuccess: (result) => {
                                            if (result.sync.status === "failed") {
                                                setPluggyConnectError(result.sync.error ??
                                                    "Conta conectada, mas a sincronização inicial falhou.");
                                                return;
                                            }
                                            setPluggyConnectError(null);
                                        },
                                    });
                                }, onError: (error) => {
                                    setPluggyConnectError(error.message);
                                } }), pluggyConnectError ? (_jsx("div", { className: "mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400", children: pluggyConnectError })) : null] }))] }), _jsxs(SettingsSectionCard, { className: "min-h-48", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg font-medium", style: headingStyle, children: "Contas conectadas" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Gerencie suas contas banc\u00E1rias conectadas." })] }), _jsx("div", { className: "pt-4", children: _jsx(ConnectedAccountsList, {}) })] })] }));
}
function AccountSettings() {
    const navigate = useNavigate();
    const { data: session } = authClient.useSession();
    const { data: profile, isLoading: profileLoading } = useUserProfile();
    const updateProfile = useUpdateProfile();
    const updateAvatar = useUpdateAvatar();
    const [editName, setEditName] = React.useState("");
    const [editEmail, setEditEmail] = React.useState("");
    // Sync from API profile
    React.useEffect(() => {
        if (profile) {
            setEditName(profile.name ?? "");
            setEditEmail(profile.email ?? "");
        }
    }, [profile]);
    const name = profile?.name ?? session?.user.name ?? "";
    const image = profile?.image ?? session?.user.image ?? "";
    const initials = name
        ? name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "?";
    const handleSignOut = () => {
        authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    navigate({ to: "/login" });
                },
            },
        });
    };
    const handleSaveProfile = () => {
        updateProfile.mutate({
            name: editName.trim() || null,
            email: editEmail.trim() || null,
        });
    };
    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            updateAvatar.mutate(dataUrl);
        };
        reader.readAsDataURL(file);
        // Reset input so the same file can trigger onChange again
        event.target.value = "";
    };
    if (profileLoading) {
        return _jsx("p", { className: "text-sm text-muted-foreground", children: "Carregando\u2026" });
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "rounded-2xl border border-border/70 bg-background/60 ring-0", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg font-medium", style: headingStyle, children: "Conta" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Avatar, { className: "size-28 rounded-2xl after:rounded-2xl", size: "lg", children: [image ? (_jsx(AvatarImage, { className: "rounded-2xl", src: image })) : null, _jsx(AvatarFallback, { className: "rounded-2xl text-3xl font-medium", children: initials })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("label", { className: "inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3 text-sm shadow-none hover:bg-muted disabled:opacity-50", children: [_jsx(CameraIcon, { className: "size-4" }), "Atualizar imagem", _jsx("input", { accept: "image/jpeg,image/png,image/webp", className: "hidden", type: "file", onChange: handleAvatarChange, disabled: updateAvatar.isPending })] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Tamanho m\u00E1ximo: 5 MB. JPG, PNG ou WebP." })] })] }), _jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { className: "grid flex-1 gap-4 lg:max-w-md", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "settings-account-name", children: "Nome" }), _jsx(Input, { id: "settings-account-name", className: "h-9 rounded-md px-3 text-sm", placeholder: "Seu nome", value: editName, onChange: (event) => setEditName(event.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "settings-account-email", children: "Email" }), _jsx(Input, { id: "settings-account-email", className: "h-9 rounded-md px-3 text-sm", placeholder: "voce@email.com", type: "email", value: editEmail, onChange: (event) => setEditEmail(event.target.value) })] })] }), _jsx(Button, { className: "h-9 rounded-md px-4 lg:mb-0.5", onClick: handleSaveProfile, type: "button", disabled: updateProfile.isPending, children: updateProfile.isPending ? "Salvando…" : "Salvar" })] })] })] }), _jsx(SettingsSectionCard, { children: _jsxs("div", { className: "flex flex-col items-start gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg font-medium", style: headingStyle, children: "Sess\u00E3o" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Encerrar a sess\u00E3o atual neste dispositivo." })] }), _jsxs(Button, { className: "rounded-md", onClick: handleSignOut, type: "button", variant: "destructive", children: [_jsx(LogOutIcon, { className: "size-4" }), "Fazer logout"] })] }) })] }));
}
function AboutSettings() {
    return (_jsx("div", { className: "space-y-4", children: _jsxs(SettingsSectionCard, { children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-lg font-medium", style: headingStyle, children: "Documentos legais" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Informa\u00E7\u00F5es sobre o Vault e documentos legais." })] }), _jsxs("div", { className: "grid gap-3", children: [_jsxs("a", { className: "inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm shadow-none hover:bg-muted", href: "https://vault.finance/terms", rel: "noopener noreferrer", target: "_blank", children: [_jsx(CircleHelpIcon, { className: "size-4" }), "Termos de uso"] }), _jsxs("a", { className: "inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm shadow-none hover:bg-muted", href: "https://vault.finance/privacy", rel: "noopener noreferrer", target: "_blank", children: [_jsx(InfoIcon, { className: "size-4" }), "Pol\u00EDtica de privacidade"] })] })] }) }));
}
export function SettingsPage() {
    const navigate = useNavigate({ from: "/settings" });
    const search = useSearch({ from: "/settings" });
    const activeSection = search.section ?? "general";
    const setActiveSection = (section) => {
        void navigate({
            to: "/settings",
            search: { section },
            replace: true,
        });
    };
    return (_jsxs(PageContent, { className: "space-y-6 py-6", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h1", { className: "text-2xl font-semibold tracking-tight", style: headingStyle, children: "Configura\u00E7\u00F5es" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Ajustes da conta, prefer\u00EAncias e integra\u00E7\u00F5es." })] }), _jsx(SettingsSectionChips, { activeSection: activeSection, onSectionChange: setActiveSection }), _jsxs("div", { className: "min-w-0", children: [activeSection === "general" ? _jsx(GeneralSettings, {}) : null, activeSection === "account" ? _jsx(AccountSettings, {}) : null, activeSection === "about" ? _jsx(AboutSettings, {}) : null] })] }));
}
