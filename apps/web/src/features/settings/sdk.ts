import { useMutation, useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { apiFetch, queryClient } from "@/utils/api";
import { toast } from "sonner";
import dayjs from "dayjs";

// Types

export interface UserPreferences {
	theme: "light" | "dark" | null;
	monthlyIncome: number | null;
	incomeDay: number | null;
}

export interface UserProfile {
	name: string | null;
	email: string | null;
	image: string | null;
}

export interface UpdatePreferencesInput {
	theme?: "light" | "dark" | null;
	monthlyIncome?: number | null;
	incomeDay?: number | null;
}

export interface UpdateProfileInput {
	name?: string | null;
	email?: string | null;
}

export interface PluggyCredentialsStatus {
	configured: boolean;
	clientIdMasked: string | null;
}

export interface PluggyCredentialsInput {
	clientId: string;
	clientSecret: string;
}

// Query keys

const PREFERENCES_KEY = ["settings", "preferences"] as const;
const PROFILE_KEY = ["settings", "profile"] as const;
const PLUGGY_CREDENTIALS_KEY = ["settings", "pluggy-credentials"] as const;

// SDK

export const settingsSdk = {
	preferencesOptions(): {
		queryKey: typeof PREFERENCES_KEY;
		queryFn: () => Promise<UserPreferences>;
	} {
		return {
			queryKey: PREFERENCES_KEY,
			queryFn: () => apiFetch<UserPreferences>("/api/settings/preferences"),
		};
	},

	profileOptions(): {
		queryKey: typeof PROFILE_KEY;
		queryFn: () => Promise<UserProfile>;
	} {
		return {
			queryKey: PROFILE_KEY,
			queryFn: () => apiFetch<UserProfile>("/api/settings/profile"),
		};
	},

	updatePreferencesMutationOptions() {
		return {
			mutationFn: (data: UpdatePreferencesInput) =>
				apiFetch<UserPreferences>("/api/settings/preferences", {
					method: "PATCH",
					body: data,
				}),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY });
				toast.success("Preferências salvas");
			},
			onError: () => {
				toast.error("Falha ao salvar preferências");
			},
		};
	},

	updateProfileMutationOptions() {
		return {
			mutationFn: (data: UpdateProfileInput) =>
				apiFetch<UserProfile>("/api/settings/profile", {
					method: "PATCH",
					body: data,
				}),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
				toast.success("Perfil atualizado");
			},
			onError: () => {
				toast.error("Falha ao atualizar perfil");
			},
		};
	},

	updateAvatarMutationOptions() {
		return {
			mutationFn: (dataUrl: string) =>
				apiFetch<{ image: string | null }>("/api/settings/avatar", {
					method: "POST",
					body: { dataUrl },
				}),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
				toast.success("Avatar atualizado");
			},
			onError: () => {
				toast.error("Falha ao enviar avatar");
			},
		};
	},
};

// Helpers

export function invalidateSettingsQueries() {
	queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY });
	queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
}

/** Returns the current month as YYYY-MM using dayjs. */
export function getMonthValue(date = dayjs()) {
	return date.format("YYYY-MM");
}

/** Returns today as YYYY-MM-DD using dayjs. */
export function getTodayValue(date = dayjs()) {
	return date.format("YYYY-MM-DD");
}

/** Computes the next income date given an income day and the current month. */
export function nextIncomeDate(incomeDay: number, month = getMonthValue()) {
	const d = dayjs(month).date(incomeDay);
	return d.isBefore(dayjs()) ? d.add(1, "month") : d;
}

// Hooks

export function useUserPreferences() {
	const opts = settingsSdk.preferencesOptions();
	return useQuery(opts);
}

export function useUserProfile() {
	const opts = settingsSdk.profileOptions();
	return useQuery(opts);
}

export function useUpdatePreferences() {
	const { setTheme } = useTheme();
	const opts = settingsSdk.updatePreferencesMutationOptions();
	return useMutation({
		...opts,
		onSuccess: (_data, variables) => {
			opts.onSuccess?.();
			if (variables.theme) {
				setTheme(variables.theme);
			}
		},
	});
}

export function useUpdateProfile() {
	const opts = settingsSdk.updateProfileMutationOptions();
	return useMutation(opts);
}

export function useUpdateAvatar() {
	const opts = settingsSdk.updateAvatarMutationOptions();
	return useMutation(opts);
}

// --- Pluggy Credentials ---

export function usePluggyCredentialsStatus(options?: {
	enabled?: boolean;
}) {
	return useQuery({
		queryKey: PLUGGY_CREDENTIALS_KEY,
		queryFn: () =>
			apiFetch<PluggyCredentialsStatus>(
				"/api/settings/pluggy/credentials/status",
			),
		...(options ?? {}),
	});
}

export function useSavePluggyCredentials() {
	return useMutation({
		mutationFn: (data: PluggyCredentialsInput) =>
			apiFetch<PluggyCredentialsStatus>(
				"/api/settings/pluggy/credentials",
				{
					method: "POST",
					body: data,
				},
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PLUGGY_CREDENTIALS_KEY });
			toast.success("Chaves Pluggy salvas com sucesso");
		},
		onError: () => {
			toast.error("Falha ao salvar chaves Pluggy");
		},
	});
}

export function useDeletePluggyCredentials() {
	return useMutation({
		mutationFn: () =>
			apiFetch<PluggyCredentialsStatus>(
				"/api/settings/pluggy/credentials",
				{ method: "DELETE" },
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: PLUGGY_CREDENTIALS_KEY });
			toast.success("Chaves Pluggy removidas");
		},
		onError: () => {
			toast.error("Falha ao remover chaves Pluggy");
		},
	});
}
