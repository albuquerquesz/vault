import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";

const SANITIZED_ERROR = "Something went wrong. Please try again.";

export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}

	get isAuthError() {
		return this.status === 401 || this.status === 403;
	}
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
				const message = sanitizeError(error.message);
				toast.error(message, {
					description: "An error occurred",
					duration: 5000,
					action: {
						label: "Retry",
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
		const errorText = await response.text();
		let message = errorText;
		try {
			const error = JSON.parse(errorText);
			message = error.error ?? error.message ?? errorText;
		} catch {
			// Not JSON, use raw text
		}
		throw new ApiError(message, response.status);
	}

	if (
		response.status === 204 ||
		response.headers.get("content-length") === "0"
	) {
		return undefined as T;
	}

	return response.json();
}
