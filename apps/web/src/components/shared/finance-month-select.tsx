"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@vault/ui/components/select";
import { cn } from "@vault/ui/lib/utils";

export type FinanceMonthOption = {
	value: string;
	label: string;
};

export function FinanceMonthSelect({
	value,
	options,
	onValueChange,
	tone = "default",
}: {
	value: string;
	options: FinanceMonthOption[];
	onValueChange: (value: string) => void;
	tone?: "default" | "dark";
}) {
	const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

	return (
		<Select
			value={value}
			onValueChange={(nextValue) => {
				if (nextValue) onValueChange(nextValue);
			}}
		>
			<SelectTrigger
				className={cn(
					"h-10 min-w-[140px] justify-center gap-2 rounded-md px-2 text-base [&>svg:last-of-type]:size-5",
					tone === "dark"
						? "border-0 bg-white/15 text-white hover:bg-white/20"
						: "border-border/70 bg-muted/70 text-foreground hover:bg-muted",
				)}
			>
				<SelectValue className="flex-none text-center" placeholder="Mês">
					{(selected) =>
						options.find((option) => option.value === selected)?.label ?? selectedLabel
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
