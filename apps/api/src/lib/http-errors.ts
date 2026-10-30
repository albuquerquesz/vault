import { z } from "zod";

/** Stable error codes returned to clients as `{ error, code }`. */
export type ErrorCode =
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "VALIDATION_ERROR"
	| "NOT_FOUND"
	| "RATE_LIMITED"
	| "SERVICE_UNAVAILABLE"
	| "PLUGGY_CREDENTIALS_MISSING"
	| "PLUGGY_INVALID_CREDENTIALS"
	| "PLUGGY_API_ERROR"
	| "DATABASE_ERROR"
	| "INTERNAL_ERROR";

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
	UNAUTHORIZED: "Sua sessão expirou. Faça login novamente.",
	FORBIDDEN: "Acesso negado.",
	VALIDATION_ERROR: "Dados inválidos.",
	NOT_FOUND: "Recurso não encontrado.",
	RATE_LIMITED: "Muitas tentativas. Aguarde um pouco e tente novamente.",
	SERVICE_UNAVAILABLE: "Serviço indisponível no momento. Tente novamente.",
	PLUGGY_CREDENTIALS_MISSING:
		"Configure suas credenciais Pluggy (Client ID e Client Secret) nas configurações.",
	PLUGGY_INVALID_CREDENTIALS:
		"Credenciais Pluggy inválidas. Confira o Client ID e o Client Secret.",
	PLUGGY_API_ERROR: "A Pluggy não respondeu como esperado. Tente novamente.",
	DATABASE_ERROR:
		"Não foi possível salvar ou carregar os dados. Tente novamente em instantes.",
	INTERNAL_ERROR: "Erro inesperado no servidor. Tente novamente em instantes.",
};

export type ErrorBody = { error: string; code: ErrorCode };

export class AppError extends Error {
	code: ErrorCode;
	statusCode: number;

	constructor(
		code: ErrorCode,
		statusCode: number,
		message = DEFAULT_MESSAGES[code],
		options?: { cause?: unknown },
	) {
		super(message, options);
		this.name = "AppError";
		this.code = code;
		this.statusCode = statusCode;
	}
}

export function errorBody(code: ErrorCode, message?: string): ErrorBody {
	return { error: message ?? DEFAULT_MESSAGES[code], code };
}

type ErrorLike = {
	name?: string;
	message?: string;
	statusCode?: number;
	cause?: unknown;
};

function isDatabaseError(error: unknown): boolean {
	let current: unknown = error;
	for (let depth = 0; current && depth < 5; depth++) {
		const name = (current as ErrorLike).name ?? "";
		if (/DrizzleQueryError|NeonDbError|DatabaseError/.test(name)) return true;
		current = (current as ErrorLike).cause;
	}
	return false;
}

function zodMessage(error: z.ZodError): string {
	const issue = error.issues[0];
	if (!issue) return DEFAULT_MESSAGES.VALIDATION_ERROR;
	const path = issue.path.join(".");
	return path ? `Dados inválidos (${path}): ${issue.message}` : issue.message;
}

/**
 * Maps any thrown value to an HTTP status + `{ error, code }` body.
 * Known domain errors keep their message; unknown ones get a safe generic text.
 */
export function toErrorResponse(error: unknown): {
	status: number;
	body: ErrorBody;
} {
	if (error instanceof AppError) {
		return {
			status: error.statusCode,
			body: errorBody(error.code, error.message),
		};
	}
	if (error instanceof z.ZodError) {
		return {
			status: 400,
			body: errorBody("VALIDATION_ERROR", zodMessage(error)),
		};
	}

	const known = error as ErrorLike;
	switch (known?.name) {
		case "MissingPluggyCredentialsError":
			return {
				status: known.statusCode ?? 400,
				body: errorBody("PLUGGY_CREDENTIALS_MISSING", known.message),
			};
		case "PluggyAuthError":
			// Never 401: the web app treats 401 as an expired Vault session.
			return {
				status:
					known.statusCode && known.statusCode !== 401 ? known.statusCode : 400,
				body: errorBody("PLUGGY_INVALID_CREDENTIALS", known.message),
			};
		case "PluggyApiError":
			return {
				status: known.statusCode ?? 502,
				body: errorBody("PLUGGY_API_ERROR", known.message),
			};
	}

	if (known?.statusCode === 401) {
		return { status: 401, body: errorBody("UNAUTHORIZED") };
	}
	if (isDatabaseError(error)) {
		return { status: 500, body: errorBody("DATABASE_ERROR") };
	}
	return { status: 500, body: errorBody("INTERNAL_ERROR") };
}

/**
 * One-line description of an error and its causes for logs.
 * Drops Drizzle's `params:` section so row values never reach the logs.
 */
export function describeError(error: unknown): string {
	const parts: string[] = [];
	let current: unknown = error;
	for (let depth = 0; current && depth < 5; depth++) {
		const e = current as ErrorLike & { code?: string; detail?: string };
		const message = String(e.message ?? current)
			.split("\nparams:")[0]
			?.replace(/\s+/g, " ")
			.slice(0, 400);
		const extra = [e.code && `code=${e.code}`, e.detail && `detail=${e.detail}`]
			.filter(Boolean)
			.join(" ");
		parts.push(`${e.name ?? "Error"}: ${message}${extra ? ` (${extra})` : ""}`);
		current = e.cause;
	}
	return parts.join(" <- ");
}

type ReplyLike = {
	status: (code: number) => { send: (body: unknown) => unknown };
};

/**
 * Sends expected (4xx/5xx domain) errors directly; rethrows unexpected ones
 * so the route runner logs them and answers with INTERNAL/DATABASE_ERROR.
 */
export function sendKnownError(reply: ReplyLike, error: unknown) {
	const { status, body } = toErrorResponse(error);
	if (body.code === "INTERNAL_ERROR" || body.code === "DATABASE_ERROR") {
		throw error;
	}
	if (body.code.startsWith("PLUGGY_")) {
		console.warn(`[${body.code}] ${describeError(error)}`);
	}
	return reply.status(status).send(body);
}
