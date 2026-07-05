"use client";

import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@vault/ui/components/avatar";
import { Button } from "@vault/ui/components/button";
import { Label } from "@vault/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import { Separator } from "@vault/ui/components/separator";
import { LogOutIcon, MoonIcon, SettingsIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { authClient } from "@/lib/auth-client";

export function SettingsPage() {
	const { theme, setTheme } = useTheme();
	const { data: session } = authClient.useSession();
	const navigate = useNavigate();

	const name = session?.user.name ?? "";
	const email = session?.user.email ?? "";
	const firstName = name.split(" ")[0];
	const initials = name
		? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
		: "?";

	return (
		<div className="mx-auto w-[1200px] space-y-6">
			<div className="flex items-center gap-3">
				<SettingsIcon className="size-5 text-muted-foreground" />
				<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
			</div>

			<div className="space-y-6">
					{/* Profile */}
					<div className="flex flex-col items-center gap-4 pt-2">
						<Avatar className="size-20">
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
						<div className="text-center">
							<p className="text-lg font-semibold">{name || "—"}</p>
							<p className="text-sm text-muted-foreground">{email || "—"}</p>
						</div>
					</div>

					<Separator />

					{/* Account info */}
					<div className="space-y-4">
						<p className="text-xs uppercase tracking-wider text-muted-foreground">
							Account
						</p>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-muted-foreground">Name</Label>
								<p className="text-sm">{name || "—"}</p>
							</div>
							<div className="space-y-2">
								<Label className="text-muted-foreground">Email</Label>
								<p className="text-sm">{email || "—"}</p>
							</div>
						</div>
					</div>

					<Separator />

					{/* Preferences */}
					<div className="space-y-4">
						<p className="text-xs uppercase tracking-wider text-muted-foreground">
							Preferences
						</p>
						<div className="space-y-2">
							<Label className="text-muted-foreground">Theme</Label>
							<Select value={theme} onValueChange={setTheme}>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="light">
										<div className="flex items-center gap-2">
											<SunIcon className="size-4" />
											Light
										</div>
									</SelectItem>
									<SelectItem value="dark">
										<div className="flex items-center gap-2">
											<MoonIcon className="size-4" />
											Dark
										</div>
									</SelectItem>
									<SelectItem value="system">
										<div className="flex items-center gap-2">
											<SettingsIcon className="size-4" />
											System
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<Separator />

					{/* Session */}
					<div className="space-y-4">
						<p className="text-xs uppercase tracking-wider text-muted-foreground">
							Session
						</p>
						<Button
							variant="outline"
							className="w-full gap-2"
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
							<LogOutIcon className="size-4" />
							Log out
						</Button>
					</div>
			</div>
		</div>
	);
}
