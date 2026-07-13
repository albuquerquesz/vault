"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { flexRender, getCoreRowModel, useReactTable, } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableRow, } from "@vault/ui/components/table";
import { useEffect, useMemo, useRef, useState } from "react";
export function DataTable({ columns, data, pageSize = 10, getRowId, rowSelection: controlledSelection, onRowSelectionChange, }) {
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const [uncontrolledSelection, setUncontrolledSelection] = useState({});
    const sentinelRef = useRef(null);
    const isControlled = controlledSelection !== undefined;
    const rowSelection = isControlled
        ? controlledSelection
        : uncontrolledSelection;
    const setRowSelection = (updater) => {
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
    const visibleData = useMemo(() => data.slice(0, visibleCount), [data, visibleCount]);
    const total = data.length;
    const hasMore = visibleCount < total;
    // Re-attach after each batch so a still-visible sentinel keeps loading.
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node || !hasMore) {
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            if (!entries[0]?.isIntersecting) {
                return;
            }
            setVisibleCount((count) => Math.min(count + pageSize, total));
        }, { root: null, rootMargin: "200px 0px", threshold: 0 });
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
    return (_jsxs("div", { className: "w-full space-y-2", children: [_jsx("div", { className: "w-full overflow-x-auto", children: _jsx(Table, { className: "border-separate border-spacing-0", children: _jsx(TableBody, { children: table.getRowModel().rows.length ? (table.getRowModel().rows.map((row) => (_jsx(TableRow, { className: "h-10 border-b border-border/40 hover:bg-muted/20 data-[state=selected]:bg-muted/20", "data-state": row.getIsSelected() && "selected", children: row.getVisibleCells().map((cell) => (_jsx(TableCell, { className: "px-3 py-1.5", children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id)))) : (_jsx(TableRow, { className: "hover:bg-transparent", children: _jsx(TableCell, { className: "h-24 text-center text-muted-foreground", colSpan: columns.length, children: "Nenhum resultado." }) })) }) }) }), total > 0 ? (_jsx("div", { className: "flex flex-col items-center gap-2 px-0.5", children: _jsx("div", { "aria-hidden": true, className: "h-1 w-full", ref: sentinelRef }) })) : null] }));
}
