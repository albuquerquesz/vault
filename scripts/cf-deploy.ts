import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

const root = path.resolve(import.meta.dir, "..");
const apiDir = path.join(root, "apps/api");
const webDir = path.join(root, "apps/web");
const prodEnvPath = path.join(apiDir, ".env.production");

const DEFAULT_WEB_ORIGIN = "https://vault.albuquerquesz.com";
const DEFAULT_API_ORIGIN = "https://vault-api.albuquerquesz.com";

const REQUIRED_SECRETS = [
	"DATABASE_URL",
	"BETTER_AUTH_SECRET",
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
];
const LOCAL_MARKERS = ["local-dev", "localhost", "127.0.0.1"];
const GOOGLE_CLIENT_ID_PATTERN =
	/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/;

function run(
	cmd: string[],
	cwd: string,
	env?: Record<string, string | undefined>,
) {
	const proc = Bun.spawnSync(cmd, {
		cwd,
		env: { ...process.env, ...env },
		stdout: "inherit",
		stderr: "inherit",
	});
	if (proc.exitCode !== 0) {
		process.exit(proc.exitCode ?? 1);
	}
}

function parseEnvFile(filePath: string) {
	if (!existsSync(filePath)) return {};
	return parse(readFileSync(filePath, "utf8")) as Record<string, string>;
}

// Prod secrets come only from apps/api/.env.production — never the local dev .env.
function loadApiSecrets(webOrigin: string) {
	if (!existsSync(prodEnvPath)) {
		console.error(
			`--sync-secrets needs ${path.relative(root, prodEnvPath)} with prod values.`,
		);
		process.exit(1);
	}
	const fromEnv = parseEnvFile(prodEnvPath);

	const secrets: Record<string, string> = {
		BETTER_AUTH_URL: webOrigin,
		CORS_ORIGIN: webOrigin,
		NODE_ENV: "production",
		CF_WORKER: "1",
	};

	for (const [key, value] of Object.entries(fromEnv)) {
		const trimmed = value?.trim();
		if (
			trimmed &&
			![
				"BETTER_AUTH_URL",
				"CORS_ORIGIN",
				"NODE_ENV",
				"VERCEL_OIDC_TOKEN",
			].includes(key) &&
			!(key in secrets)
		) {
			secrets[key] = trimmed;
		}
	}

	return secrets;
}

export function validateSecrets(secrets: Record<string, string>) {
	const errors: string[] = [];
	for (const key of REQUIRED_SECRETS) {
		if (!secrets[key]) errors.push(`${key} is missing`);
	}
	const clientId = secrets.GOOGLE_CLIENT_ID;
	if (clientId && !GOOGLE_CLIENT_ID_PATTERN.test(clientId)) {
		errors.push("GOOGLE_CLIENT_ID is not a valid Google OAuth client id");
	}
	for (const [key, value] of Object.entries(secrets)) {
		const marker = LOCAL_MARKERS.find((m) => value.includes(m));
		if (marker) errors.push(`${key} looks like a local value (${marker})`);
	}
	return errors;
}

function writeSpaRedirects() {
	const publicDir = path.join(webDir, "public");
	mkdirSync(publicDir, { recursive: true });
	// External API proxy is handled by functions/api/[[path]].ts — Pages _redirects
	// only supports relative 200 rewrites, not external origins.
	writeFileSync(path.join(publicDir, "_redirects"), "/* /index.html 200\n");
}

function deployApi(webOrigin: string, syncSecrets: boolean) {
	const cmd = ["bunx", "wrangler", "deploy", "--var", "CF_WORKER:1"];
	let secretsPath: string | undefined;

	if (syncSecrets) {
		const secrets = loadApiSecrets(webOrigin);
		const errors = validateSecrets(secrets);
		if (errors.length > 0) {
			console.error("Refusing to sync secrets:");
			for (const error of errors) console.error(`  - ${error}`);
			process.exit(1);
		}
		secretsPath = path.join(apiDir, ".cf-secrets.json");
		writeFileSync(secretsPath, `${JSON.stringify(secrets, null, 2)}\n`);
		cmd.push("--secrets-file", secretsPath);
	}

	console.log(
		syncSecrets
			? "Deploying vault-api worker (syncing secrets)…"
			: "Deploying vault-api worker (keeping existing secrets)…",
	);
	const proc = Bun.spawnSync(cmd, {
		cwd: apiDir,
		env: process.env,
		stdout: "inherit",
		stderr: "inherit",
	});
	// Never leave plaintext secrets on disk.
	if (secretsPath) rmSync(secretsPath, { force: true });
	if (proc.exitCode !== 0) {
		process.exit(proc.exitCode ?? 1);
	}
}

async function main() {
	const webOrigin = (
		process.env.VAULT_WEB_ORIGIN ?? DEFAULT_WEB_ORIGIN
	).replace(/\/$/, "");
	const apiOrigin = (
		process.env.VAULT_API_ORIGIN ?? DEFAULT_API_ORIGIN
	).replace(/\/$/, "");
	const syncSecrets = process.argv.includes("--sync-secrets");

	deployApi(webOrigin, syncSecrets);

	writeSpaRedirects();
	console.log("Building web…");
	run(["bun", "run", "build"], webDir);

	console.log("Deploying vault-web to Cloudflare Pages…");
	run(
		[
			"bunx",
			"wrangler",
			"pages",
			"deploy",
			"dist",
			"--project-name",
			"vault-web",
			"--commit-dirty=true",
		],
		webDir,
	);

	console.log(`Dashboard: ${webOrigin}`);
	console.log(`API worker: ${apiOrigin}`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
