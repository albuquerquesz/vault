"use client";

export function TransactionsSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-border/60 bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[auto_auto_1fr_auto] md:items-center">
          <div className="h-10 w-full rounded-md border border-border/60 bg-muted/40 md:w-[160px]" />
          <div className="h-10 w-full rounded-md border border-border/60 bg-muted/40 md:w-[180px]" />
          <div className="h-10 w-full rounded-md border border-border/60 bg-muted/40 md:min-w-[240px]" />
          <div className="h-10 w-full rounded-md border border-border/60 bg-muted/40 md:w-[130px]" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`summary-skeleton-${index}`}
            className="rounded-lg border border-border/60 bg-card p-4"
          >
            <div className="h-4 w-28 rounded-md bg-muted/40" />
            <div className="mt-3 h-8 w-32 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border/60 bg-card">
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
    </div>
  );
}
