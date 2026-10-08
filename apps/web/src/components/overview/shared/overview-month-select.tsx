"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";

type MonthOption = {
	value: string;
	label: string;
};

type OverviewMonthSelectProps = {
	value: string;
	options: MonthOption[];
	onValueChange: (value: string) => void;
};

export function OverviewMonthSelect({
	value,
	options,
	onValueChange,
}: OverviewMonthSelectProps) {
	const selectedLabel =
		options.find((option) => option.value === value)?.label ?? value;

	return (
		<Select
			value={value}
			onValueChange={(nextValue) => {
				if (nextValue) {
					onValueChange(nextValue);
				}
			}}
		>
			<SelectTrigger className="h-10 min-w-[140px] justify-center rounded-md px-1.5 border-0 bg-muted text-base [&>svg:last-of-type]:size-5 dark:bg-muted dark:hover:bg-muted">
				<SelectValue className="flex-none text-center" placeholder="Mês">
					{(selected) =>
						options.find((option) => option.value === selected)?.label ??
						selectedLabel
					}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
