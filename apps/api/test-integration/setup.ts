/**
 * Preload for `bun run test:integration`: a throwaway Postgres (PGlite) with the
 * real migrations applied, served on a local port, and the env the app needs.
 *
 * It runs before any test file imports the app, because `db/env.ts` and
 * `db/index.ts` read their settings once, at import. DATABASE_URL is always
 * overwritten here, so these tests can never reach a real database.
 */
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const migrationsDir = new URL("../src/db/migrations/", import.meta.url).pathname;

async function freePort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const probe = createServer();
		probe.once("error", reject);
		probe.listen(0, "127.0.0.1", () => {
			const address = probe.address();
			const port = typeof address === "object" && address ? address.port : 0;
			probe.close(() => resolve(port));
		});
	});
}

const database = new PGlite();
const journal = JSON.parse(
	readFileSync(`${migrationsDir}meta/_journal.json`, "utf8"),
) as { entries: { tag: string }[] };

for (const entry of journal.entries) {
	const sql = readFileSync(`${migrationsDir}${entry.tag}.sql`, "utf8");
	for (const statement of sql.split("--> statement-breakpoint")) {
		const text = statement.trim();
		if (text) await database.exec(text);
	}
}

const port = await freePort();
const server = new PGLiteSocketServer({
	db: database,
	port,
	host: "127.0.0.1",
	// The app opens several connections at once; queries are queued.
	maxConnections: 20,
});
await server.start();

Object.assign(process.env, {
	DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`,
	// Development mode with localhost URLs turns on the dev login bypass.
	NODE_ENV: "development",
	BETTER_AUTH_SECRET: "integration-test-secret-0123456789abcdef",
	BETTER_AUTH_URL: "http://localhost:3000",
	CORS_ORIGIN: "http://localhost:5173",
	GOOGLE_CLIENT_ID: "integration-test",
	GOOGLE_CLIENT_SECRET: "integration-test",
});

process.on("exit", () => {
	void server.stop();
});
