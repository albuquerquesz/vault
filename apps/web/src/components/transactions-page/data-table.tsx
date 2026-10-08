"use client";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type Row,
	useReactTable,
} from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@vault/ui/components/table";
import { cn } from "@vault/ui/lib/utils";
import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	/** How many rows to reveal per scroll batch. */
	pageSize?: number;
	/** Stable row id for rows across infinite-scroll batches. */
	getRowId?: (originalRow: TData, index: number) => string;
	/** When set, inserts a group header before the first row of each group. */
	getGroupKey?: (row: TData) => string;
	renderGroupHeader?: (groupKey: string) => ReactNode;
	mobileRowRenderer?: (row: Row<TData>) => ReactNode;
	onRowClick?: (row: Row<TData>) => void;
	isRowClickable?: (row: Row<TData>) => boolean;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	pageSize = 10,
	getRowId,
	getGroupKey,
	renderGroupHeader,
	mobileRowRenderer,
	onRowClick,
	isRowClickable,
}: DataTableProps<TData, TValue>) {
	const [visibleCount, setVisibleCount] = useState(pageSize);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const isMobile = useIsMobile();

	// Reset batch when filters / month change the dataset.
	useEffect(() => {
		setVisibleCount(pageSize);
	}, [data, pageSize]);

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
		getCoreRowModel: getCoreRowModel(),
		getRowId,
	});

	const rows = table.getRowModel().rows;
	const shouldRenderMobileList = isMobile && mobileRowRenderer;

	return (
		<div className="w-full space-y-2">
			{shouldRenderMobileList ? (
				<div className="grid gap-2">
					{rows.length ? (
						rows.map((row, index) => {
							const groupKey = getGroupKey?.(row.original);
							const previousKey =
								index > 0 ? getGroupKey?.(rows[index - 1]!.original) : undefined;
								const showGroupHeader =
									Boolean(getGroupKey) &&
									groupKey !== undefined &&
									groupKey !== previousKey;

							return (
								<Fragment key={row.id}>
									{showGroupHeader && groupKey !== undefined ? (
										<div className="px-1 pb-1 pt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase first:pt-0">
											{renderGroupHeader ? renderGroupHeader(groupKey) : groupKey}
										</div>
									) : null}
									{mobileRowRenderer(row)}
								</Fragment>
							);
						})
					) : (
						<div className="grid h-24 place-items-center text-center text-sm text-muted-foreground">
							Nenhum resultado.
						</div>
					)}
				</div>
			) : (
				<div className="w-full overflow-x-auto">
					<Table className="w-full table-fixed border-separate border-spacing-0">
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow className="hover:bg-transparent" key={headerGroup.id}>
									{headerGroup.headers.map((header, index) => (
										<TableHead
											className={cn(
												"h-9 border-b border-border/60 px-2 text-xs font-medium text-muted-foreground sm:px-3",
												index === 0 && "w-[46%]",
												index === 1 && "w-[26%]",
												index === 2 && "w-[28%] min-w-[8.5rem]",
											)}
											key={header.id}
										>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{rows.length ? (
								rows.map((row, index) => {
									const groupKey = getGroupKey?.(row.original);
									const previousKey =
										index > 0
											? getGroupKey?.(rows[index - 1]!.original)
											: undefined;
										const showGroupHeader =
											Boolean(getGroupKey) &&
											groupKey !== undefined &&
											groupKey !== previousKey;
									const rowClickable =
										onRowClick !== undefined &&
										(isRowClickable?.(row) ?? true);

									return (
										<Fragment key={row.id}>
											{showGroupHeader && groupKey !== undefined ? (
												<TableRow className="hover:bg-transparent">
													<TableCell
														className="px-2 pb-1 pt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:px-3 sm:pt-5"
														colSpan={columns.length}
													>
														{renderGroupHeader
															? renderGroupHeader(groupKey)
															: groupKey}
													</TableCell>
												</TableRow>
											) : null}
									<TableRow
											className={cn(
												"h-9 border-b border-border/40 hover:bg-muted/20 sm:h-10",
												rowClickable &&
													"cursor-pointer focus-visible:bg-muted/30 focus-visible:outline-none",
											)}
											onClick={
												rowClickable && onRowClick
													? () => onRowClick(row)
													: undefined
											}
											onKeyDown={
												rowClickable && onRowClick
													? (event) => {
															if (event.key === "Enter" || event.key === " ") {
																event.preventDefault();
																onRowClick(row);
															}
													  }
													: undefined
											}
											tabIndex={rowClickable ? 0 : undefined}
										>
											{row.getVisibleCells().map((cell, cellIndex) => (
													<TableCell
														className={cn(
															"px-2 py-1 text-xs sm:px-3 sm:text-sm",
															cellIndex === 0 && "w-[46%]",
															cellIndex === 1 && "w-[26%]",
															cellIndex === 2 && "w-[28%] min-w-[8.5rem]",
														)}
														key={cell.id}
													>
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													</TableCell>
												))}
											</TableRow>
										</Fragment>
									);
								})
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
			)}

			{total > 0 ? (
				<div className="flex flex-col items-center gap-2 px-0.5">
					<div aria-hidden className="h-1 w-full" ref={sentinelRef} />
				</div>
			) : null}
		</div>
	);
}
