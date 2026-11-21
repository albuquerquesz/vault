export type ChartType = "donut" | "bar" | "line";

export type ChartPoint = {
	label: string;
	value: number;
	/** Present when a chart draws more than one series (income and spending). */
	series?: string;
};

export type Chart = {
	type: ChartType;
	title: string;
	data: ChartPoint[];
	/** A Vega-Lite 5 spec for clients that render it. */
	vegaLite: Record<string, unknown>;
	/** The same chart drawn as a standalone SVG, ready to paste in a page. */
	svg: string;
};

const PALETTE = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6", "#f97316", "#64748b", "#eab308"];
const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const round2 = (value: number) => Math.round(value * 100) / 100;

export function formatBRL(value: number): string {
	return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatCompactBRL(value: number): string {
	return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** `2026-11` as "nov/2026". */
export function monthLabel(month: string): string {
	const [year, mon] = month.split("-");
	return `${MONTHS_PT[Number(mon) - 1] ?? mon}/${year}`;
}

/** The biggest points stay; the rest are summed into one "Outras". */
export function groupSmall(points: ChartPoint[], max = 8, otherLabel = "Outras"): ChartPoint[] {
	const sorted = [...points].sort((a, b) => b.value - a.value);
	if (sorted.length <= max) return sorted;
	const kept = sorted.slice(0, max - 1);
	const rest = sorted.slice(max - 1).reduce((sum, point) => sum + point.value, 0);
	return [...kept, { label: otherLabel, value: round2(rest) }];
}

function escapeXml(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** A round upper bound for an axis, and its step. */
function niceScale(max: number, ticks = 4): { top: number; step: number } {
	if (max <= 0) return { top: 1, step: 1 / ticks };
	const rough = max / ticks;
	const magnitude = 10 ** Math.floor(Math.log10(rough));
	const normalized = rough / magnitude;
	const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
	const step = factor * magnitude;
	return { top: step * ticks, step };
}

export function toVegaLite(type: ChartType, title: string, data: ChartPoint[]): Record<string, unknown> {
	const base = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		title,
		width: 520,
		height: 300,
		data: { values: data },
	};
	const hasSeries = data.some((point) => point.series !== undefined);
	if (type === "donut") {
		return {
			...base,
			mark: { type: "arc", innerRadius: 70 },
			encoding: {
				theta: { field: "value", type: "quantitative" },
				color: { field: "label", type: "nominal", title: null },
			},
		};
	}
	if (type === "line") {
		return {
			...base,
			mark: { type: "line", point: true },
			encoding: {
				x: { field: "label", type: "nominal", sort: null, title: null },
				y: { field: "value", type: "quantitative", title: "R$" },
			},
		};
	}
	return {
		...base,
		mark: "bar",
		encoding: {
			x: { field: "label", type: "nominal", sort: null, title: null },
			y: { field: "value", type: "quantitative", title: "R$" },
			...(hasSeries ? { color: { field: "series", type: "nominal", title: null }, xOffset: { field: "series" } } : {}),
		},
	};
}

const W = 640;
const H = 360;

function frame(title: string, body: string): string {
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeXml(title)}" font-family="system-ui, sans-serif">`,
		`<rect width="${W}" height="${H}" rx="12" fill="#ffffff" stroke="#e5e7eb"/>`,
		`<text x="24" y="34" font-size="18" font-weight="700" fill="#111827">${escapeXml(title)}</text>`,
		body,
		"</svg>",
	].join("");
}

const empty = (title: string) => frame(title, `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="16" fill="#6b7280">Sem dados no período</text>`);

function arcPath(cx: number, cy: number, outer: number, inner: number, from: number, to: number): string {
	const point = (radius: number, angle: number) => `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`;
	const large = to - from > Math.PI ? 1 : 0;
	return `M ${point(outer, from)} A ${outer} ${outer} 0 ${large} 1 ${point(outer, to)} L ${point(inner, to)} A ${inner} ${inner} 0 ${large} 0 ${point(inner, from)} Z`;
}

function renderDonut(title: string, data: ChartPoint[]): string {
	const total = data.reduce((sum, point) => sum + point.value, 0);
	if (total <= 0) return empty(title);
	const cx = 170;
	const cy = 205;
	const outer = 120;
	const inner = 68;
	let angle = -Math.PI / 2;
	const slices = data.map((point, index) => {
		const color = PALETTE[index % PALETTE.length] ?? "#64748b";
		const sweep = (point.value / total) * Math.PI * 2;
		const from = angle;
		angle += sweep;
		if (data.length === 1) {
			return `<circle cx="${cx}" cy="${cy}" r="${(outer + inner) / 2}" fill="none" stroke="${color}" stroke-width="${outer - inner}"/>`;
		}
		return `<path d="${arcPath(cx, cy, outer, inner, from, angle - 0.004)}" fill="${color}"/>`;
	});
	const legend = data.map((point, index) => {
		const y = 78 + index * 30;
		const color = PALETTE[index % PALETTE.length] ?? "#64748b";
		const percent = ((point.value / total) * 100).toFixed(1).replace(".", ",");
		return [
			`<rect x="330" y="${y - 12}" width="14" height="14" rx="3" fill="${color}"/>`,
			`<text x="352" y="${y}" font-size="13" fill="#111827">${escapeXml(truncate(point.label, 20))}</text>`,
			`<text x="${W - 24}" y="${y}" font-size="13" text-anchor="end" fill="#374151">${escapeXml(formatBRL(point.value))} · ${percent}%</text>`,
		].join("");
	});
	const center = [
		`<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="12" fill="#6b7280">Total</text>`,
		`<text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="18" font-weight="700" fill="#111827">${escapeXml(formatBRL(total))}</text>`,
	];
	return frame(title, [...slices, ...legend, ...center].join(""));
}

function axes(maxValue: number, left: number, right: number, top: number, bottom: number) {
	const { top: scaleTop, step } = niceScale(maxValue);
	const plotH = bottom - top;
	const y = (value: number) => bottom - (value / scaleTop) * plotH;
	const grid: string[] = [];
	for (let tick = 0; tick <= 4; tick += 1) {
		const value = step * tick;
		const yy = y(value);
		grid.push(
			`<line x1="${left}" y1="${yy.toFixed(1)}" x2="${right}" y2="${yy.toFixed(1)}" stroke="#e5e7eb"/>`,
			`<text x="${left - 8}" y="${(yy + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6b7280">${escapeXml(formatCompactBRL(value))}</text>`,
		);
	}
	return { y, grid: grid.join("") };
}

function renderBars(title: string, data: ChartPoint[]): string {
	if (data.length === 0 || data.every((point) => point.value === 0)) return empty(title);
	const labels = [...new Set(data.map((point) => point.label))];
	const series = [...new Set(data.map((point) => point.series ?? ""))];
	const left = 72;
	const right = W - 24;
	const top = 56;
	const bottom = H - 56;
	const { y, grid } = axes(Math.max(...data.map((point) => point.value)), left, right, top, bottom);
	const groupW = (right - left) / labels.length;
	const barW = Math.min(46, (groupW * 0.7) / series.length);
	const bars = data.map((point) => {
		const group = labels.indexOf(point.label);
		const index = series.indexOf(point.series ?? "");
		const x = left + group * groupW + (groupW - barW * series.length) / 2 + index * barW;
		const yy = y(Math.max(point.value, 0));
		return `<rect x="${x.toFixed(1)}" y="${yy.toFixed(1)}" width="${(barW - 2).toFixed(1)}" height="${Math.max(bottom - yy, 0).toFixed(1)}" rx="3" fill="${PALETTE[index % PALETTE.length]}"><title>${escapeXml(`${point.label}${point.series ? ` · ${point.series}` : ""}: ${formatBRL(point.value)}`)}</title></rect>`;
	});
	const xLabels = labels.map((label, group) => `<text x="${(left + group * groupW + groupW / 2).toFixed(1)}" y="${bottom + 20}" text-anchor="middle" font-size="12" fill="#374151">${escapeXml(truncate(label, 10))}</text>`);
	const legend =
		series.length > 1 || series[0] !== ""
			? series.map((name, index) => `<rect x="${W - 150 + index * 80}" y="20" width="12" height="12" rx="3" fill="${PALETTE[index % PALETTE.length]}"/><text x="${W - 134 + index * 80}" y="31" font-size="12" fill="#374151">${escapeXml(name)}</text>`).join("")
			: "";
	return frame(title, [grid, ...bars, ...xLabels, legend].join(""));
}

function renderLine(title: string, data: ChartPoint[]): string {
	if (data.length === 0 || data.every((point) => point.value === 0)) return empty(title);
	const left = 72;
	const right = W - 24;
	const top = 56;
	const bottom = H - 56;
	const { y, grid } = axes(Math.max(...data.map((point) => point.value)), left, right, top, bottom);
	const xAt = (index: number) => (data.length === 1 ? (left + right) / 2 : left + (index / (data.length - 1)) * (right - left));
	const points = data.map((point, index) => `${xAt(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
	const dots = data.map((point, index) => `<circle cx="${xAt(index).toFixed(1)}" cy="${y(point.value).toFixed(1)}" r="3" fill="#3b82f6"><title>${escapeXml(`${point.label}: ${formatBRL(point.value)}`)}</title></circle>`);
	const every = Math.max(1, Math.ceil(data.length / 8));
	const xLabels = data.map((point, index) => (index % every === 0 ? `<text x="${xAt(index).toFixed(1)}" y="${bottom + 20}" text-anchor="middle" font-size="12" fill="#374151">${escapeXml(truncate(point.label, 10))}</text>` : ""));
	return frame(title, [grid, `<polyline points="${points}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round"/>`, ...dots, ...xLabels].join(""));
}

export function renderSvg(type: ChartType, title: string, data: ChartPoint[]): string {
	if (type === "donut") return renderDonut(title, data);
	if (type === "line") return renderLine(title, data);
	return renderBars(title, data);
}

export function buildChart(params: { type: ChartType; title: string; data: ChartPoint[] }): Chart {
	const { type, title } = params;
	const data = params.data.map((point) => ({ ...point, value: round2(point.value) }));
	return { type, title, data, vegaLite: toVegaLite(type, title, data), svg: renderSvg(type, title, data) };
}
