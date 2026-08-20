/**
 * Login viewport geometry check.
 *
 * Drives the real /login route in a headed-out Chromium session and asserts:
 * - primary content boxes sit inside the viewport
 * - desktop columns are side-by-side and fill viewport height
 * - no horizontal page overflow
 *
 * Usage:
 *   LOGIN_BASE_URL=http://localhost:3001 node apps/web/e2e/login-viewport.mjs
 *   bun run --cwd apps/web test:login-viewport
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.LOGIN_BASE_URL || "http://localhost:3001";
const OUT_DIR = process.env.LOGIN_VIEWPORT_OUT || path.join(__dirname, "../../../output/playwright");
const VIEWPORT = { width: 1280, height: 720 };
const HEIGHT_TOLERANCE_PX = 8;
const WIDTH_TOLERANCE_PX = 24;

function withinViewport(box, vp, pad = 1) {
	if (!box) return { ok: false, reason: "missing box" };
	const issues = [];
	if (box.x < -pad) issues.push(`x=${box.x}`);
	if (box.y < -pad) issues.push(`y=${box.y}`);
	if (box.x + box.width > vp.width + pad) {
		issues.push(`right=${box.x + box.width}>${vp.width}`);
	}
	if (box.y + box.height > vp.height + pad) {
		issues.push(`bottom=${box.y + box.height}>${vp.height}`);
	}
	return { ok: issues.length === 0, issues, box };
}

async function runOnce(runLabel) {
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		viewport: VIEWPORT,
		deviceScaleFactor: 1,
	});
	await context.clearCookies();
	const page = await context.newPage();
	await page.addInitScript(() => {
		try {
			localStorage.clear();
			sessionStorage.clear();
		} catch {
			/* ignore */
		}
	});

	const lines = [];
	const log = (s) => {
		lines.push(s);
		console.log(s);
	};

	log(`=== login viewport check run=${runLabel} ===`);
	log(`url=${BASE}/login viewport=${VIEWPORT.width}x${VIEWPORT.height}`);

	const resp = await page.goto(`${BASE}/login`, {
		waitUntil: "networkidle",
		timeout: 60_000,
	});
	log(`status=${resp?.status()} finalUrl=${page.url()}`);

	await page.getByTestId("login-page").waitFor({ state: "visible", timeout: 15_000 });
	await page.getByText("Continue with Google").waitFor({ state: "visible" });
	await page.getByText("Ready to join Vault?").waitFor({ state: "visible" });

	const metrics = await page.evaluate(() => {
		const doc = document.documentElement;
		const left = document.querySelector('[data-testid="login-auth-column"]');
		const right = document.querySelector('[data-testid="login-promo-column"]');
		const rect = (el) => {
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return {
				x: r.x,
				y: r.y,
				width: r.width,
				height: r.height,
				right: r.right,
				bottom: r.bottom,
			};
		};
		return {
			clientWidth: doc.clientWidth,
			clientHeight: doc.clientHeight,
			scrollWidth: doc.scrollWidth,
			scrollHeight: doc.scrollHeight,
			left: rect(left),
			right: rect(right),
			leftDisplay: left ? getComputedStyle(left).display : null,
			rightDisplay: right ? getComputedStyle(right).display : null,
		};
	});

	log(`metrics=${JSON.stringify(metrics)}`);

	const selectors = {
		logoText: page.getByText("login or create your account."),
		googleBtn: page.getByText("Continue with Google"),
		headline: page.getByText("Ready to join Vault?"),
		quote: page.getByText("Vault is why I still have hair"),
	};

	const failures = [];
	for (const [name, loc] of Object.entries(selectors)) {
		const visible = await loc.isVisible();
		const box = visible ? await loc.boundingBox() : null;
		const check = withinViewport(box, VIEWPORT);
		log(
			`${name}: visible=${visible} ok=${check.ok} box=${JSON.stringify(box)} issues=${JSON.stringify(check.issues || [])}`,
		);
		if (!visible || !check.ok) {
			failures.push(`${name} not fully in viewport`);
		}
	}

	const { left, right } = metrics;
	const sideBySide = Boolean(left && right && right.x >= left.x + left.width - 2);
	const leftFullH =
		Boolean(left) && Math.abs(left.height - VIEWPORT.height) <= HEIGHT_TOLERANCE_PX;
	const rightFullH =
		Boolean(right) && Math.abs(right.height - VIEWPORT.height) <= HEIGHT_TOLERANCE_PX;
	const half = VIEWPORT.width / 2;
	const leftHalf =
		Boolean(left) && Math.abs(left.width - half) <= WIDTH_TOLERANCE_PX;
	const rightHalf =
		Boolean(right) && Math.abs(right.width - half) <= WIDTH_TOLERANCE_PX;
	const noHScroll = metrics.scrollWidth <= metrics.clientWidth + 1;

	log(
		`sideBySide=${sideBySide} leftFullH=${leftFullH} rightFullH=${rightFullH} leftHalf=${leftHalf} rightHalf=${rightHalf} noHScroll=${noHScroll}`,
	);

	if (!sideBySide) failures.push("columns not side-by-side");
	if (!leftFullH) failures.push("left column height != viewport");
	if (!rightFullH) failures.push("right column height != viewport");
	if (!leftHalf) failures.push("left column width != ~half viewport");
	if (!rightHalf) failures.push("right column width != ~half viewport");
	if (!noHScroll) failures.push("horizontal overflow");

	fs.mkdirSync(OUT_DIR, { recursive: true });
	const shotPath = path.join(OUT_DIR, `login-viewport-${runLabel}.png`);
	await page.screenshot({ path: shotPath, fullPage: false });
	log(`screenshot=${shotPath}`);

	const ok = failures.length === 0;
	log(`PASS=${ok}${ok ? "" : ` failures=${JSON.stringify(failures)}`}`);

	await browser.close();
	return { ok, lines, failures };
}

async function main() {
	const runs = [];
	for (const label of ["1", "2"]) {
		runs.push(await runOnce(label));
	}

	const scratchLog = process.env.LOGIN_VIEWPORT_LOG;
	const combined = runs.flatMap((r) => r.lines.concat([""])).join("\n");
	if (scratchLog) {
		fs.mkdirSync(path.dirname(scratchLog), { recursive: true });
		fs.writeFileSync(scratchLog, combined);
	}
	fs.mkdirSync(OUT_DIR, { recursive: true });
	fs.writeFileSync(path.join(OUT_DIR, "login-viewport.log"), combined);

	const allOk = runs.every((r) => r.ok);
	if (!allOk) {
		console.error("Login viewport geometry checks failed");
		process.exit(2);
	}
	console.log("All login viewport geometry checks passed");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
