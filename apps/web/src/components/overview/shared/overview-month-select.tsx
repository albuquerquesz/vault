"use client";

import {
	FinanceMonthSelect,
	type FinanceMonthOption,
} from "@/components/shared/finance-month-select";

type OverviewMonthSelectProps = {
	value: string;
	options: FinanceMonthOption[];
	onValueChange: (value: string) => void;
};

export function OverviewMonthSelect({
	value,
	options,
	onValueChange,
}: OverviewMonthSelectProps) {
	return (
		<FinanceMonthSelect
			value={value}
			options={options}
			onValueChange={onValueChange}
			tone="dark"
		/>
	);
}
