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
	const maxValue = Math.max(...data.map((item) => item.value), 1);

	return (
		<Card className="financial-panel-border h-full min-h-[32rem] ring-0">
			<CardHeader className="gap-6">
				<div className="flex items-start justify-between gap-4">
					<CardDescription className="text-base">{title}</CardDescription>
					<span className="text-sm text-muted-foreground">{periodLabel}</span>
				</div>
			</CardHeader>

			<CardContent className="flex h-full flex-col">
				<div className="space-y-6">
					{data.map((item) => {
						const width = `${(item.value / maxValue) * 100}%`;

						return (
							<div key={item.label} className="space-y-3">
								<div className="flex items-center justify-between gap-4">
									<span className="text-[1.65rem] font-medium tracking-tight text-foreground">
										{item.label}
									</span>
									<span className="font-['Space_Grotesk'] text-[1.6rem] text-muted-foreground">
										{formatCompactNumber(item.value)}
									</span>
								</div>

								<div className="flex items-center gap-1.5">
									<div
										className="h-2 rounded-full bg-white/92"
										style={{ width }}
									/>
									<div className="h-2 flex-1 rounded-full bg-white/14" />
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
