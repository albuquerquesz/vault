const CACHE_PREFIX = "finance:";
const DEFAULT_TTL_MS = 30_000;
function getKey(prefix, params) {
    return `${CACHE_PREFIX}${prefix}:${params}`;
}
export function getCachedData(prefix, params, ttlMs = DEFAULT_TTL_MS) {
    try {
        const raw = localStorage.getItem(getKey(prefix, params));
        if (!raw)
            return null;
        const entry = JSON.parse(raw);
        if (Date.now() - entry.timestamp > ttlMs) {
            localStorage.removeItem(getKey(prefix, params));
            return null;
        }
        return entry.data;
    }
    catch {
        return null;
    }
}
export function setCachedData(prefix, params, data) {
    try {
        localStorage.setItem(getKey(prefix, params), JSON.stringify({ data, timestamp: Date.now() }));
    }
    catch {
        // localStorage full or unavailable — ignore
    }
}
