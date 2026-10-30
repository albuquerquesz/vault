/// <reference types="@cloudflare/workers-types" />

const DEFAULT_VAULT_API_ORIGIN = "https://vault-api.albuquerquesz.com";

export const onRequest: PagesFunction<{ VAULT_API_ORIGIN?: string }> = async (
	context,
) => {
	const origin = (
		context.env.VAULT_API_ORIGIN ?? DEFAULT_VAULT_API_ORIGIN
	).replace(/\/$/, "");
	const url = new URL(context.request.url);
	const target = `${origin}${url.pathname}${url.search}`;
	const request = new Request(target, context.request);
	// Keep the public host so auth callbacks and cookies stay on the web domain.
	request.headers.set("x-forwarded-host", url.host);
	request.headers.set("x-forwarded-proto", url.protocol.replace(/:$/, ""));
	return fetch(request);
};
