import { chartMeta } from "../theme.js";

export function asNum(v) {
  if (v === "" || v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(/[,%$€£₹+\s]/g, "").replace("−", "-").replace(/[()]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function seriesList(data) {
  const raw = data.series || data.datasets || data.lines || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((s, i) => ({
    name: s?.name || s?.label || s?.key || `Series ${i + 1}`,
    values: (s?.values || s?.data || s?.y || s?.v || []).map(asNum),
  }));
}

function categoryList(data) {
  const raw = data.categories || data.xLabels || data.labels || data.x || data.tenors || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => (typeof c === "object" ? c.label || c.name || String(c.x ?? "") : String(c)));
}

function itemList(data) {
  if (Array.isArray(data.items)) {
    return data.items
      .map((it) => {
        if (Array.isArray(it)) return { label: String(it[0] ?? ""), value: asNum(it[1]), type: it[2], ...Object.fromEntries(it.slice(3).map((v, i) => [`k${i}`, v])) };
        if (it && typeof it === "object") {
          return {
            ...it,
            label: String(it.label ?? it.name ?? it.category ?? it.x ?? ""),
            value: asNum(it.value ?? it.y ?? it.val ?? it.v ?? 0),
          };
        }
        return { label: String(it), value: 0 };
      })
      .filter((it) => it.label);
  }
  const cats = categoryList(data);
  if (cats.length && Array.isArray(data.values) && !data.series) {
    return cats.map((label, i) => ({ label, value: asNum(data.values[i]) }));
  }
  return [];
}

export function normalizeChartData(chartType, raw = {}) {
  const d = raw && typeof raw === "object" ? { ...raw } : {};
  let series = seriesList(d);
  let categories = categoryList(d);
  let items = itemList(d);

  if (!categories.length && items.length) categories = items.map((it) => it.label);
  if (!series.length && items.length) {
    series = [{ name: "Value", values: items.map((it) => asNum(it.value)) }];
  }
  if (!items.length && categories.length && series[0]) {
    items = categories.map((label, i) => ({ label, value: asNum(series[0].values[i]) }));
  }

  if (Array.isArray(d.xLabels) && !d.xLabels.length && categories.length) d.xLabels = categories;
  if (!d.xLabels && categories.length) d.xLabels = categories;

  const shape = chartMeta(chartType).shape;
  const out = { ...d, categories, series, items };

  if ((shape === "series" || shape === "line" || chartType === "grouped_bar" || chartType === "grouped_horizontal") && !out.series.length && items.length) {
    out.categories = items.map((it) => it.label);
    out.series = [{ name: "Value", values: items.map((it) => asNum(it.value)) }];
  }
  if (shape === "waterfall" && out.items.length) {
    out.items = out.items.map((it, i, arr) => ({
      ...it,
      type: String(it.type || (i === 0 || i === arr.length - 1 ? "total" : asNum(it.value) >= 0 ? "increase" : "decrease")).toLowerCase(),
    }));
  }
  if ((shape === "items" || shape === "hierarchy") && !out.items.length && out.series[0] && out.categories.length) {
    out.items = out.categories.map((label, i) => ({
      label,
      value: asNum(out.series[0].values[i]),
      type: i === 0 || i === out.categories.length - 1 ? "total" : asNum(out.series[0].values[i]) >= 0 ? "increase" : "decrease",
    }));
  }
  if (shape === "combo") {
    if (!out.bars && out.series[0]) out.bars = { name: out.series[0].name, values: out.series[0].values };
    if (!out.line && out.series[1]) out.line = { name: out.series[1].name, values: out.series[1].values };
    if (!out.categories.length && Array.isArray(out.bars?.values)) {
      out.categories = out.bars.values.map((_, i) => String(i + 1));
    }
  }
  if (shape === "scatter" && !out.points?.length && items.length) {
    out.points = items.map((it, i) => ({ label: it.label, x: asNum(it.x ?? i), y: asNum(it.y ?? it.value), size: asNum(it.size) || 20 }));
  }
  if (shape === "funnel" && !out.stages?.length && items.length) {
    out.stages = items.map((it) => ({ label: it.label, value: it.value }));
  }
  if (shape === "heatmap" || shape === "corr") {
    if (!out.rows && out.labels) out.rows = out.labels;
    if (!out.cols && out.rows && Array.isArray(out.values?.[0])) out.cols = out.rows;
  }
  if (shape === "yield" && !out.tenors?.length) out.tenors = categories;
  if (shape === "fan") {
    out.p10 = (out.p10 || []).map(asNum);
    out.p50 = (out.p50 || out.median || []).map(asNum);
    out.p90 = (out.p90 || []).map(asNum);
    out.actual = (out.actual || []).map(asNum);
  }
  if (shape === "cum_bench") {
    if (!out.fund?.length && out.series[0]) out.fund = out.series[0].values;
    if (!out.bench?.length && out.series[1]) out.bench = out.series[1].values;
  }
  if (shape === "ohlc" && out.items.length) {
    out.items = out.items.map((it) => ({
      label: it.label,
      o: asNum(it.o ?? it.open ?? it.value),
      h: asNum(it.h ?? it.high ?? it.value),
      l: asNum(it.l ?? it.low ?? it.value),
      c: asNum(it.c ?? it.close ?? it.value),
    }));
  }
  return out;
}

export function chartLooksFilled(data) {
  if (!data || typeof data !== "object") return false;
  if ((data.items || []).length) return true;
  if ((data.series || []).some((s) => (s.values || []).length)) return true;
  if ((data.categories || []).length) return true;
  if ((data.points || []).length) return true;
  if ((data.stages || []).length) return true;
  if ((data.groups || []).length) return true;
  if ((data.links || []).length) return true;
  if ((data.p50 || []).length) return true;
  return false;
}
