"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import { CalendarIcon } from "lucide-react";

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
			<SelectTrigger className="h-10 min-w-[140px] justify-center px-2 border-0 bg-transparent text-base [&>svg:last-of-type]:size-5 dark:bg-transparent dark:hover:bg-transparent">
				<CalendarIcon className="size-5 text-muted-foreground" />
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
