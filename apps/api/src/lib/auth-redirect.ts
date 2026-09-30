import { env } from "../db/env.js";

const frontAuthErrorUrlBase = `${env.CORS_ORIGIN.replace(/\/$/, "")}/auth/error`;

export function buildFrontAuthErrorUrl(
	query: Record<string, string | undefined>,
): string {
	const url = new URL(frontAuthErrorUrlBase);

	for (const key of ["error", "error_description", "state"]) {
		const value = query[key];
		if (value) {
			url.searchParams.set(key, value);
		}
	}

	return url.toString();
}
