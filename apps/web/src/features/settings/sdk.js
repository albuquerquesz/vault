import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { apiFetch, queryClient } from "@/utils/api";
// Query keys
const PREFERENCES_KEY = ["settings", "preferences"];
const PROFILE_KEY = ["settings", "profile"];
const PLUGGY_CREDENTIALS_KEY = ["settings", "pluggy-credentials"];
// SDK
export const settingsSdk = {
    preferencesOptions() {
        return {
            queryKey: PREFERENCES_KEY,
            queryFn: () => apiFetch("/api/settings/preferences"),
        };
    },
    profileOptions() {
        return {
            queryKey: PROFILE_KEY,
            queryFn: () => apiFetch("/api/settings/profile"),
        };
    },
    updatePreferencesMutationOptions() {
        return {
            mutationFn: (data) => apiFetch("/api/settings/preferences", {
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
            mutationFn: (data) => apiFetch("/api/settings/profile", {
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
            mutationFn: (dataUrl) => apiFetch("/api/settings/avatar", {
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
export function nextIncomeDate(incomeDay, month = getMonthValue()) {
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
export function usePluggyCredentialsStatus(options) {
    return useQuery({
        queryKey: PLUGGY_CREDENTIALS_KEY,
        queryFn: () => apiFetch("/api/settings/pluggy/credentials/status"),
        ...(options ?? {}),
    });
}
export function useSavePluggyCredentials() {
    return useMutation({
        mutationFn: (data) => apiFetch("/api/settings/pluggy/credentials", {
            method: "POST",
            body: data,
        }),
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
        mutationFn: () => apiFetch("/api/settings/pluggy/credentials", {
            method: "DELETE",
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PLUGGY_CREDENTIALS_KEY });
            toast.success("Chaves Pluggy removidas");
        },
        onError: () => {
            toast.error("Falha ao remover chaves Pluggy");
        },
    });
}
