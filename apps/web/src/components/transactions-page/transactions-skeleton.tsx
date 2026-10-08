"use client";

function Block({ className }: { className: string }) {
	return <div aria-hidden className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function TransactionsSkeleton() {
	return (
		<>
			<section aria-label="Carregando resumo das transações" className="rounded-[18px] bg-zinc-950 p-5 sm:p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-2"><Block className="h-5 w-28 bg-white/15" /><Block className="h-4 w-40 bg-white/10" /></div>
					<div className="flex gap-2"><Block className="h-10 w-36 bg-white/15" /><Block className="h-10 w-28 bg-white/15" /></div>
				</div>
				<div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-4 sm:grid-cols-4 sm:gap-0">
					{Array.from({ length: 4 }).map((_, index) => <div className="space-y-2 sm:px-5 first:sm:pl-0" key={index}><Block className="h-3 w-20 bg-white/10" /><Block className="h-6 w-28 bg-white/15" /></div>)}
				</div>
			</section>
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[3fr_2fr]">
				<div className="rounded-2xl border border-border bg-card p-5"><Block className="h-5 w-32" /><Block className="mt-2 h-4 w-52" /><Block className="mt-5 h-10 w-full" /><div className="mt-5 space-y-3">{Array.from({ length: 8 }).map((_, index) => <Block className="h-12 w-full" key={index} />)}</div></div>
				<div className="rounded-2xl border border-border bg-card p-5"><Block className="h-5 w-40" /><Block className="mt-2 h-4 w-32" /><div className="mt-6 space-y-4">{Array.from({ length: 5 }).map((_, index) => <Block className="h-8" key={index} />)}</div></div>
			</div>
		</>
	);
}
