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
			<SelectTrigger className="h-9 min-w-[160px] text-sm">
				<CalendarIcon className="mr-2 size-3.5 text-muted-foreground" />
				<SelectValue placeholder="Mês">
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
