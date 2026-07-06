"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@vault/ui/components/avatar";
import { Button } from "@vault/ui/components/button";
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import { Separator } from "@vault/ui/components/separator";
import { cn } from "@vault/ui/lib/utils";
import {
	CameraIcon,
	CircleHelpIcon,
	InfoIcon,
	KeyRoundIcon,
	MailIcon,
	MonitorIcon,
	MoonIcon,
	Settings2Icon,
	SunIcon,
	UserRoundIcon,
	XIcon,
	LogOutIcon,
} from "lucide-react";
import * as React from "react";

import { useTheme } from "@/components/theme-provider";
import { authClient } from "@/lib/auth-client";

type SettingsSection = "general" | "account" | "about";

type SettingsModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const settingsSections: Array<{
	id: SettingsSection;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}> = [
	{ id: "general", label: "Geral", icon: Settings2Icon },
	{ id: "account", label: "Conta", icon: UserRoundIcon },
	{ id: "about", label: "Sobre", icon: InfoIcon },
];

function SectionCard({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("rounded-3xl border border-border/70 bg-muted/20 p-5", className)}>
			{children}
		</div>
	);
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const { theme, setTheme } = useTheme();
	const [activeSection, setActiveSection] = React.useState<SettingsSection>("general");
	const [incomeAmount, setIncomeAmount] = React.useState("5500");
	const [incomeDay, setIncomeDay] = React.useState("1");
	const [pluggyApiKey, setPluggyApiKey] = React.useState("");
	const [editEmail, setEditEmail] = React.useState(session?.user.email ?? "");

	React.useEffect(() => {
		if (!open) {
			setActiveSection("general");
		}
	}, [open]);

	React.useEffect(() => {
		setEditEmail(session?.user.email ?? "");
	}, [session?.user.email]);

	const name = session?.user.name ?? "";
	const email = session?.user.email ?? "";
	const image = session?.user.image ?? "";
	const initials = name
		? name
				.split(" ")
				.map((part) => part[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "?";

	const selectedTheme = theme ?? "system";

	const handleSignOut = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					onOpenChange(false);
					navigate({ to: "/login" });
				},
			},
		});
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm" />
				<Dialog.Popup className="fixed left-1/2 top-1/2 z-50 h-[min(92vh,60rem)] w-[min(calc(100vw-2rem),64rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-border/70 bg-card text-card-foreground shadow-2xl transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0">
					<div className="grid h-full min-h-0 md:grid-cols-[16rem_minmax(0,1fr)]">
						<aside className="flex min-h-0 flex-col border-b border-border/70 p-7 md:border-b-0 md:border-r">
							<div className="flex items-start justify-between gap-4">
								<div>
									<h2 className="text-3xl font-semibold tracking-tight">Configurações</h2>
								</div>
								<Dialog.Close
									render={<Button className="rounded-full" size="icon-sm" variant="ghost" />}
								>
									<XIcon className="size-4" />
								</Dialog.Close>
							</div>

							<nav className="mt-8 flex flex-col gap-2">
								{settingsSections.map((section) => {
									const Icon = section.icon;
									const isActive = activeSection === section.id;

									return (
										<button
											key={section.id}
											type="button"
											className={cn(
												"flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-lg transition-colors",
												isActive
													? "bg-muted text-foreground"
													: "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
											)}
											onClick={() => setActiveSection(section.id)}
										>
											<Icon className="size-5" />
											<span>{section.label}</span>
										</button>
									);
								})}
							</nav>
						</aside>

						<div className="min-h-0 overflow-y-auto p-7">
							{activeSection === "general" ? (
								<div className="space-y-5">
									<div>
										<h3 className="text-3xl font-semibold tracking-tight">Geral</h3>
									</div>

									<SectionCard className="space-y-4">
										<div>
											<p className="text-2xl font-medium">Tema</p>
										</div>
										<div className="grid grid-cols-1 gap-2 rounded-2xl border border-border/70 bg-background/50 p-2 sm:grid-cols-3">
											{[
												{ value: "light", label: "Claro", icon: SunIcon },
												{ value: "system", label: "Sistema", icon: MonitorIcon },
												{ value: "dark", label: "Escuro", icon: MoonIcon },
											].map((option) => {
												const Icon = option.icon;
												const isSelected = selectedTheme === option.value;

												return (
													<Button
														key={option.value}
														className={cn(
															"h-12 rounded-xl text-base",
															isSelected
																? "bg-primary text-primary-foreground hover:bg-primary/90"
																: "text-muted-foreground hover:bg-muted",
														)}
														onClick={() => setTheme(option.value)}
														type="button"
														variant="ghost"
													>
														<Icon className="size-4" />
														{option.label}
													</Button>
												);
											})}
										</div>
									</SectionCard>

									<SectionCard className="space-y-4">
										<div className="space-y-1">
											<p className="text-2xl font-medium">Quanto você recebe?</p>
											<p className="text-sm text-muted-foreground">
												Preencha o valor mensal para futuras automações.
											</p>
										</div>
										<div className="space-y-2">
											<Label htmlFor="settings-income-amount">Valor mensal</Label>
											<Input
												id="settings-income-amount"
												inputMode="decimal"
												placeholder="R$ 0,00"
												value={incomeAmount}
												onChange={(event) => setIncomeAmount(event.target.value)}
												className="h-11 rounded-2xl px-4 text-base"
											/>
										</div>
									</SectionCard>

									<SectionCard className="space-y-4">
										<div className="space-y-1">
											<p className="text-2xl font-medium">Quando você recebe?</p>
											<p className="text-sm text-muted-foreground">
												Escolha o dia do mês em que o salário cai na conta.
											</p>
										</div>
										<div className="space-y-2">
											<Label htmlFor="settings-income-day">Dia do mês</Label>
											<Input
												id="settings-income-day"
												max="31"
												min="1"
												placeholder="1"
												type="number"
												value={incomeDay}
												onChange={(event) => setIncomeDay(event.target.value)}
												className="h-11 rounded-2xl px-4 text-base"
											/>
										</div>
									</SectionCard>

									<SectionCard className="space-y-4">
										<div className="space-y-1">
											<p className="text-2xl font-medium">API key do Pluggy</p>
											<p className="text-sm text-muted-foreground">
												Este campo está pronto, mas ainda não salva nem ativa a integração.
											</p>
										</div>
										<div className="flex flex-col gap-3 sm:flex-row">
											<div className="relative flex-1">
												<KeyRoundIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
												<Input
													className="h-11 rounded-2xl pl-10 pr-4 text-base"
													placeholder="Insira sua API key"
													value={pluggyApiKey}
													onChange={(event) => setPluggyApiKey(event.target.value)}
												/>
											</div>
											<Button className="h-11 rounded-2xl px-6" disabled type="button" variant="outline">
												Salvar
											</Button>
										</div>
									</SectionCard>
								</div>
							) : null}

							{activeSection === "account" ? (
								<div className="space-y-5">
									<div>
										<h3 className="text-3xl font-semibold tracking-tight">Conta</h3>
									</div>

									<SectionCard className="space-y-5">
										<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
											<Avatar className="size-20" size="lg">
												{image ? <AvatarImage src={image} /> : null}
												<AvatarFallback className="text-xl">{initials}</AvatarFallback>
											</Avatar>
											<div className="space-y-1">
												<p className="text-2xl font-medium">{name || "Sua conta"}</p>
												<p className="text-sm text-muted-foreground">{email || "Sem e-mail cadastrado"}</p>
											</div>
											<div className="sm:ml-auto">
												<Button className="rounded-2xl" disabled type="button" variant="outline">
													<CameraIcon className="size-4" />
													Alterar foto de perfil
												</Button>
											</div>
										</div>

										<Separator />

										<div className="space-y-2">
											<Label htmlFor="settings-account-email">Alterar email</Label>
											<div className="flex flex-col gap-3 sm:flex-row">
												<div className="relative flex-1">
													<MailIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
													<Input
														id="settings-account-email"
														className="h-11 rounded-2xl pl-10 pr-4 text-base"
														placeholder="voce@email.com"
														type="email"
														value={editEmail}
														onChange={(event) => setEditEmail(event.target.value)}
													/>
												</div>
												<Button className="h-11 rounded-2xl px-6" disabled type="button">
													Salvar email
												</Button>
											</div>
											<p className="text-sm text-muted-foreground">
												Atualização de email e foto de perfil chegam em uma próxima versão.
											</p>
										</div>
									</SectionCard>

									<SectionCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
										<div className="space-y-1">
											<p className="text-2xl font-medium">Sessão</p>
											<p className="text-sm text-muted-foreground">
												Encerrar a sessão atual neste dispositivo.
											</p>
										</div>
										<Button className="rounded-2xl" onClick={handleSignOut} type="button" variant="destructive">
											<LogOutIcon className="size-4" />
											Fazer logout
										</Button>
									</SectionCard>
								</div>
							) : null}

							{activeSection === "about" ? (
								<div className="space-y-5">
									<div>
										<h3 className="text-3xl font-semibold tracking-tight">Sobre</h3>
									</div>

									<SectionCard className="space-y-4">
										<div className="space-y-1">
											<p className="text-2xl font-medium">Documentos legais</p>
											<p className="text-sm text-muted-foreground">
												Os links existem no layout, mas ainda não possuem conteúdo publicado.
											</p>
										</div>
										<div className="grid gap-3">
											<Button className="h-12 justify-start rounded-2xl text-base" disabled type="button" variant="outline">
												<CircleHelpIcon className="size-4" />
												Termos de uso
											</Button>
											<Button className="h-12 justify-start rounded-2xl text-base" disabled type="button" variant="outline">
												<InfoIcon className="size-4" />
												Política de privacidade
											</Button>
										</div>
									</SectionCard>
								</div>
							) : null}
						</div>
					</div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
