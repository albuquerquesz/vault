"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useNavigate } from "@tanstack/react-router";
import {
	Avatar,
	AvatarFallback,
} from "@vault/ui/components/avatar";
import { Button } from "@vault/ui/components/button";
import { LogOutIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function NavUser() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const [open, setOpen] = useState(false);

	const name = session?.user.name ?? "";
	const email = session?.user.email ?? "";
	const initials = name
		? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
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

	return (
		<>
			<button
				type="button"
				className="focus-visible:outline-none"
				onClick={() => setOpen(true)}
			>
				<Avatar className="size-8">
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
			</button>

			<Dialog.Root open={open} onOpenChange={setOpen}>
				<Dialog.Portal>
					<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
					<Dialog.Popup
						className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground shadow-2xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 sm:rounded-xl"
						focusManagement="initialFocus"
					>
						<div className="flex flex-col gap-4 p-6">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold tracking-tight">
									Confirmar logout
								</h2>
								<Dialog.Close
									as={Button}
									variant="ghost"
									size="icon-sm"
									className="h-8 w-8"
								>
									<XIcon className="size-4" />
								</Dialog.Close>
							</div>

							<div className="flex items-center gap-3">
								<Avatar className="size-10">
									<AvatarFallback>{initials}</AvatarFallback>
								</Avatar>
								<div>
									<span className="font-medium text-foreground">{name}</span>
									<br />
									<div className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-muted-foreground text-xs">
										{email}
									</div>
								</div>
							</div>

							<p className="text-sm text-muted-foreground">
								Deseja realmente sair da sua conta?
							</p>

							<div className="flex justify-end gap-2">
								<Dialog.Close as={Button} variant="ghost">
									Cancelar
								</Dialog.Close>
								<Button
									variant="destructive"
									onClick={() => {
										setOpen(false);
										handleSignOut();
									}}
								>
									<LogOutIcon className="size-4" />
									Log out
								</Button>
							</div>
						</div>
					</Dialog.Popup>
				</Dialog.Portal>
			</Dialog.Root>
		</>
	);
}
