"use client";

import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@vault/ui/components/avatar";
import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import { Separator } from "@vault/ui/components/separator";
import { Dialog } from "@base-ui/react/dialog";
import { LogOutIcon, XIcon } from "lucide-react";
import * as React from "react";

import { authClient } from "@/lib/auth-client";

export function AccountModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const name = session?.user.name ?? "";
	const email = session?.user.email ?? "";
	const initials = name
		? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
		: "?";

	const [editName, setEditName] = React.useState(name);
	const [editEmail, setEditEmail] = React.useState(email);

	React.useEffect(() => {
		setEditName(name);
		setEditEmail(email);
	}, [name, email]);

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
			<Dialog.Popup
				className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground shadow-2xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 sm:rounded-xl"
				focusManagement="initialFocus"
			>
				<div className="flex flex-col gap-4 p-6">
					{/* Title + Close */}
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold tracking-tight">Conta</h2>
						<Dialog.Close as={Button} variant="ghost" size="icon-sm" className="h-8 w-8">
							<XIcon className="size-4" />
						</Dialog.Close>
					</div>

					{/* User card */}
					<div className="flex items-center gap-3 rounded-xl border border-border p-3">
						<Avatar className="size-12">
							<AvatarFallback className="text-sm">{initials}</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">{name || "—"}</p>
							<p className="truncate text-xs text-muted-foreground">{email || "—"}</p>
						</div>
						<Button variant="outline" size="sm" className="shrink-0" disabled>
							Grátis
						</Button>
					</div>

					<Separator />

					{/* Perfil e Acesso */}
					<div className="space-y-4">
						<p className="text-xs uppercase tracking-wider text-muted-foreground">
							Perfil e Acesso
						</p>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-xs text-muted-foreground">Nome</Label>
								<Input
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs text-muted-foreground">Nova e-mail</Label>
								<Input
									type="email"
									value={editEmail}
									onChange={(e) => setEditEmail(e.target.value)}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Button size="sm" disabled>
								Salvar nome
							</Button>
							<Button variant="outline" size="sm" disabled>
								Enviar link de confirmação
							</Button>
						</div>
					</div>

					<Separator />

					{/* Senha */}
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1">
							<p className="text-sm font-medium">Senha</p>
							<p className="max-w-sm text-xs text-muted-foreground">
								Enviamos um link seguro pro seu e-mail pra você escolher uma nova senha.
							</p>
						</div>
						<Button variant="outline" size="sm" className="shrink-0" disabled>
								Redefinir senha
							</Button>
					</div>

					<Separator />

					{/* Footer */}
					<div className="flex items-center justify-between">
						<Button variant="ghost" size="sm" className="text-muted-foreground" disabled>
							Apagar conta
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => {
								authClient.signOut({
									fetchOptions: {
										onSuccess: () => {
											navigate({ to: "/login" });
										},
									},
								});
							}}
						>
							<LogOutIcon className="mr-1.5 size-4" />
							Sair
						</Button>
					</div>
				</div>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
