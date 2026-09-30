/// <reference types="@cloudflare/workers-types" />

const DEFAULT_VAULT_API_ORIGIN = "https://vault-api.albqvictor.workers.dev";

export const onRequest: PagesFunction<{ VAULT_API_ORIGIN?: string }> = async (
	context,
) => {
	const origin = (
		context.env.VAULT_API_ORIGIN ?? DEFAULT_VAULT_API_ORIGIN
	).replace(/\/$/, "");
	const url = new URL(context.request.url);
	const target = `${origin}${url.pathname}${url.search}`;
	return fetch(new Request(target, context.request));
};
