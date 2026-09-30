import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

if (process.env.CF_WORKER === "1") {
	// Production secrets come from Wrangler bindings.
} else if (import.meta.url) {
	const currentDir = path.dirname(fileURLToPath(import.meta.url));
	const envCandidates = [
		path.resolve(process.cwd(), ".env"),
		path.resolve(process.cwd(), "apps/api/.env"),
		path.resolve(currentDir, "../../../../apps/api/.env"),
	];

	for (const envPath of envCandidates) {
		if (!existsSync(envPath)) {
			continue;
		}

		dotenv.config({ path: envPath });
		break;
	}
}
