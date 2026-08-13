import { chartLooksFilled, normalizeChartData } from "./chartData.js";

const WEAK = new Set([
  "pie_donut",
  "nested_donut",
  "kpi_cards",
  "gauge",
  "progress_ring",
  "waffle",
  "win_loss",
  "histogram",
  "timeline",
]);

export function displayValue(v) {
  if (v == null || v === "") return "—";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v);
}

export function upgradeSuggestion(s) {
  const data = s.data || {};
  let type = s.chartType || s.type || "waterfall";
  const seriesN = (data.series || []).filter((x) => (x.values || []).length).length;
  const itemN = (data.items || []).length;

  if (type === "kpi_cards") type = itemN ? "bullet" : "waterfall";
  if (type === "pie_donut" || type === "nested_donut" || type === "waffle") type = itemN > 6 ? "treemap" : "icicle";
  if (type === "gauge" || type === "progress_ring") type = "bullet";
  if (type === "histogram") type = "ridgeline";
  if (type === "grouped_bar" && seriesN < 2) type = itemN || (data.categories || []).length ? "lollipop" : "waterfall";
  if (type === "horizontal_bar") type = "lollipop";
  if (type === "line_trend" && seriesN < 2) {
    if (data.bars || data.line) type = "combo";
    else type = "area_stacked";
  }
  if (type === "step_line") type = "combo";

  const next = { ...s, chartType: type, data: normalizeChartData(type, data) };
  if (type === "combo" && !next.data.bars && next.data.series?.[0]) {
    next.data.bars = { name: next.data.series[0].name, values: next.data.series[0].values };
    next.data.line = next.data.series[1]
      ? { name: next.data.series[1].name, values: next.data.series[1].values }
      : { name: next.data.series[0].name, values: next.data.series[0].values };
    next.data.categories = next.data.categories.length ? next.data.categories : next.data.xLabels || [];
  }
  if (type === "lollipop" && !next.data.items?.length && next.data.categories && next.data.series?.[0]) {
    next.data.items = next.data.categories.map((label, i) => ({ label, value: next.data.series[0].values[i] }));
  }
  if (type === "bullet" && (data.items || []).length) {
    next.data.items = (data.items || []).map((it) => ({
      label: it.label || it.name,
      value: typeof it.value === "number" ? it.value : Number(String(it.value).replace(/[^\d.-]/g, "")) || 0,
      target: Number(it.target) || (typeof it.value === "number" ? it.value : Number(String(it.value).replace(/[^\d.-]/g, "")) || 0),
    }));
  }
  return next;
}

export function isWeakType(id) {
  return WEAK.has(id);
}

export function dropEmpty(s) {
  return chartLooksFilled(s?.data);
}
