"use client";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Button } from "@vault/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@vault/ui/components/table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	pageSize?: number;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	pageSize = 10,
}: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize,
			},
		},
	});

	const pageCount = table.getPageCount();
	const pageIndex = table.getState().pagination.pageIndex;
	const total = data.length;
	const rangeStart = total === 0 ? 0 : pageIndex * pageSize + 1;
	const rangeEnd = Math.min((pageIndex + 1) * pageSize, total);

	return (
		<div className="w-full space-y-2">
			{/* Table shell: no heavy outer border (Resend-like). */}
			<div className="w-full overflow-x-auto">
				<Table className="border-separate border-spacing-0">
					<TableHeader className="[&_tr]:border-b-0">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								className="border-0 hover:bg-transparent"
								key={headerGroup.id}
							>
								{headerGroup.headers.map((header, headerIndex) => {
									const isFirst = headerIndex === 0;
									const isLast = headerIndex === headerGroup.headers.length - 1;

									return (
										<TableHead
											className={[
												// Light: deeper gray pill; dark: soft light-gray on near-black
												"h-8 border-y border-border/70 bg-muted px-3 text-xs font-medium text-muted-foreground dark:border-white/12 dark:bg-white/12 dark:text-white/50",
												isFirst
													? "rounded-l-full border-l border-border/70 pl-4 dark:border-white/12"
													: "",
												isLast
													? "rounded-r-full border-r border-border/70 pr-4 dark:border-white/12"
													: "",
											]
												.filter(Boolean)
												.join(" ")}
											key={header.id}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					{/* Spacer between pill header and body */}
					<tbody aria-hidden className="h-1">
						<tr>
							<td colSpan={columns.length} className="p-0" />
						</tr>
					</tbody>
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
				<div className="flex items-center justify-between gap-3 px-0.5">
					<p className="text-xs text-muted-foreground tabular-nums">
						Página {rangeStart}–{rangeEnd} de {Math.max(pageCount, 1)}
						{" · "}
						{total} {total === 1 ? "item" : "itens"}
					</p>
					<div className="flex items-center gap-0.5">
						<Button
							aria-label="Página anterior"
							className="size-7"
							disabled={!table.getCanPreviousPage()}
							onClick={() => table.previousPage()}
							size="icon-xs"
							variant="ghost"
						>
							<ChevronLeftIcon className="size-3.5" />
						</Button>
						<Button
							aria-label="Próxima página"
							className="size-7"
							disabled={!table.getCanNextPage()}
							onClick={() => table.nextPage()}
							size="icon-xs"
							variant="ghost"
						>
							<ChevronRightIcon className="size-3.5" />
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
