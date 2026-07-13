"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import { XIcon } from "lucide-react";
import { maskBrlInput } from "@/components/overview/goals/hooks/use-goals-card";
export function CreateGoalDialog({ open, onOpenChange, name, targetAmount, url, onNameChange, onTargetAmountChange, onUrlChange, onSubmit, isSubmitting, isEditing = false, }) {
    return (_jsx(Dialog.Root, { open: open, onOpenChange: onOpenChange, children: _jsxs(Dialog.Portal, { children: [_jsx(Dialog.Backdrop, { className: "fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" }), _jsx(Dialog.Popup, { className: "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground shadow-2xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 sm:rounded-xl", children: _jsx("form", { onSubmit: onSubmit, children: _jsxs("div", { className: "flex flex-col gap-4 p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: isEditing ? "Editar meta" : "Nova meta" }), _jsx(Dialog.Close, { render: _jsx(Button, { variant: "ghost", size: "icon-sm", className: "h-8 w-8" }), children: _jsx(XIcon, { className: "size-4" }) })] }), _jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsx("label", { htmlFor: "goal-name", className: "text-sm font-medium", children: "Nome" }), _jsx(Input, { id: "goal-name", placeholder: "Ex: Viagem, Carro novo...", value: name, onChange: (event) => onNameChange(event.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsx("label", { htmlFor: "goal-target", className: "text-sm font-medium", children: "Valor" }), _jsx(Input, { id: "goal-target", type: "text", inputMode: "numeric", autoComplete: "off", placeholder: "R$ 0,00", value: targetAmount, onKeyDown: (event) => {
                                                        // Allow control/navigation keys; block non-digit character input.
                                                        if (event.ctrlKey || event.metaKey || event.altKey) {
                                                            return;
                                                        }
                                                        if (event.key.length === 1 && !/^\d$/.test(event.key)) {
                                                            event.preventDefault();
                                                        }
                                                    }, onChange: (event) => {
                                                        // Digits-only BRL mask. Always write the masked value back onto
                                                        // the DOM: when the result equals previous React state (e.g.
                                                        // paste with letters), React skips re-render and junk would stick.
                                                        const masked = maskBrlInput(event.currentTarget.value);
                                                        event.currentTarget.value = masked;
                                                        onTargetAmountChange(masked);
                                                    }, onPaste: (event) => {
                                                        event.preventDefault();
                                                        const text = event.clipboardData.getData("text") ?? "";
                                                        const digits = targetAmount.replace(/\D/g, "") +
                                                            text.replace(/\D/g, "");
                                                        onTargetAmountChange(maskBrlInput(digits));
                                                    }, required: true })] }), _jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsxs("label", { htmlFor: "goal-url", className: "text-sm font-medium", children: ["URL", _jsx("span", { className: "ml-1 font-normal text-muted-foreground", children: "(opcional)" })] }), _jsx(Input, { id: "goal-url", type: "url", placeholder: "https://...", value: url, onChange: (event) => onUrlChange(event.target.value) })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "ghost", type: "button", onClick: () => onOpenChange(false), children: "Cancelar" }), _jsx(Button, { disabled: isSubmitting, type: "submit", children: isEditing ? "Salvar" : "Criar meta" })] })] }) }) })] }) }));
}
