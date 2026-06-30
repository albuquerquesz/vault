"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@vault/ui/components/card";

type TrafficSourceDatum = {
	label: string;
	value: number;
};

type TrafficSourcesCardProps = {
	title?: string;
	periodLabel?: string;
	data?: readonly TrafficSourceDatum[];
};

const DEFAULT_DATA = [
	{ label: "Organic search", value: 4100 },
	{ label: "Direct", value: 2900 },
	{ label: "Referral", value: 1600 },
	{ label: "Paid social", value: 980 },
	{ label: "Email", value: 620 },
] as const satisfies readonly TrafficSourceDatum[];

const SWATCH_CLASSES = [
	"bg-foreground/92",
	"bg-foreground/76",
	"bg-foreground/58",
	"bg-foreground/40",
	"bg-foreground/24",
] as const;

function formatCompactNumber(value: number, locale = "en-US") {
	return new Intl.NumberFormat(locale, {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value);
}

export function TrafficSourcesCard({
	title = "Traffic sources",
	periodLabel = "12 months",
	data = DEFAULT_DATA,
}: TrafficSourcesCardProps) {
	return (
		<Card className="financial-panel-border h-full min-h-[32rem] ring-0">
			<CardHeader className="gap-6">
				<div className="flex items-start justify-between gap-4">
					<CardDescription className="text-base">{title}</CardDescription>
					<span className="text-sm text-muted-foreground">{periodLabel}</span>
				</div>
			</CardHeader>

			<CardContent className="flex h-full flex-col">
				<div className="flex h-full flex-col justify-between gap-8">
					<div className="space-y-6">
						{data.map((item) => (
							<div
								key={item.label}
								className="flex items-center justify-between gap-4"
							>
								<span className="text-[1.15rem] font-medium tracking-tight text-foreground md:text-[1.3rem]">
									{item.label}
								</span>
								<span className="font-['Space_Grotesk'] text-[1.1rem] text-muted-foreground md:text-[1.25rem]">
									{formatCompactNumber(item.value)}
								</span>
							</div>
						))}
					</div>

					<div className="flex flex-wrap gap-2 pt-2">
						{data.map((item, index) => (
							<span
								key={item.label}
								aria-label={`Indicador visual de ${item.label}`}
								className={`h-3 w-3 rounded-[2px] ${SWATCH_CLASSES[index % SWATCH_CLASSES.length]}`}
								role="img"
							/>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
