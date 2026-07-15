"use client";

import { useNavigate } from "@tanstack/react-router";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@vault/ui/components/avatar";

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

	return (
		<button
			type="button"
			className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
			aria-label="Abrir configurações"
			onClick={() => {
				void navigate({ to: "/settings" });
			}}
		>
			<Avatar className="size-8">
				{image ? <AvatarImage src={image} /> : null}
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
		</button>
	);
}
