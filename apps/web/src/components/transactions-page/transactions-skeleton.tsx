"use client";

export function TransactionsSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
			<div className="min-w-0 rounded-none border border-border/60 bg-card">
				<div className="border-b p-4">
					<div className="flex items-center gap-2">
						<div className="size-4 rounded-full bg-muted/40" />
						<div className="h-4 w-20 rounded-md bg-muted/40" />
					</div>
				</div>
				<div className="space-y-5 p-4">
					{Array.from({ length: 4 }).map((_, groupIndex) => (
						<div key={`transaction-group-${groupIndex}`} className="space-y-3">
							<div className="flex items-center justify-between gap-3">
								<div className="h-3 w-44 rounded bg-muted/40" />
								<div className="h-3 w-16 rounded bg-muted/40" />
							</div>
							<div className="space-y-2">
								{Array.from({ length: 3 }).map((__, rowIndex) => (
									<div
										key={`transaction-row-${groupIndex}-${rowIndex}`}
										className="flex items-center gap-3 rounded-lg px-3 py-3"
									>
										<div className="size-2 rounded-full bg-muted/40" />
										<div className="min-w-0 flex-1 space-y-2">
											<div className="h-4 w-44 rounded bg-muted/40" />
											<div className="h-3 w-20 rounded bg-muted/40" />
										</div>
										<div className="h-5 w-24 rounded bg-muted/40" />
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="flex min-w-0 flex-col gap-8">
				<div className="financial-panel-border flex h-[300px] w-full flex-col items-stretch gap-3 p-3 sm:gap-4 sm:p-4">
					<div className="flex flex-wrap items-center gap-3 sm:gap-4">
						<div className="h-8 w-28 rounded-full bg-muted/40" />
						<div className="h-5 w-12 rounded bg-muted/40" />
						<div className="h-5 w-24 rounded bg-muted/40" />
						<div className="h-5 w-24 rounded bg-muted/40" />
					</div>
					<div className="h-9 w-full rounded-md bg-muted/40" />
				</div>
				<div className="financial-panel-border h-[300px] w-full" />
			</div>
		</div>
	);
}
