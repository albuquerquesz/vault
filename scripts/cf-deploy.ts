import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

const root = path.resolve(import.meta.dir, "..");
const apiDir = path.join(root, "apps/api");
const webDir = path.join(root, "apps/web");

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

function loadApiSecrets(webOrigin: string) {
	const fromEnv = parseEnvFile(path.join(apiDir, ".env"));
	const databaseUrl =
		process.env.DATABASE_URL?.trim() || fromEnv.DATABASE_URL?.trim();
	if (!databaseUrl) {
		console.error(
			"DATABASE_URL missing. Export NEON URL or set apps/api/.env before deploy.",
		);
		process.exit(1);
	}

	const secrets: Record<string, string> = {
		DATABASE_URL: databaseUrl,
		POSTGRES_DB: fromEnv.POSTGRES_DB ?? "vault",
		POSTGRES_HOST: fromEnv.POSTGRES_HOST ?? "localhost",
		POSTGRES_PASSWORD: fromEnv.POSTGRES_PASSWORD ?? "password",
		POSTGRES_PORT: fromEnv.POSTGRES_PORT ?? "5433",
		POSTGRES_USER: fromEnv.POSTGRES_USER ?? "postgres",
		BETTER_AUTH_SECRET: fromEnv.BETTER_AUTH_SECRET ?? "",
		BETTER_AUTH_URL: webOrigin,
		CORS_ORIGIN: webOrigin,
		GOOGLE_CLIENT_ID: fromEnv.GOOGLE_CLIENT_ID ?? "",
		GOOGLE_CLIENT_SECRET: fromEnv.GOOGLE_CLIENT_SECRET ?? "",
		NODE_ENV: "production",
		CF_WORKER: "1",
	};

	for (const [key, value] of Object.entries(fromEnv)) {
		if (
			value &&
			![
				"DATABASE_URL",
				"BETTER_AUTH_URL",
				"CORS_ORIGIN",
				"NODE_ENV",
				"VERCEL_OIDC_TOKEN",
			].includes(key) &&
			!(key in secrets)
		) {
			secrets[key] = value;
		}
	}

	return secrets;
}

function writeSecretsFile(secrets: Record<string, string>) {
	const secretsPath = path.join(apiDir, ".cf-secrets.json");
	writeFileSync(secretsPath, `${JSON.stringify(secrets, null, 2)}\n`);
	return secretsPath;
}

function writeSpaRedirects() {
	const publicDir = path.join(webDir, "public");
	mkdirSync(publicDir, { recursive: true });
	// External API proxy is handled by functions/api/[[path]].ts — Pages _redirects
	// only supports relative 200 rewrites, not workers.dev origins.
	writeFileSync(
		path.join(publicDir, "_redirects"),
		"/* /index.html 200\n",
	);
}

function writeApiProxyDefault(apiOrigin: string) {
	const fnPath = path.join(webDir, "functions/api/[[path]].ts");
	const base = apiOrigin.replace(/\/$/, "");
	const source = `/// <reference types="@cloudflare/workers-types" />

const DEFAULT_VAULT_API_ORIGIN = "${base}";

export const onRequest: PagesFunction<{ VAULT_API_ORIGIN?: string }> = async (
\tcontext,
) => {
\tconst origin = (
\t\tcontext.env.VAULT_API_ORIGIN ?? DEFAULT_VAULT_API_ORIGIN
\t).replace(/\\/$/, "");
\tconst url = new URL(context.request.url);
\tconst target = \`\${origin}\${url.pathname}\${url.search}\`;
\treturn fetch(new Request(target, context.request));
};
`;
	writeFileSync(fnPath, source);
}

function extractWorkerUrl(output: string) {
	const match =
		output.match(/https:\/\/[\w-]+\.[\w.-]+\.workers\.dev/i) ??
		output.match(/https:\/\/vault-api\.[\w.-]+\.workers\.dev/i);
	return match?.[0] ?? "https://vault-api.albqvictor.workers.dev";
}

async function main() {
	const webOrigin =
		process.env.VAULT_WEB_ORIGIN?.replace(/\/$/, "") ??
		"https://vault-web-1ze.pages.dev";

	const secrets = loadApiSecrets(webOrigin);
	const secretsPath = writeSecretsFile(secrets);

	console.log("Deploying vault-api worker…");
	const deployLog = Bun.spawnSync(
		[
			"bunx",
			"wrangler",
			"deploy",
			"--secrets-file",
			secretsPath,
			"--var",
			"CF_WORKER:1",
		],
		{
			cwd: apiDir,
			stdout: "pipe",
			stderr: "pipe",
			env: process.env,
		},
	);
	if (deployLog.exitCode !== 0) {
		process.stderr.write(deployLog.stderr);
		process.stdout.write(deployLog.stdout);
		process.exit(deployLog.exitCode ?? 1);
	}
	const deployOutput = `${deployLog.stdout.toString()}\n${deployLog.stderr.toString()}`;
	process.stdout.write(deployOutput);
	const apiOrigin = extractWorkerUrl(deployOutput);

	writeSpaRedirects();
	writeApiProxyDefault(apiOrigin);
	console.log(`Building web (API proxy → ${apiOrigin})…`);
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

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
