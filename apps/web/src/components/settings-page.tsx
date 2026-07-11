"use client";

import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@vault/ui/components/avatar";
import { Button } from "@vault/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@vault/ui/components/card";
import { Input } from "@vault/ui/components/input";
import { Label } from "@vault/ui/components/label";
import { Tabs, TabsList, TabsTrigger } from "@vault/ui/components/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@vault/ui/components/tooltip";
import { cn } from "@vault/ui/lib/utils";
import {
  CameraIcon,
  CircleHelpIcon,
  InfoIcon,
  KeyRoundIcon,
  LogOutIcon,
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
import {
  useUpdatePreferences,
  useUpdateProfile,
  useUpdateAvatar,
  useUserPreferences,
  useUserProfile,
} from "@/features/settings/sdk";
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
              "h-8 flex-none rounded-full border-0 px-4 text-sm font-medium shadow-none after:hidden",
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
  const { data: prefs, isLoading: prefsLoading } = useUserPreferences();
  const updatePreferences = useUpdatePreferences();

  // Local editing state — synced from prefs on load
  const [incomeAmount, setIncomeAmount] = React.useState("");
  const [incomeDay, setIncomeDay] = React.useState("");
  const [pluggyClientId, setPluggyClientId] = React.useState("");
  const [pluggyClientSecret, setPluggyClientSecret] = React.useState("");
  const {
    data: pluggyStatus,
    isLoading: isLoadingPluggyStatus,
    isFetching: isFetchingPluggyStatus,
  } = usePluggyCredentialsStatus({ enabled: Boolean(session?.user) });
  const savePluggyCredentials = useSavePluggyCredentials();
  const deletePluggyCredentials = useDeletePluggyCredentials();

  // Sync income/day from API prefs
  React.useEffect(() => {
    if (prefs) {
      setIncomeAmount(prefs.monthlyIncome?.toString() ?? "");
      setIncomeDay(prefs.incomeDay?.toString() ?? "");
    }
  }, [prefs]);

  // Apply saved theme from API on first load
  React.useEffect(() => {
    if (prefs && prefs.theme && prefs.theme !== "system") {
      setTheme(prefs.theme);
    }
  }, []); // only on mount

  const selectedTheme = theme ?? "system";

  const handleSaveIncome = () => {
    const monthlyIncome = incomeAmount
      ? parseFloat(incomeAmount.replace(",", "."))
      : null;
    const incomeDay = incomeDay ? parseInt(incomeDay, 10) : null;

    updatePreferences.mutate({
      monthlyIncome: isNaN(monthlyIncome as number) ? null : monthlyIncome,
      incomeDay:
        isNaN(incomeDay as number) ||
          (incomeDay as number) < 1 ||
          (incomeDay as number) > 28
          ? null
          : incomeDay,
    });
  };

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

  if (prefsLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="space-y-4">
      <SettingsSectionCard className="min-h-48">
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
                onClick={() => {
                  setTheme(option.value);
                  // Persist theme to API — map "system" to null
                  updatePreferences.mutate({
                    theme: option.value === "system" ? null : option.value,
                  });
                }}
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
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-end">
          <div className="w-full max-w-sm space-y-2">
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
          <Button
            className="h-9 rounded-md px-4 sm:self-end"
            onClick={handleSaveIncome}
            type="button"
            disabled={updatePreferences.isPending}
          >
            {updatePreferences.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard className="min-h-48">
        <div className="space-y-1">
          <p className="text-lg font-medium" style={headingStyle}>
            Quando você recebe?
          </p>
          <p className="text-sm text-muted-foreground">
            Escolha o dia do mês em que o salário cai na conta.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-end">
          <div className="w-full max-w-[12rem] space-y-2">
            <Label htmlFor="settings-income-day">Dia do mês</Label>
            <Input
              id="settings-income-day"
              max="28"
              min="1"
              placeholder="1"
              type="number"
              value={incomeDay}
              onChange={(event) => setIncomeDay(event.target.value)}
              className="h-9 rounded-md px-3 text-sm"
            />
          </div>
          <Button
            className="h-9 rounded-md px-4 sm:self-end"
            onClick={handleSaveIncome}
            type="button"
            disabled={updatePreferences.isPending}
          >
            {updatePreferences.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard className="min-h-48">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-medium" style={headingStyle}>
            Pluggy (BYOK)
          </p>
          <Tooltip>
            <TooltipTrigger
              delay={200}
              aria-label="Sobre Pluggy BYOK"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <InfoIcon className="size-4" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-black text-left leading-relaxed text-white [&>[data-side]]:bg-black [&>[data-side]]:fill-black">
              Suas chaves Pluggy (BYOK). O secret é criptografado e nunca volta
              ao navegador.
            </TooltipContent>
          </Tooltip>
        </div>

        <form className="space-y-4" onSubmit={handleSavePluggyCredentials}>
          <div className="space-y-2">
            <Label htmlFor="settings-pluggy-client-id">PLUGGY_CLIENT_ID</Label>
            <div className="relative">
              <KeyRoundIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="settings-pluggy-client-id"
                name="pluggyClientId"
                className="h-9 rounded-md pl-10 pr-3 font-mono text-sm"
                placeholder="f47ac10b-58cc-4372-a567-0e02b2c3d479"
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
              placeholder="9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
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
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();

  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");

  // Sync from API profile
  React.useEffect(() => {
    if (profile) {
      setEditName(profile.name ?? "");
      setEditEmail(profile.email ?? "");
    }
  }, [profile]);

  const name = profile?.name ?? session?.user.name ?? "";
  const image = profile?.image ?? session?.user.image ?? "";
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

  const handleSaveProfile = () => {
    updateProfile.mutate({
      name: editName.trim() || null,
      email: editEmail.trim() || null,
    });
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateAvatar.mutate(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can trigger onChange again
    event.target.value = "";
  };

  if (profileLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border border-border/70 bg-background/60 ring-0">
        <CardHeader>
          <CardTitle className="text-lg font-medium" style={headingStyle}>
            Conta
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-28 rounded-2xl after:rounded-2xl" size="lg">
              {image ? (
                <AvatarImage className="rounded-2xl" src={image} />
              ) : null}
              <AvatarFallback className="rounded-2xl text-3xl font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3 text-sm shadow-none hover:bg-muted disabled:opacity-50">
                <CameraIcon className="size-4" />
                Atualizar imagem
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  type="file"
                  onChange={handleAvatarChange}
                  disabled={updateAvatar.isPending}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Tamanho máximo: 5 MB. JPG, PNG ou WebP.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-4 lg:max-w-md">
              <div className="space-y-2">
                <Label htmlFor="settings-account-name">Nome</Label>
                <Input
                  id="settings-account-name"
                  className="h-9 rounded-md px-3 text-sm"
                  placeholder="Seu nome"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-account-email">Email</Label>
                <Input
                  id="settings-account-email"
                  className="h-9 rounded-md px-3 text-sm"
                  placeholder="voce@email.com"
                  type="email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                />
              </div>
            </div>

            <Button
              className="h-9 rounded-md px-4 lg:mb-0.5"
              onClick={handleSaveProfile}
              type="button"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SettingsSectionCard>
        <div className="flex flex-col items-start gap-4">
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
      <SettingsSectionCard>
        <div className="space-y-1">
          <p className="text-lg font-medium" style={headingStyle}>
            Documentos legais
          </p>
          <p className="text-sm text-muted-foreground">
            Informações sobre o Vault e documentos legais.
          </p>
        </div>
        <div className="grid gap-3">
          <a
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm shadow-none hover:bg-muted"
            href="https://vault.finance/terms"
            rel="noopener noreferrer"
            target="_blank"
          >
            <CircleHelpIcon className="size-4" />
            Termos de uso
          </a>
          <a
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm shadow-none hover:bg-muted"
            href="https://vault.finance/privacy"
            rel="noopener noreferrer"
            target="_blank"
          >
            <InfoIcon className="size-4" />
            Política de privacidade
          </a>
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
