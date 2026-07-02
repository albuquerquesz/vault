import { createAuthClient } from "better-auth/react";
import { google } from "better-auth/plugins";
import { env } from "@/common/env";

export const authClient = createAuthClient({
	baseURL: env.VITE_SERVER_URL,
	plugins: [google()],
});
