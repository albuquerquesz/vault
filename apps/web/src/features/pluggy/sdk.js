import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/api";
const API_BASE = import.meta.env.VITE_API_BASE ??
    `http://${import.meta.env.DEV ? "localhost" : "100.100.100.100"}:3000`;
async function readApiError(res) {
    const text = await res.text().catch(() => "");
    if (!text) {
        return `HTTP ${res.status}`;
    }
    try {
        const data = JSON.parse(text);
        return data.error ?? data.message ?? text;
    }
    catch {
        return text;
    }
}
async function fetcher(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
    });
    if (!res.ok) {
        throw new Error(await readApiError(res));
    }
    return res.json();
}
// ─── Connect Token ──────────────────────────────────────────────────────────
export function usePluggyConnectToken() {
    return useMutation({
        mutationFn: async () => apiFetch("/api/pluggy/connect", {
            method: "POST",
        }).then((data) => data.url),
    });
}
// ─── Items ──────────────────────────────────────────────────────────────────
export function usePluggyItems() {
    return useQuery({
        queryKey: ["pluggy-items"],
        queryFn: () => fetcher("/api/pluggy/items"),
    });
}
export function usePluggyRegisterItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (pluggyItemId) => apiFetch("/api/pluggy/items", {
            method: "POST",
            body: { pluggyItemId },
        }),
        onSettled: async () => {
            await Promise.all([
                qc.invalidateQueries({ queryKey: ["pluggy-items"] }),
                qc.invalidateQueries({ queryKey: ["pluggy-transactions"] }),
                qc.invalidateQueries({ queryKey: ["pluggy-accounts"] }),
                qc.invalidateQueries({ queryKey: ["monthlyBills"] }),
            ]);
        },
    });
}
export function usePluggyDeleteItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (pluggyItemId) => apiFetch(`/api/pluggy/items/${encodeURIComponent(pluggyItemId)}`, {
            method: "DELETE",
        }),
        onSettled: async () => {
            await Promise.all([
                qc.invalidateQueries({ queryKey: ["pluggy-items"] }),
                qc.invalidateQueries({ queryKey: ["pluggy-transactions"] }),
                qc.invalidateQueries({ queryKey: ["pluggy-accounts"] }),
                qc.invalidateQueries({ queryKey: ["monthlyBills"] }),
            ]);
        },
    });
}
// ─── Accounts ───────────────────────────────────────────────────────────────
export function usePluggyAccounts() {
    return useQuery({
        queryKey: ["pluggy-accounts"],
        queryFn: () => fetcher("/api/pluggy/accounts"),
    });
}
// ─── Transactions ───────────────────────────────────────────────────────────
export function usePluggyTransactions(params) {
    const { itemId, accountId, limit = 50 } = params ?? {};
    return useQuery({
        queryKey: ["pluggy-transactions", itemId, accountId, limit],
        queryFn: () => {
            const qs = new URLSearchParams({ limit: String(limit) });
            if (itemId)
                qs.set("itemId", itemId);
            if (accountId)
                qs.set("accountId", accountId);
            return fetcher(`/api/pluggy/transactions?${qs.toString()}`);
        },
    });
}
// ─── Sync ───────────────────────────────────────────────────────────────────
export function usePluggySync() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (itemId) => apiFetch(`/api/pluggy/sync/${itemId}`, {
            method: "POST",
        }).then((data) => data.sync),
        onSettled: async () => {
            await Promise.all([
                qc.invalidateQueries({ queryKey: ["pluggy-items"] }),
                qc.invalidateQueries({ queryKey: ["pluggy-transactions"] }),
                qc.invalidateQueries({ queryKey: ["pluggy-accounts"] }),
                qc.invalidateQueries({ queryKey: ["monthlyBills"] }),
            ]);
        },
    });
}
