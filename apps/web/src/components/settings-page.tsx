"use client";

import { useNavigate, useSearch } from "@tanstack/react-router";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@vault/ui/components/avatar";
import { Button } from "@vault/ui/components/button";
import { Card, CardContent } from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import { Separator } from "@vault/ui/components/separator";
import { Tabs, TabsList, TabsTrigger } from "@vault/ui/components/tabs";
import { cn } from "@vault/ui/lib/utils";
import {
	CameraIcon,
	CircleHelpIcon,
	InfoIcon,
	KeyRoundIcon,
	LogOutIcon,
	MailIcon,
	MonitorIcon,
	MoonIcon,
	SunIcon,
} from "lucide-react";
import * as React from "react";

import { PageContent } from "@/components/page-content";
import { useTheme } from "@/components/theme-provider";
import {
	useDeletePluggyCredentials,
	usePluggyCredentialsStatus,
	useSavePluggyCredentials,
} from "@/features/pluggy/sdk";
import { authClient } from "@/lib/auth-client";

export type SettingsSection = "general" | "account" | "about";

const SETTINGS_SECTIONS = ["general", "account", "about"] as const;

const settingsSections: Array<{
	id: SettingsSection;
	label: string;
}> = [
	{ id: "general", label: "Geral" },
	{ id: "account", label: "Conta" },
	{ id: "about", label: "Sobre" },
];

function isSettingsSection(value: unknown): value is SettingsSection {
	return (
		typeof value === "string" &&
		(SETTINGS_SECTIONS as readonly string[]).includes(value)
	);
}

const headingStyle = { fontFamily: '"Space Grotesk", sans-serif' } as const;

function SettingsSectionCard({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Card
			className={cn(
				"rounded-2xl border border-border/70 bg-background/60 ring-0",
				className,
			)}
		>
			<CardContent className="space-y-4">{children}</CardContent>
		</Card>
	);
}

/** Horizontal chip section nav (shadcn Tabs, pill style — PRD 06). */
function SettingsSectionChips({
	activeSection,
	onSectionChange,
}: {
	activeSection: SettingsSection;
	onSectionChange: (section: SettingsSection) => void;
}) {
	return (
		<Tabs
			value={activeSection}
			onValueChange={(value) => {
				if (isSettingsSection(value)) onSectionChange(value);
			}}
		>
			<TabsList
				aria-label="Seções de configurações"
				className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0"
			>
				{settingsSections.map((section) => (
					<TabsTrigger
						key={section.id}
						value={section.id}
						className={cn(
							// Loose chips (not a single segmented track): full pill, muted active fill
							"h-8 flex-none rounded-full border-0 px-3 text-sm font-medium shadow-none after:hidden",
							"text-muted-foreground hover:bg-muted/50 hover:text-foreground",
							"data-active:bg-muted data-active:text-foreground",
							"dark:data-active:border-transparent dark:data-active:bg-muted dark:data-active:text-foreground",
						)}
					>
						{section.label}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	);
}

const THEME_OPTIONS = [
	{ value: "light", label: "Claro", icon: SunIcon },
	{ value: "system", label: "Sistema", icon: MonitorIcon },
	{ value: "dark", label: "Escuro", icon: MoonIcon },
] as const;

function GeneralSettings() {
	const { theme, setTheme } = useTheme();
	const { data: session } = authClient.useSession();
	const [incomeAmount, setIncomeAmount] = React.useState("5500");
	const [incomeDay, setIncomeDay] = React.useState("1");
	const [pluggyClientId, setPluggyClientId] = React.useState("");
	const [pluggyClientSecret, setPluggyClientSecret] = React.useState("");
	const {
		data: pluggyStatus,
		isLoading: isLoadingPluggyStatus,
		isFetching: isFetchingPluggyStatus,
	} = usePluggyCredentialsStatus({ enabled: Boolean(session?.user) });
	const savePluggyCredentials = useSavePluggyCredentials();
	const deletePluggyCredentials = useDeletePluggyCredentials();

	const selectedTheme = theme ?? "system";

	const handleSavePluggyCredentials = (event: React.FormEvent) => {
		event.preventDefault();
		const clientId = pluggyClientId.trim();
		const clientSecret = pluggyClientSecret.trim();
		if (!clientId || !clientSecret || savePluggyCredentials.isPending) return;

		savePluggyCredentials.mutate(
			{ clientId, clientSecret },
			{
				onSuccess: () => {
					setPluggyClientId("");
					setPluggyClientSecret("");
				},
			},
		);
	};

	return (
		<div className="space-y-4">
			<SettingsSectionCard>
				<div>
					<p className="text-lg font-medium" style={headingStyle}>
						Tema
					</p>
				</div>
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
					{THEME_OPTIONS.map((option) => {
						const Icon = option.icon;
						const isSelected = selectedTheme === option.value;

						return (
							<Button
								key={option.value}
								className={cn(
									"h-10 rounded-xl text-sm",
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
			</SettingsSectionCard>

			<SettingsSectionCard>
				<div className="space-y-1">
					<p className="text-lg font-medium" style={headingStyle}>
						Quanto você recebe?
					</p>
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
						className="h-9 rounded-md px-3 text-sm"
					/>
				</div>
			</SettingsSectionCard>

			<SettingsSectionCard>
				<div className="space-y-1">
					<p className="text-lg font-medium" style={headingStyle}>
						Quando você recebe?
					</p>
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
						className="h-9 rounded-md px-3 text-sm"
					/>
				</div>
			</SettingsSectionCard>

			<SettingsSectionCard>
				<div className="space-y-1">
					<p className="text-lg font-medium" style={headingStyle}>
						Pluggy (BYOK)
					</p>
					<p className="text-sm text-muted-foreground">
						Informe manualmente o{" "}
						<span className="font-medium text-foreground">Client ID</span> e o{" "}
						<span className="font-medium text-foreground">Client Secret</span>{" "}
						do seu app em{" "}
						<a
							className="underline underline-offset-2 hover:text-foreground"
							href="https://dashboard.pluggy.ai"
							rel="noreferrer"
							target="_blank"
						>
							dashboard.pluggy.ai
						</a>
						. Equivalente a{" "}
						<code className="rounded bg-muted px-1 py-0.5 text-xs">
							PLUGGY_CLIENT_ID
						</code>{" "}
						e{" "}
						<code className="rounded bg-muted px-1 py-0.5 text-xs">
							PLUGGY_CLIENT_SECRET
						</code>
						. O secret é criptografado e nunca volta ao navegador.
					</p>
				</div>

				{isLoadingPluggyStatus || isFetchingPluggyStatus ? (
					<p className="text-sm text-muted-foreground">Carregando status…</p>
				) : pluggyStatus?.configured ? (
					<p className="text-sm text-emerald-600 dark:text-emerald-400">
						Configurado
						{pluggyStatus.clientIdMasked
							? ` · ${pluggyStatus.clientIdMasked}`
							: ""}{" "}
						(suas chaves)
					</p>
				) : (
					<p className="text-sm text-amber-600 dark:text-amber-400">
						Não configurado — preencha Client ID e Client Secret para conectar
						bancos.
					</p>
				)}

				<form className="space-y-4" onSubmit={handleSavePluggyCredentials}>
					<div className="space-y-2">
						<Label htmlFor="settings-pluggy-client-id">PLUGGY_CLIENT_ID</Label>
						<div className="relative">
							<KeyRoundIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="settings-pluggy-client-id"
								name="pluggyClientId"
								className="h-9 rounded-md pl-10 pr-3 font-mono text-sm"
								placeholder="uuid do Client ID"
								autoComplete="off"
								spellCheck={false}
								value={pluggyClientId}
								onChange={(event) => setPluggyClientId(event.target.value)}
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="settings-pluggy-client-secret">
							PLUGGY_CLIENT_SECRET
						</Label>
						<Input
							id="settings-pluggy-client-secret"
							name="pluggyClientSecret"
							className="h-9 rounded-md px-3 font-mono text-sm"
							placeholder="Client Secret do dashboard"
							type="password"
							autoComplete="new-password"
							spellCheck={false}
							value={pluggyClientSecret}
							onChange={(event) => setPluggyClientSecret(event.target.value)}
							required
						/>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row">
						<Button
							className="h-9 rounded-md px-4"
							type="submit"
							disabled={
								!pluggyClientId.trim() ||
								!pluggyClientSecret.trim() ||
								savePluggyCredentials.isPending
							}
						>
							{savePluggyCredentials.isPending
								? "Validando no Pluggy…"
								: pluggyStatus?.configured
									? "Atualizar chaves"
									: "Salvar chaves"}
						</Button>
						{pluggyStatus?.configured ? (
							<Button
								className="h-9 rounded-md px-4"
								type="button"
								variant="outline"
								disabled={deletePluggyCredentials.isPending}
								onClick={() => deletePluggyCredentials.mutate()}
							>
								{deletePluggyCredentials.isPending
									? "Removendo…"
									: "Remover minhas chaves"}
							</Button>
						) : null}
					</div>
				</form>
			</SettingsSectionCard>
		</div>
	);
}

function AccountSettings() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const [editEmail, setEditEmail] = React.useState(session?.user.email ?? "");

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
		<div className="space-y-4">
			<div>
				<h2
					className="text-xl font-semibold tracking-tight md:text-2xl"
					style={headingStyle}
				>
					Conta
				</h2>
			</div>

			<SettingsSectionCard>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
					<Avatar className="size-20" size="lg">
						{image ? <AvatarImage src={image} /> : null}
						<AvatarFallback className="text-xl">{initials}</AvatarFallback>
					</Avatar>
					<div className="space-y-1">
						<p className="text-lg font-medium" style={headingStyle}>
							{name || "Sua conta"}
						</p>
						<p className="text-sm text-muted-foreground">
							{email || "Sem e-mail cadastrado"}
						</p>
					</div>
					<div className="sm:ml-auto">
						<Button
							className="rounded-md"
							disabled
							type="button"
							variant="outline"
						>
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
								className="h-9 rounded-md pl-10 pr-3 text-sm"
								placeholder="voce@email.com"
								type="email"
								value={editEmail}
								onChange={(event) => setEditEmail(event.target.value)}
							/>
						</div>
						<Button className="h-9 rounded-md px-4" disabled type="button">
							Salvar email
						</Button>
					</div>
					<p className="text-sm text-muted-foreground">
						Atualização de email e foto de perfil chegam em uma próxima versão.
					</p>
				</div>
			</SettingsSectionCard>

			<SettingsSectionCard className="sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<p className="text-lg font-medium" style={headingStyle}>
							Sessão
						</p>
						<p className="text-sm text-muted-foreground">
							Encerrar a sessão atual neste dispositivo.
						</p>
					</div>
					<Button
						className="rounded-md"
						onClick={handleSignOut}
						type="button"
						variant="destructive"
					>
						<LogOutIcon className="size-4" />
						Fazer logout
					</Button>
				</div>
			</SettingsSectionCard>
		</div>
	);
}

function AboutSettings() {
	return (
		<div className="space-y-4">
			<div>
				<h2
					className="text-xl font-semibold tracking-tight md:text-2xl"
					style={headingStyle}
				>
					Sobre
				</h2>
			</div>

			<SettingsSectionCard>
				<div className="space-y-1">
					<p className="text-lg font-medium" style={headingStyle}>
						Documentos legais
					</p>
					<p className="text-sm text-muted-foreground">
						Os links existem no layout, mas ainda não possuem conteúdo
						publicado.
					</p>
				</div>
				<div className="grid gap-3">
					<Button
						className="h-9 justify-start rounded-md text-sm"
						disabled
						type="button"
						variant="outline"
					>
						<CircleHelpIcon className="size-4" />
						Termos de uso
					</Button>
					<Button
						className="h-9 justify-start rounded-md text-sm"
						disabled
						type="button"
						variant="outline"
					>
						<InfoIcon className="size-4" />
						Política de privacidade
					</Button>
				</div>
			</SettingsSectionCard>
		</div>
	);
}

export function SettingsPage() {
	const navigate = useNavigate({ from: "/settings" });
	const search = useSearch({ from: "/settings" });
	const activeSection: SettingsSection = search.section ?? "general";

	const setActiveSection = (section: SettingsSection) => {
		void navigate({
			to: "/settings",
			search: { section },
			replace: true,
		});
	};

	return (
		<PageContent className="space-y-6 py-6">
			<div className="space-y-1">
				<h1
					className="text-2xl font-semibold tracking-tight"
					style={headingStyle}
				>
					Configurações
				</h1>
				<p className="text-sm text-muted-foreground">
					Ajustes da conta, preferências e integrações.
				</p>
			</div>

			<SettingsSectionChips
				activeSection={activeSection}
				onSectionChange={setActiveSection}
			/>

			<div className="min-w-0">
				{activeSection === "general" ? <GeneralSettings /> : null}
				{activeSection === "account" ? <AccountSettings /> : null}
				{activeSection === "about" ? <AboutSettings /> : null}
			</div>
		</PageContent>
	);
}
