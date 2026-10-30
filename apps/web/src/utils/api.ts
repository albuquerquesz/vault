import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

const SANITIZED_ERROR = "Algo deu errado. Tente novamente.";

export class ApiError extends Error {
	status: number;
	/** Stable server error code (e.g. `PLUGGY_INVALID_CREDENTIALS`), when provided. */
	code?: string;

	constructor(message: string, status: number, code?: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
	}

	get isAuthError() {
		return this.status === 401 || this.status === 403;
	}
}

/** Parses an error response body (`{ error, code }`) into an ApiError. */
export function parseApiError(status: number, text: string): ApiError {
	try {
		const body = JSON.parse(text) as {
			error?: string;
			message?: string;
			code?: string;
		};
		return new ApiError(body.error ?? body.message ?? text, status, body.code);
	} catch {
		return new ApiError(text || SANITIZED_ERROR, status);
	}
}

/** User-facing text for any error: server message plus its code when known. */
export function formatApiError(error: unknown): string {
	if (error instanceof ApiError && error.code) {
		return `${error.message} (código: ${error.code})`;
	}
	return sanitizeError(error instanceof Error ? error.message : String(error));
}

function sanitizeError(message: string): string {
	const patterns = [
		"relation",
		"column",
		"table",
		"does not exist",
		"SQL",
		"violates",
		"constraint",
		"null value",
		"in column",
		"fails",
		"pg_",
		"ERROR:",
		"Error:",
		"stack",
		"trace",
		"at ",
		"node_modules",
		"at /home",
		"at /var",
		"at /tmp",
		"at /usr",
		"at /opt",
		"at /root",
		"at /app",
		"at /src",
		"at /packages",
		"at /apps",
		"at /node_modules",
		"at /Users",
		"at /private",
		"at /tmp",
	];

	if (patterns.some((p) => message.toLowerCase().includes(p))) {
		return SANITIZED_ERROR;
	}

	return message;
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: (failureCount, error) => {
				if (error instanceof ApiError) {
					if (error.isAuthError) {
						return false;
					}

					if (error.status >= 500) {
						return failureCount < 3;
					}

					return false;
				}

				return failureCount < 3;
			},
		},
		mutations: {
			onSettled: () => {},
			onError: (error) => {
				// Coded server errors are already safe, user-facing text.
				const message =
					error instanceof ApiError && error.code
						? error.message
						: sanitizeError(error.message);
				toast.error(message, {
					description:
						error instanceof ApiError && error.code
							? `Código: ${error.code}`
							: "Ocorreu um erro",
					duration: 5000,
					action: {
						label: "Tentar novamente",
						onClick: () => {
							window.location.reload();
						},
					},
				});
			},
		},
	},
});

export async function apiFetch<T>(
	path: string,
	options?: {
		method?: string;
		body?: unknown;
	},
): Promise<T> {
	const hasBody = options?.body !== undefined;
	const headers: Record<string, string> = {};
	if (hasBody) {
		headers["Content-Type"] = "application/json";
	}
	if (import.meta.env.DEV && isDevAuthBypassEnabled()) {
		headers["x-vault-dev-auth-bypass"] = "1";
	}

	const response = await fetch(path, {
		method: options?.method ?? "GET",
		headers: Object.keys(headers).length > 0 ? headers : undefined,
		credentials: "include",
		body: hasBody ? JSON.stringify(options.body) : undefined,
	});

	if (!response.ok) {
		throw parseApiError(response.status, await response.text());
	}

	if (
		response.status === 204 ||
		response.headers.get("content-length") === "0"
	) {
		return undefined as T;
	}

	return response.json();
}
