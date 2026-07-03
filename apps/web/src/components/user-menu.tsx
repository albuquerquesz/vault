import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@vault/ui/components/dropdown-menu";
import { Skeleton } from "@vault/ui/components/skeleton";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Link to="/login">
				<Button variant="outline">Entrar</Button>
			</Link>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<button type="button" className="focus-visible:outline-none">
						<Button variant="outline">{session.user.name}</Button>
					</button>
				}
			/>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuGroup>
					<div className="px-2 py-1.5 text-sm font-semibold text-foreground">
						Minha conta
					</div>
					<DropdownMenuSeparator />
					<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({
											to: "/",
										});
									},
								},
							});
						}}
					>
						Sair
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
