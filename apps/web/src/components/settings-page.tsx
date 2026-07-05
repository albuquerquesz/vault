"use client";

import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@vault/ui/components/avatar";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent, CardHeader } from "@vault/ui/components/card";
import { Label } from "@vault/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import { Separator } from "@vault/ui/components/separator";
import {
	LogOutIcon,
	MoonIcon,
	SettingsIcon,
	SunIcon,
	UserIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { authClient } from "@/lib/auth-client";

export function SettingsPage() {
	const { theme, setTheme } = useTheme();
	const { data: session } = authClient.useSession();
	const navigate = useNavigate();

	const initials = session?.user.name
		? session.user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "?";

	return (
		<div className="w-[1200px] mx-auto space-y-6">
			<div className="flex items-center gap-3">
				<SettingsIcon className="size-5 text-muted-foreground" />
				<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
			</div>

			<Card className="financial-panel-border !pt-0 !pb-0 gap-0 p-0 ring-0">
				{/* Perfil */}
				<CardHeader className="px-4 py-3">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<UserIcon className="size-4" />
						<span>Perfil</span>
					</div>
				</CardHeader>
				<CardContent className="px-4 py-4 space-y-4">
					<div className="flex items-center gap-4">
						<Avatar className="size-14">
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
						<div>
							<p className="font-medium text-foreground">
								{session?.user.name || "Sem nome"}
							</p>
							<p className="text-sm text-muted-foreground">
								{session?.user.email}
							</p>
						</div>
					</div>
					<Separator />
					<div className="space-y-2">
						<Label className="text-sm text-muted-foreground">Nome</Label>
						<p className="text-sm text-foreground">
							{session?.user.name || "—"}
						</p>
					</div>
					<div className="space-y-2">
						<Label className="text-sm text-muted-foreground">Email</Label>
						<p className="text-sm text-foreground">{session?.user.email}</p>
					</div>
				</CardContent>

				{/* Conta */}
				<CardHeader className="px-4 py-3">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<SettingsIcon className="size-4" />
						<span>Conta</span>
					</div>
				</CardHeader>
				<CardContent className="px-4 py-4 space-y-6">
					<div className="space-y-2">
						<Label className="text-sm text-muted-foreground">Tema</Label>
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

					<Separator />

					<div className="space-y-2">
						<Label className="text-sm text-muted-foreground">Sessão</Label>
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
							Sair
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
