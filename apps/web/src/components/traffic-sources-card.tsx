"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
} from "@vault/ui/components/card";
import { Clock3Icon } from "lucide-react";
import { cn } from "@vault/ui/lib/utils";
import { DashboardCardLinkButton } from "@/components/dashboard-card-link-button";

type TrafficSourceDatum = {
	label: string;
	value: number;
};

type TrafficSourcesCardProps = {
	title?: string;
	periodLabel?: string;
	data?: readonly TrafficSourceDatum[];
	detailHref?: string;
};

const DEFAULT_DATA = [
	{ label: "Organic search", value: 4100 },
	{ label: "Direct", value: 2900 },
	{ label: "Referral", value: 1600 },
	{ label: "Paid social", value: 980 },
] as const satisfies readonly TrafficSourceDatum[];

const FILLED_SEGMENT_CLASSES = [
	"bg-foreground/62",
	"bg-foreground/54",
	"bg-foreground/46",
	"bg-foreground/38",
	"bg-foreground/30",
] as const;
const TRACK_SEGMENT_CLASS = "bg-foreground/[0.10]";
const SEGMENT_COUNT = 28;

function formatCompactNumber(value: number, locale = "en-US") {
	return new Intl.NumberFormat(locale, {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value);
}

function SegmentedBar({
	filledSegments,
	filledClassName,
}: {
	filledSegments: number;
	filledClassName: string;
}) {
	return (
		<div
			className="grid gap-1"
			style={{ gridTemplateColumns: `repeat(${SEGMENT_COUNT}, minmax(0, 1fr))` }}
		>
			{Array.from({ length: SEGMENT_COUNT }, (_, index) => (
				<span
					key={`segment-${index}`}
					className={cn(
						"h-[4px] rounded-full",
						index < filledSegments ? filledClassName : TRACK_SEGMENT_CLASS,
					)}
				/>
			))}
		</div>
	);
}

export function TrafficSourcesCard({
	title = "Canais de origem",
	data = DEFAULT_DATA,
	detailHref,
}: TrafficSourcesCardProps) {
	const maxValue = Math.max(...data.map((item) => item.value), 1);

	return (
		<Card className="financial-panel-border h-full min-h-[22rem] ring-0">
			<CardHeader className="gap-5">
				<div className="flex items-start justify-between gap-4">
					<CardDescription className="flex items-center gap-2 text-base">
						<Clock3Icon className="size-3.5 text-muted-foreground" />
						<span>{title}</span>
					</CardDescription>
					{detailHref ? (
						<DashboardCardLinkButton
							label={`Abrir ${title}`}
							to={detailHref}
						/>
					) : null}
				</div>
			</CardHeader>

			<CardContent className="flex h-full flex-col">
				<div className="flex h-full flex-col gap-5">
					{data.map((item, index) => {
						const filledSegments = Math.max(
							2,
							Math.round((item.value / maxValue) * SEGMENT_COUNT),
						);

						return (
							<div key={item.label} className="space-y-2.5">
								<div className="flex items-baseline justify-between gap-4">
									<span className="text-[1.1rem] font-medium tracking-tight text-foreground md:text-[1.25rem]">
										{item.label}
									</span>
									<span className="font-['Space_Grotesk'] text-[1.05rem] text-muted-foreground md:text-[1.15rem]">
										{formatCompactNumber(item.value)}
									</span>
								</div>
								<SegmentedBar
									filledSegments={filledSegments}
									filledClassName={
										FILLED_SEGMENT_CLASSES[index % FILLED_SEGMENT_CLASSES.length]
									}
								/>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
