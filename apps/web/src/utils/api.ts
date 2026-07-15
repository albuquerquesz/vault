import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { env } from "@/common/env";

const SANITIZED_ERROR = "Something went wrong. Please try again.";

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
	const url = `${env.VITE_SERVER_URL}${path}`;
	const hasBody = options?.body !== undefined;

	const response = await fetch(url, {
		method: options?.method ?? "GET",
		headers: hasBody ? { "Content-Type": "application/json" } : undefined,
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
		throw new Error(message);
	}

	if (
		response.status === 204 ||
		response.headers.get("content-length") === "0"
	) {
		return undefined as T;
	}

	return response.json();
}
