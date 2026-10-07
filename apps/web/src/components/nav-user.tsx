"use client";

import { useNavigate } from "@tanstack/react-router";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@vault/ui/components/avatar";

import { authClient } from "@/lib/auth-client";

export function NavUser({ compact = false }: { compact?: boolean }) {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const name = session?.user.name ?? "";
	const image = session?.user.image ?? "";
	const email = session?.user.email ?? "";
	const initials = name
		? name
				.split(" ")
				.map((part) => part[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "?";

	return (
		<button
			type="button"
			className="flex w-full min-w-0 items-center gap-3 rounded-md px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
			aria-label="Abrir configurações"
			onClick={() => {
				void navigate({ to: "/settings" });
			}}
		>
			<Avatar className="size-8 shrink-0">
				{image ? <AvatarImage src={image} /> : null}
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			{!compact ? (
				<span className="flex min-w-0 flex-col items-start">
					<span className="max-w-full truncate text-sm font-medium text-foreground">{name || "Usuário"}</span>
					<span className="max-w-full truncate text-xs text-muted-foreground">{email}</span>
				</span>
			) : null}
		</button>
	);
}
