import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Loader from "./loader";
export default function SignInForm({ onSwitchToSignUp, }) {
    const navigate = useNavigate({
        from: "/",
    });
    const { isPending } = authClient.useSession();
    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        onSubmit: async ({ value }) => {
            await authClient.signIn.email({
                email: value.email,
                password: value.password,
            }, {
                onSuccess: () => {
                    navigate({
                        to: "/",
                    });
                    toast.success("Login realizado com sucesso");
                },
                onError: (error) => {
                    toast.error(error.error.message || error.error.statusText);
                },
            });
        },
        validators: {
            onSubmit: z.object({
                email: z.email("Endereço de e-mail inválido"),
                password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
            }),
        },
    });
    if (isPending) {
        return _jsx(Loader, {});
    }
    return (_jsxs("div", { className: "mx-auto w-full mt-10 max-w-md p-6", children: [_jsx("h1", { className: "mb-6 text-center text-3xl font-bold", children: "Bem-vindo de volta" }), _jsxs("form", { onSubmit: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }, className: "space-y-4", children: [_jsx("div", { children: _jsx(form.Field, { name: "email", children: (field) => (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: field.name, children: "Email" }), _jsx(Input, { id: field.name, name: field.name, type: "email", value: field.state.value, onBlur: field.handleBlur, onChange: (e) => field.handleChange(e.target.value) }), field.state.meta.errors.map((error) => (_jsx("p", { className: "text-red-500", children: error?.message }, error?.message)))] })) }) }), _jsx("div", { children: _jsx(form.Field, { name: "password", children: (field) => (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: field.name, children: "Senha" }), _jsx(Input, { id: field.name, name: field.name, type: "password", value: field.state.value, onBlur: field.handleBlur, onChange: (e) => field.handleChange(e.target.value) }), field.state.meta.errors.map((error) => (_jsx("p", { className: "text-red-500", children: error?.message }, error?.message)))] })) }) }), _jsx(form.Subscribe, { selector: (state) => ({
                            canSubmit: state.canSubmit,
                            isSubmitting: state.isSubmitting,
                        }), children: ({ canSubmit, isSubmitting }) => (_jsx(Button, { type: "submit", className: "w-full", disabled: !canSubmit || isSubmitting, children: isSubmitting ? "Enviando..." : "Entrar" })) })] }), _jsx("div", { className: "mt-4 text-center", children: _jsx(Button, { variant: "link", onClick: onSwitchToSignUp, className: "text-indigo-600 hover:text-indigo-800", children: "Precisa de uma conta? Cadastre-se" }) })] }));
}
