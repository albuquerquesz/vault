import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { PluggyApiError, PluggyAuthError } from "../clients/pluggy/client.js";
import { MissingPluggyCredentialsError } from "../services/connectors/credentials.js";
import { AppError, describeError, toErrorResponse } from "./http-errors.js";

describe("toErrorResponse", () => {
	it("keeps AppError code, status and message", () => {
		expect(
			toErrorResponse(new AppError("NOT_FOUND", 404, "Meta não encontrada.")),
		).toEqual({
			status: 404,
			body: { error: "Meta não encontrada.", code: "NOT_FOUND" },
		});
	});

	it("maps zod errors to VALIDATION_ERROR with the first issue", () => {
		const parsed = z.object({ clientId: z.string().min(1) }).safeParse({
			clientId: "",
		});
		const { status, body } = toErrorResponse(parsed.error);
		expect(status).toBe(400);
		expect(body.code).toBe("VALIDATION_ERROR");
		expect(body.error).toContain("clientId");
	});

	it("maps Pluggy errors to their codes without returning 401", () => {
		expect(
			toErrorResponse(
				new PluggyAuthError("Credenciais Pluggy inválidas (401)"),
			),
		).toEqual({
			status: 400,
			body: {
				error: "Credenciais Pluggy inválidas (401)",
				code: "PLUGGY_INVALID_CREDENTIALS",
			},
		});
		expect(
			toErrorResponse(new PluggyApiError("Pluggy fora", 502, "")).body.code,
		).toBe("PLUGGY_API_ERROR");
		expect(toErrorResponse(new MissingPluggyCredentialsError()).body.code).toBe(
			"PLUGGY_CREDENTIALS_MISSING",
		);
	});

	it("maps session errors to UNAUTHORIZED", () => {
		const error = Object.assign(new Error("no session"), { statusCode: 401 });
		expect(toErrorResponse(error)).toEqual({
			status: 401,
			body: {
				error: "Sua sessão expirou. Faça login novamente.",
				code: "UNAUTHORIZED",
			},
		});
	});

	it("maps database failures to DATABASE_ERROR and hides details", () => {
		const cause = Object.assign(new Error("too many subrequests"), {
			name: "NeonDbError",
		});
		const error = Object.assign(new Error("Failed query: insert ..."), {
			name: "DrizzleQueryError",
			cause,
		});
		const { status, body } = toErrorResponse(error);
		expect(status).toBe(500);
		expect(body.code).toBe("DATABASE_ERROR");
		expect(body.error).not.toContain("subrequests");
	});

	it("falls back to INTERNAL_ERROR", () => {
		expect(toErrorResponse(new Error("boom")).body.code).toBe("INTERNAL_ERROR");
	});
});

describe("describeError", () => {
	it("includes the cause chain and drops query params", () => {
		const cause = Object.assign(new Error("duplicate key"), {
			name: "NeonDbError",
			code: "23505",
		});
		const error = Object.assign(
			new Error('Failed query: insert into "x"\nparams: secret-value'),
			{ name: "DrizzleQueryError", cause },
		);
		const text = describeError(error);
		expect(text).toContain('DrizzleQueryError: Failed query: insert into "x"');
		expect(text).toContain("NeonDbError: duplicate key (code=23505)");
		expect(text).not.toContain("secret-value");
	});
});
