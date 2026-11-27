import { Button } from "@vault/ui/components/button";
import { Skeleton } from "@vault/ui/components/skeleton";
import { cn } from "@vault/ui/lib/utils";

export function SectionError({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) {
	return (
		<div className="space-y-3">
			<p className="text-sm text-destructive" role="alert">
				{message}
			</p>
			<Button onClick={onRetry} size="sm" variant="outline">
				Tentar de novo
			</Button>
		</div>
	);
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
	return (
		<div aria-busy="true" className="space-y-3">
			{Array.from({ length: rows }, (_, index) => (
				<Skeleton className="h-12 w-full" key={index} />
			))}
		</div>
	);
}

export function ProgressBar({
	percent,
	label,
	tone,
}: {
	percent: number;
	label: string;
	tone?: "danger";
}) {
	const clamped = Math.min(Math.max(percent, 0), 100);
	return (
		<div
			aria-label={label}
			aria-valuemax={100}
			aria-valuemin={0}
			aria-valuenow={Math.round(clamped)}
			className="h-1.5 w-full overflow-hidden bg-muted"
			role="progressbar"
		>
			<div
				className={cn("h-full", tone === "danger" ? "bg-destructive" : "bg-foreground/70")}
				style={{ width: `${clamped}%` }}
			/>
		</div>
	);
}

export function formatShortDate(date: string) {
	const [, month, day] = date.split("-");
	return `${day}/${month}`;
}
