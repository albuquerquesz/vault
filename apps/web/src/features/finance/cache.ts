const CACHE_PREFIX = "finance:";
const DEFAULT_TTL_MS = 30_000;

type CacheEntry<T> = {
	data: T;
	timestamp: number;
};

function getKey(prefix: string, params: string): string {
	return `${CACHE_PREFIX}${prefix}:${params}`;
}

export function getCachedData<T>(
	prefix: string,
	params: string,
	ttlMs = DEFAULT_TTL_MS,
): T | null {
	try {
		const raw = localStorage.getItem(getKey(prefix, params));
		if (!raw) return null;

		const entry: CacheEntry<T> = JSON.parse(raw);
		if (Date.now() - entry.timestamp > ttlMs) {
			localStorage.removeItem(getKey(prefix, params));
			return null;
		}
		return entry.data;
	} catch {
		return null;
	}
}

export function setCachedData<T>(
	prefix: string,
	params: string,
	data: T,
): void {
	try {
		localStorage.setItem(
			getKey(prefix, params),
			JSON.stringify({ data, timestamp: Date.now() } satisfies CacheEntry<T>),
		);
	} catch {
		// localStorage full or unavailable — ignore
	}
}
