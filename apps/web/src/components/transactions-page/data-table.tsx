"use client";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type RowSelectionState,
	useReactTable,
} from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "@vault/ui/components/table";
import { useEffect, useMemo, useRef, useState } from "react";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	/** How many rows to reveal per scroll batch. */
	pageSize?: number;
	/** Stable row id for selection across infinite-scroll batches. */
	getRowId?: (originalRow: TData, index: number) => string;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	pageSize = 10,
	getRowId,
}: DataTableProps<TData, TValue>) {
	const [visibleCount, setVisibleCount] = useState(pageSize);
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const sentinelRef = useRef<HTMLDivElement>(null);

	// Reset batch when filters / month change the dataset.
	useEffect(() => {
		setVisibleCount(pageSize);
	}, [data, pageSize]);

	// Clear selection when the underlying dataset identity changes (month/filters).
	useEffect(() => {
		setRowSelection({});
	}, [data]);

	const visibleData = useMemo(
		() => data.slice(0, visibleCount),
		[data, visibleCount],
	);
	const total = data.length;
	const hasMore = visibleCount < total;

	// Re-attach after each batch so a still-visible sentinel keeps loading.
	useEffect(() => {
		const node = sentinelRef.current;
		if (!node || !hasMore) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries[0]?.isIntersecting) {
					return;
				}
				setVisibleCount((count) => Math.min(count + pageSize, total));
			},
			{ root: null, rootMargin: "200px 0px", threshold: 0 },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [hasMore, pageSize, total, visibleCount]);

	const table = useReactTable({
		data: visibleData,
		columns,
		state: { rowSelection },
		onRowSelectionChange: setRowSelection,
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getRowId,
	});

	return (
		<div className="w-full space-y-2">
			{/* Table shell: no heavy outer border (Resend-like). */}
			<div className="w-full overflow-x-auto">
				<Table className="border-separate border-spacing-0">
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									className="h-10 border-b border-border/40 hover:bg-muted/20 data-[state=selected]:bg-muted/20"
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell className="px-3 py-1.5" key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow className="hover:bg-transparent">
								<TableCell
									className="h-24 text-center text-muted-foreground"
									colSpan={columns.length}
								>
									Nenhum resultado.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{total > 0 ? (
				<div className="flex flex-col items-center gap-2 px-0.5">
					<div aria-hidden className="h-1 w-full" ref={sentinelRef} />
				</div>
			) : null}
		</div>
	);
}
