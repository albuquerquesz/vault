import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/api";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";

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

// Query keys

const PREFERENCES_KEY = ["settings", "preferences"] as const;
const PROFILE_KEY = ["settings", "profile"] as const;

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
					body: JSON.stringify(data),
				}),
			onSuccess: (_data, _variables, queryClient) => {
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
					body: JSON.stringify(data),
				}),
			onSuccess: (_data, _variables, queryClient) => {
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
					body: JSON.stringify({ dataUrl }),
				}),
			onSuccess: (_data, _variables, queryClient) => {
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

export function invalidateSettingsQueries(queryClient: ReturnType<typeof useQueryClient>) {
	queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY });
	queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
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
		onSuccess: (data, variables, qc) => {
			opts.onSuccess(data, variables, qc);
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