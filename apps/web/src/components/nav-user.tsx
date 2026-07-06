"use client";

import { useNavigate } from "@tanstack/react-router";
import {
	Avatar,
	AvatarFallback,
} from "@vault/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@vault/ui/components/dropdown-menu";
import { LogOutIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export function NavUser() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const name = session?.user.name ?? "";
	const email = session?.user.email ?? "";
	const initials = name
		? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
		: "?";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button type="button" className="focus-visible:outline-none">
						<Avatar className="size-8">
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
					</button>
				}
			/>
			<DropdownMenuContent align="end" className="w-60">
				<DropdownMenuGroup>
					<div className="flex items-center gap-3 p-2">
						<Avatar className="size-10">
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
						<div>
							<span className="font-medium text-foreground">{name}</span>{" "}
							<br />
							<div className="max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-muted-foreground text-xs">
								{email}
							</div>
						</div>
					</div>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className="w-full cursor-pointer"
						variant="destructive"
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
						<LogOutIcon />
						Log out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
