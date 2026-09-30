export function toAuthResponse(response: Response): Response {
	const headers = new Headers();

	for (const [key, value] of response.headers) {
		if (key.toLowerCase() !== "set-cookie") {
			headers.set(key, value);
		}
	}

	const headersWithSetCookie = response.headers as Headers & {
		getSetCookie?: () => string[];
	};
	const setCookies = headersWithSetCookie.getSetCookie?.() ?? [];
	for (const cookie of setCookies) {
		headers.append("set-cookie", cookie);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

/** @deprecated Fastify reply adapter — tests only */
export function forwardAuthResponseHeaders(
	response: Response,
	reply: {
		header(name: string, value: string | string[]): unknown;
	},
) {
	for (const [key, value] of response.headers) {
		if (key.toLowerCase() !== "set-cookie") {
			reply.header(key, value);
		}
	}

	const headersWithSetCookie = response.headers as Headers & {
		getSetCookie?: () => string[];
	};
	const setCookies = headersWithSetCookie.getSetCookie?.() ?? [];

	if (setCookies.length > 0) {
		reply.header("set-cookie", setCookies);
	}
}
