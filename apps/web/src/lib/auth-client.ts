import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	basePath: "/api/auth",
	// Carries the signed OAuth query from /login and /oauth/consent so sign-in
	// and consent resume an MCP client's authorization flow.
	plugins: [oauthProviderClient()],
});
