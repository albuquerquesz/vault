import { Children, isValidElement } from "react";
import { resolveChartChildElement } from "../chart-child-passthrough";
import { HEATMAP_SEPARATOR_MARKER, HeatmapSeparator, } from "./heatmap-separator";
import { resolveHeatmapSeparatorLayout } from "./heatmap-utils";
function getChildComponentName(child) {
    const childType = child.type;
    return typeof child.type === "function"
        ? childType.displayName || childType.name || ""
        : "";
}
function isHeatmapSeparatorElement(child) {
    const resolved = resolveChartChildElement(child);
    const type = resolved.type;
    return (resolved.type === HeatmapSeparator ||
        type[HEATMAP_SEPARATOR_MARKER] === true ||
        getChildComponentName(resolved) === "HeatmapSeparator");
}
function readHeatmapSeparatorConfig(child) {
    const props = resolveChartChildElement(child).props;
    const groupBy = props.groupBy ?? "every";
    if (groupBy === "quarter") {
        return {
            groupBy: "quarter",
            spacing: props.spacing ?? 0,
        };
    }
    if (props.every == null || props.every <= 0) {
        return null;
    }
    return {
        groupBy: "every",
        every: props.every,
        spacing: props.spacing ?? 0,
    };
}
/** Reads the first {@link HeatmapSeparator} child for separator config. */
export function resolveHeatmapSeparatorConfig(children, chartSeparators) {
    let config = null;
    const visit = (node) => {
        if (config) {
            return;
        }
        Children.forEach(node, (child) => {
            if (config || !isValidElement(child)) {
                return;
            }
            if (isHeatmapSeparatorElement(child)) {
                config = readHeatmapSeparatorConfig(child);
                return;
            }
            const childProps = child.props;
            if (childProps?.children) {
                visit(childProps.children);
            }
        });
    };
    visit(children);
    return config ?? normalizeHeatmapSeparatorConfig(chartSeparators);
}
function normalizeHeatmapSeparatorConfig(config) {
    if (!config) {
        return null;
    }
    if (config.groupBy === "quarter") {
        return {
            groupBy: "quarter",
            spacing: config.spacing ?? 0,
        };
    }
    if (!config.every || config.every <= 0) {
        return null;
    }
    return {
        groupBy: "every",
        every: config.every,
        spacing: config.spacing ?? 0,
    };
}
/** Merges chart prop and child-derived config, then resolves column indices from data. */
export function resolveHeatmapSeparatorConfigWithData(children, columns, chartSeparators) {
    const config = resolveHeatmapSeparatorConfig(children, chartSeparators);
    return resolveHeatmapSeparatorLayout(config, columns);
}
