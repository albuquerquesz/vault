import { serve } from "@hono/node-server";
import { createApp } from "./hono/app.js";

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

serve({ fetch: app.fetch, port }, () => {
	console.log("Server running on port", port);
});
