"use client";

function Block({ className }: { className: string }) {
	return <div aria-hidden className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function TransactionsSkeleton() {
	return (
		<>
			<div className="grid gap-6">
				<div className="rounded-2xl border border-border bg-card p-5"><Block className="h-5 w-40" /><Block className="mt-2 h-4 w-32" /><div className="mt-6 space-y-4">{Array.from({ length: 5 }).map((_, index) => <Block className="h-8" key={index} />)}</div></div>
				<div className="rounded-2xl border border-border bg-card p-5"><Block className="h-5 w-32" /><Block className="mt-2 h-4 w-52" /><Block className="mt-5 h-10 w-full" /><div className="mt-5 space-y-3">{Array.from({ length: 8 }).map((_, index) => <Block className="h-12 w-full" key={index} />)}</div></div>
			</div>
		</>
	);
}
