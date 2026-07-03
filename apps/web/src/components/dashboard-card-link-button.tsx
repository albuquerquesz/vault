"use client";

import { Link } from "@tanstack/react-router";
import { Button } from "@vault/ui/components/button";
import { cn } from "@vault/ui/lib/utils";
import { ArrowUpRightIcon } from "lucide-react";

type DashboardCardLinkButtonProps = {
	to: string;
	label: string;
	className?: string;
};

export function DashboardCardLinkButton({
	to,
	label,
	className,
}: DashboardCardLinkButtonProps) {
	return (
		<Button
			aria-label={label}
			className={cn(
				"size-8 rounded-full text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground",
				className,
			)}
			render={<Link to={to} />}
			size="icon-sm"
			variant="ghost"
		>
			<ArrowUpRightIcon className="size-4.5" />
		</Button>
	);
}
