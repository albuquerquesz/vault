import { describe, expect, test } from "bun:test";
import { buildChart, formatBRL, groupSmall, monthLabel, renderSvg, toVegaLite } from "./charts.js";

describe("monthLabel and formatBRL", () => {
	test("write the month in portuguese and money in reais", () => {
		expect(monthLabel("2026-11")).toBe("nov/2026");
		expect(monthLabel("2027-01")).toBe("jan/2027");
		expect(formatBRL(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
	});
});

describe("groupSmall", () => {
	const points = Array.from({ length: 10 }, (_, i) => ({ label: `c${i}`, value: 100 - i * 10 }));

	test("keeps the biggest and sums the rest into Outras", () => {
		const grouped = groupSmall(points, 4);
		expect(grouped.map((p) => p.label)).toEqual(["c0", "c1", "c2", "Outras"]);
		// c3..c9 = 70+60+50+40+30+20+10
		expect(grouped[3]?.value).toBe(280);
	});

	test("leaves a short list alone, ordered from the biggest", () => {
		expect(groupSmall([{ label: "a", value: 1 }, { label: "b", value: 5 }], 8).map((p) => p.label)).toEqual(["b", "a"]);
	});
});

describe("toVegaLite", () => {
	const data = [{ label: "nov/2026", series: "Receita", value: 100 }, { label: "nov/2026", series: "Gasto", value: 80 }];

	test("each type picks its mark and carries the data", () => {
		expect((toVegaLite("donut", "t", data).mark as { type: string }).type).toBe("arc");
		expect((toVegaLite("line", "t", data).mark as { type: string }).type).toBe("line");
		expect(toVegaLite("bar", "t", data).mark).toBe("bar");
		expect((toVegaLite("bar", "t", data).data as { values: unknown[] }).values).toHaveLength(2);
	});

	test("a bar chart with series groups them by color", () => {
		const encoding = toVegaLite("bar", "t", data).encoding as Record<string, unknown>;
		expect(encoding.color).toBeDefined();
		expect(encoding.xOffset).toBeDefined();
		expect((toVegaLite("bar", "t", [{ label: "a", value: 1 }]).encoding as Record<string, unknown>).color).toBeUndefined();
	});
});

describe("renderSvg", () => {
	test("a donut lists every slice with its value and share", () => {
		const svg = renderSvg("donut", "Gastos por categoria", [{ label: "Mercado", value: 750 }, { label: "Lazer", value: 250 }]);
		expect(svg.startsWith("<svg")).toBe(true);
		expect(svg).toContain("Gastos por categoria");
		expect(svg).toContain("Mercado");
		expect(svg).toContain("75,0%");
		expect(svg).toContain("25,0%");
	});

	test("one slice draws a full ring instead of a broken arc", () => {
		const svg = renderSvg("donut", "t", [{ label: "Só uma", value: 10 }]);
		expect(svg).toContain("<circle");
		expect(svg).not.toContain("<path");
	});

	test("bars and lines draw the points and their labels", () => {
		const bars = renderSvg("bar", "Resultado", [{ label: "out/2026", series: "Receita", value: 5000 }, { label: "out/2026", series: "Gasto", value: 4000 }]);
		expect(bars).toContain("out/2026");
		expect(bars).toContain("Receita");
		expect(bars.match(/<rect /g)?.length).toBeGreaterThanOrEqual(4);
		const line = renderSvg("line", "Gasto por dia", [{ label: "1", value: 10 }, { label: "2", value: 30 }]);
		expect(line).toContain("<polyline");
		expect(line.match(/<circle /g)).toHaveLength(2);
	});

	test("no data, or only zeros, says so", () => {
		for (const type of ["donut", "bar", "line"] as const) {
			expect(renderSvg(type, "t", [])).toContain("Sem dados no período");
			expect(renderSvg(type, "t", [{ label: "a", value: 0 }])).toContain("Sem dados no período");
		}
	});

	test("text from the data is escaped", () => {
		const svg = renderSvg("donut", "A & B <x>", [{ label: "Loja \"X\" <b>", value: 5 }, { label: "y", value: 5 }]);
		expect(svg).toContain("A &amp; B &lt;x&gt;");
		expect(svg).toContain("Loja &quot;X&quot; &lt;b&gt;");
		expect(svg).not.toContain("<b>");
	});
});

describe("buildChart", () => {
	test("rounds the values and returns the data, the Vega-Lite spec and the SVG together", () => {
		const chart = buildChart({ type: "bar", title: "t", data: [{ label: "a", value: 10.126 }] });
		expect(chart.data[0]?.value).toBe(10.13);
		expect(chart.vegaLite.title).toBe("t");
		expect(chart.svg).toContain("<svg");
	});
});
