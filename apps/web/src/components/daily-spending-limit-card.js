import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, } from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@vault/ui/components/tooltip";
import { Info, Wallet } from "lucide-react";
import { useState } from "react";
import { getMonthValue, useFinanceMonthlyOverview, useSavingsTarget, useUpsertSavingsTarget, } from "@/features/finance/sdk";
function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}
function getDaysInMonth(yearMonth) {
    const [year, month] = yearMonth.split("-").map(Number);
    return new Date(year, month, 0).getDate();
}
function DailySpendingLimitCard() {
    const month = getMonthValue();
    const { data: overview } = useFinanceMonthlyOverview(month);
    const { data: target } = useSavingsTarget(month);
    const upsertMutation = useUpsertSavingsTarget();
    const [open, setOpen] = useState(false);
    const [percentage, setPercentage] = useState(() => target?.savingsPercentage ?? 0);
    const income = overview?.income ?? 0;
    const savingsPercentage = target?.savingsPercentage ?? 0;
    const daysInMonth = getDaysInMonth(month);
    const spendable = income * (1 - savingsPercentage / 100);
    const dailyLimit = savingsPercentage > 0 ? spendable / daysInMonth : 0;
    const previewSpendable = income > 0 && percentage > 0 ? income * (1 - percentage / 100) : 0;
    const previewDailyLimit = income > 0 && percentage > 0 ? previewSpendable / daysInMonth : 0;
    const handleSave = () => {
        upsertMutation.mutate({ month, savingsPercentage: percentage }, {
            onSuccess: () => {
                setOpen(false);
            },
        });
    };
    return (_jsxs(Card, { className: "financial-panel-border h-full min-h-[24rem] w-full", children: [_jsx(CardHeader, { className: "border-b", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs(CardDescription, { className: "flex items-center gap-2 text-base", children: [_jsx(Wallet, { className: "size-4 text-muted-foreground" }), _jsx("span", { children: "Limite Di\u00E1rio" })] }), _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { render: () => (_jsx(Info, { className: "mt-0.5 size-4 text-muted-foreground" })) }), _jsx(TooltipContent, { children: "Defina uma meta de economia e veja quanto pode gastar por dia." })] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "flex items-baseline gap-2", children: _jsx("span", { className: "text-3xl font-semibold tabular-nums tracking-tight", children: formatCurrency(dailyLimit) }) }), dailyLimit > 0 && (_jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [_jsxs("span", { children: ["Meta: ", savingsPercentage, "% economia"] }), _jsxs("span", { children: [formatCurrency(spendable), " dispon\u00EDvel"] })] }), _jsx("div", { className: "h-1.5 w-full overflow-hidden rounded-full bg-muted", children: _jsx("div", { className: "h-full rounded-full bg-primary transition-all", style: { width: `${savingsPercentage}%` } }) })] })), dailyLimit === 0 && income > 0 && (_jsx("p", { className: "text-xs text-muted-foreground", children: "Nenhuma meta definida. Configure sua meta de economia." })), _jsx(Button, { variant: "outline", size: "sm", className: "self-end", onClick: () => {
                            setPercentage(savingsPercentage);
                            setOpen(true);
                        }, children: "Configurar Meta" }), _jsx(Dialog.Root, { open: open, onOpenChange: setOpen, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Backdrop, { className: "fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" }), _jsx(Dialog.Popup, { className: "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground shadow-2xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 sm:rounded-xl", children: _jsxs("div", { className: "flex flex-col gap-4 p-6", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Meta de Economia" }), _jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsx("label", { htmlFor: "savings-pct", className: "text-sm font-medium", children: "Porcentagem de economia" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { id: "savings-pct", type: "number", min: 1, max: 99, value: percentage, onChange: (e) => setPercentage(Number(e.target.value)), className: "flex-1" }), _jsx("span", { className: "text-sm text-muted-foreground", children: "%" })] })] }), income > 0 && percentage > 0 && (_jsxs("div", { className: "space-y-2 rounded-lg border bg-muted/50 p-3", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Renda mensal" }), _jsx("span", { className: "font-medium", children: formatCurrency(income) })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Economia prevista" }), _jsx("span", { className: "font-medium text-green-500", children: formatCurrency(income * (percentage / 100)) })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Dispon\u00EDvel para gastos" }), _jsx("span", { className: "font-medium", children: formatCurrency(previewSpendable) })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Limite di\u00E1rio" }), _jsx("span", { className: "font-medium", children: formatCurrency(previewDailyLimit) })] })] })), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "ghost", onClick: () => setOpen(false), children: "Cancelar" }), _jsx(Button, { onClick: handleSave, disabled: upsertMutation.isPending, children: upsertMutation.isPending ? "Salvando..." : "Salvar" })] })] })] }) })] }) })] })] }));
}
export { DailySpendingLimitCard };
