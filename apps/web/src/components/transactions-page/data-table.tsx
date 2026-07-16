"use client";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type OnChangeFn,
	type Row,
	type RowSelectionState,
	useReactTable,
} from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
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
	/** Stable row id for selection across infinite-scroll batches. */
	getRowId?: (originalRow: TData, index: number) => string;
	enableRowSelection?: boolean | ((row: TData) => boolean);
	rowSelection?: RowSelectionState;
	onRowSelectionChange?: OnChangeFn<RowSelectionState>;
	/** When set, inserts a group header before the first row of each group. */
	getGroupKey?: (row: TData) => string;
	renderGroupHeader?: (groupKey: string) => ReactNode;
	mobileRowRenderer?: (row: Row<TData>) => ReactNode;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	pageSize = 10,
	getRowId,
	enableRowSelection = true,
	rowSelection: controlledSelection,
	onRowSelectionChange,
	getGroupKey,
	renderGroupHeader,
	mobileRowRenderer,
}: DataTableProps<TData, TValue>) {
	const [visibleCount, setVisibleCount] = useState(pageSize);
	const [uncontrolledSelection, setUncontrolledSelection] =
		useState<RowSelectionState>({});
	const sentinelRef = useRef<HTMLDivElement>(null);
	const isMobile = useIsMobile();

	const isControlled = controlledSelection !== undefined;
	const rowSelection = isControlled
		? controlledSelection
		: uncontrolledSelection;
	const setRowSelection: OnChangeFn<RowSelectionState> = (updater) => {
		if (isControlled) {
			onRowSelectionChange?.(updater);
			return;
		}
		setUncontrolledSelection(updater);
		onRowSelectionChange?.(updater);
	};

	// Reset batch when filters / month change the dataset.
	useEffect(() => {
		setVisibleCount(pageSize);
	}, [data, pageSize]);

	// Clear internal selection when the underlying dataset identity changes.
	useEffect(() => {
		if (!isControlled) {
			setUncontrolledSelection({});
		}
	}, [data, isControlled]);

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
		enableRowSelection:
			typeof enableRowSelection === "function"
				? (row) => enableRowSelection(row.original)
				: enableRowSelection,
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
												className="h-9 border-b border-border/40 hover:bg-muted/20 data-[state=selected]:bg-muted/20 sm:h-10"
												data-state={row.getIsSelected() && "selected"}
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
