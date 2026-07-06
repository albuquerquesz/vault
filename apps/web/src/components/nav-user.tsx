"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@vault/ui/components/avatar";
import { useState } from "react";

import { SettingsModal } from "@/components/settings-modal";
import { authClient } from "@/lib/auth-client";

export function NavUser() {
	const { data: session } = authClient.useSession();
	const [open, setOpen] = useState(false);

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
		<>
			<button
				type="button"
				className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
				onClick={() => setOpen(true)}
			>
				<Avatar className="size-8">
					{image ? <AvatarImage src={image} /> : null}
					<AvatarFallback>{initials}</AvatarFallback>
				</Avatar>
			</button>

			<SettingsModal open={open} onOpenChange={setOpen} />
		</>
	);
}
