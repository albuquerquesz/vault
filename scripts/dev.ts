import { existsSync } from "node:fs";
import { copyFile, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "dotenv";

const root = path.resolve(import.meta.dir, "..");
const apiEnvPath = path.join(root, "apps/api/.env");
const apiEnvExamplePath = path.join(root, "apps/api/.env.example");

if (!existsSync(apiEnvPath)) {
	await copyFile(apiEnvExamplePath, apiEnvPath);
	console.log("Criado apps/api/.env a partir do exemplo.");
}

const apiEnv = parse(await readFile(apiEnvPath));
const missingGoogleCredentials = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"].filter(
	(key) => !process.env[key]?.trim() && !apiEnv[key]?.trim(),
);

if (missingGoogleCredentials.length > 0) {
	console.warn(
		`Google OAuth sem configuração: ${missingGoogleCredentials.join(", ")}. Preencha apps/api/.env para habilitar login.`,
	);
}

const compose = Bun.spawn(
	["docker", "compose", "up", "-d", "--wait", "postgres"],
	{
		cwd: root,
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	},
);

const composeExitCode = await compose.exited;
if (composeExitCode !== 0) {
	process.exitCode = composeExitCode;
	process.exit();
}

const turbo = Bun.spawn(
	[process.execPath, "x", "turbo", "--ui=stream", "dev"],
	{
		cwd: root,
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	},
);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.once(signal, () => turbo.kill(signal));
}

process.exitCode = await turbo.exited;
