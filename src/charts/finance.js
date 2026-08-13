import * as d3 from "d3";
import { FONT, MONO } from "../theme.js";
import { fmt } from "../lib/format.js";

function sizeOf(el) {
  return { W: Math.max(el.clientWidth || 0, 640), H: Math.max(el.clientHeight || 0, 360) };
}
function svgRoot(container, W, H) {
  d3.select(container).selectAll("*").remove();
  return d3.select(container).append("svg").attr("width", "100%").attr("height", "100%").attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
}

export function renderFanChart(container, data, pal, unit) {
  const labs = data.xLabels || data.categories || [];
  const p10 = (data.p10 || []).map(Number);
  const p50 = (data.p50 || data.median || []).map(Number);
  const p90 = (data.p90 || []).map(Number);
  const actual = (data.actual || []).map(Number);
  if (!labs.length || !p50.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 20, right: 24, bottom: 36, left: 52 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scalePoint().domain(labs).range([0, w]);
  const all = [...p10, ...p50, ...p90, ...actual].filter((n) => !Number.isNaN(n));
  const y = d3.scaleLinear().domain(d3.extent(all)).nice().range([h, 0]);
  const area = d3.area().x((_, i) => x(labs[i])).y0((_, i) => y(p10[i] ?? p50[i])).y1((_, i) => y(p90[i] ?? p50[i])).curve(d3.curveMonotoneX);
  const line = d3.line().x((_, i) => x(labs[i])).y((d) => y(d)).curve(d3.curveMonotoneX);
  g.append("path").datum(p50).attr("d", area).attr("fill", pal.primary).attr("opacity", 0.18);
  g.append("path").datum(p50).attr("d", line).attr("fill", "none").attr("stroke", pal.primary).attr("stroke-width", 2.2);
  if (actual.length) g.append("path").datum(actual).attr("d", line).attr("fill", "none").attr("stroke", pal.ink).attr("stroke-width", 1.6).attr("stroke-dasharray", "4 3");
  labs.forEach((lab, i) => {
    if (i % Math.ceil(labs.length / 8) === 0) g.append("text").attr("x", x(lab)).attr("y", h + 18).attr("text-anchor", "middle").attr("font-size", "10px").attr("fill", pal.muted).attr("font-family", FONT).text(lab);
  });
  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => fmt(d, unit)).tickSize(0).tickPadding(6)).call((s) => s.select(".domain").remove()).selectAll("text").attr("fill", pal.muted).attr("font-family", MONO).attr("font-size", "10px");
}

export function renderUnderwater(container, data, pal, unit) {
  const labs = data.xLabels || [];
  let dd = (data.drawdown || data.values || []).map(Number);
  if (!dd.length && (data.nav || []).length) {
    const nav = data.nav.map(Number);
    let peak = nav[0];
    dd = nav.map((v) => {
      peak = Math.max(peak, v);
      return ((v / peak) - 1) * 100;
    });
  }
  if (!dd.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 16, bottom: 32, left: 52 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scaleLinear().domain([0, dd.length - 1]).range([0, w]);
  const y = d3.scaleLinear().domain([Math.min(0, d3.min(dd) * 1.08), 0]).range([h, 0]);
  const area = d3.area().x((_, i) => x(i)).y0(y(0)).y1((d) => y(d)).curve(d3.curveMonotoneX);
  g.append("path").datum(dd).attr("d", area).attr("fill", pal.negative).attr("opacity", 0.35);
  g.append("path").datum(dd).attr("d", d3.line().x((_, i) => x(i)).y((d) => y(d)).curve(d3.curveMonotoneX)).attr("fill", "none").attr("stroke", pal.negative).attr("stroke-width", 2);
  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => fmt(d, unit || "%")).tickSize(0).tickPadding(6)).call((s) => s.select(".domain").remove()).selectAll("text").attr("fill", pal.muted).attr("font-family", MONO).attr("font-size", "10px");
  if (labs[0]) g.append("text").attr("y", h + 18).attr("fill", pal.muted).attr("font-size", "10px").attr("font-family", FONT).text(`${labs[0]} → ${labs[labs.length - 1] || ""}`);
}

export function renderCumBench(container, data, pal, unit) {
  const labs = data.xLabels || [];
  const fund = (data.fund || data.series?.[0]?.values || []).map(Number);
  const bench = (data.bench || data.series?.[1]?.values || []).map(Number);
  if (!fund.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 28, right: 16, bottom: 32, left: 52 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scaleLinear().domain([0, fund.length - 1]).range([0, w]);
  const y = d3.scaleLinear().domain(d3.extent([...fund, ...bench])).nice().range([h, 0]);
  const line = d3.line().x((_, i) => x(i)).y((d) => y(d)).curve(d3.curveMonotoneX);
  if (bench.length) g.append("path").datum(bench).attr("d", line).attr("fill", "none").attr("stroke", pal.neutral).attr("stroke-width", 2);
  g.append("path").datum(fund).attr("d", line).attr("fill", "none").attr("stroke", pal.primary).attr("stroke-width", 2.4);
  svg.append("text").attr("x", M.left).attr("y", 16).attr("font-size", "11px").attr("fill", pal.primary).attr("font-family", FONT).text(data.fundName || "Fund");
  svg.append("text").attr("x", M.left + 70).attr("y", 16).attr("font-size", "11px").attr("fill", pal.muted).attr("font-family", FONT).text(data.benchName || "Benchmark");
  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => fmt(d, unit)).tickSize(0).tickPadding(6)).call((s) => s.select(".domain").remove()).selectAll("text").attr("fill", pal.muted).attr("font-family", MONO).attr("font-size", "10px");
  if (labs.length) g.append("text").attr("y", h + 18).attr("fill", pal.muted).attr("font-size", "10px").attr("font-family", FONT).text(`${labs[0]} → ${labs[labs.length - 1] || ""}`);
}

export function renderBrinson(container, data, pal, unit) {
  const cats = data.categories || [];
  const alloc = data.allocation || [];
  const sel = data.selection || [];
  const inter = data.interaction || [];
  if (!cats.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 28, right: 16, bottom: 48, left: 48 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scaleBand().domain(cats).range([0, w]).padding(0.25);
  const inner = d3.scaleBand().domain(["Alloc", "Select", "Inter"]).range([0, x.bandwidth()]).padding(0.08);
  const vals = cats.flatMap((_, i) => [alloc[i], sel[i], inter[i]]).map(Number);
  const y = d3.scaleLinear().domain([Math.min(0, d3.min(vals)), Math.max(0, d3.max(vals))]).nice().range([h, 0]);
  const cols = { Alloc: pal.primary, Select: pal.accent || pal.series[1], Inter: pal.neutral };
  cats.forEach((c, i) => {
    [
      ["Alloc", alloc[i]],
      ["Select", sel[i]],
      ["Inter", inter[i]],
    ].forEach(([k, v]) => {
      const n = Number(v) || 0;
      g.append("rect")
        .attr("x", x(c) + inner(k))
        .attr("width", inner.bandwidth())
        .attr("y", n >= 0 ? y(n) : y(0))
        .attr("height", Math.abs(y(n) - y(0)))
        .attr("fill", cols[k]);
    });
    g.append("text").attr("x", x(c) + x.bandwidth() / 2).attr("y", h + 16).attr("text-anchor", "middle").attr("font-size", "10px").attr("fill", pal.ink).attr("font-family", FONT).text(c);
  });
  g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", pal.ink).attr("stroke-width", 1);
  g.append("g").call(d3.axisLeft(y).ticks(4).tickFormat((d) => fmt(d, unit)).tickSize(0).tickPadding(6)).call((s) => s.select(".domain").remove()).selectAll("text").attr("fill", pal.muted).attr("font-family", MONO).attr("font-size", "10px");
}

export function renderLongShort(container, data, pal, unit) {
  const cats = data.categories || [];
  const lng = data.long || [];
  const sh = data.short || [];
  if (!cats.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 24, bottom: 28, left: 110 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const y = d3.scaleBand().domain(cats).range([0, h]).padding(0.28);
  const max = d3.max([...lng, ...sh].map((v) => Math.abs(Number(v)))) * 1.15 || 1;
  const x = d3.scaleLinear().domain([-max, max]).range([0, w]);
  cats.forEach((c, i) => {
    const y0 = y(c);
    g.append("rect").attr("x", x(0)).attr("y", y0).attr("width", x(Number(lng[i]) || 0) - x(0)).attr("height", y.bandwidth() * 0.45).attr("fill", pal.positive);
    g.append("rect").attr("x", x(Number(sh[i]) || 0)).attr("y", y0 + y.bandwidth() * 0.5).attr("width", x(0) - x(Number(sh[i]) || 0)).attr("height", y.bandwidth() * 0.45).attr("fill", pal.negative);
    g.append("text").attr("x", -8).attr("y", y0 + y.bandwidth() / 2 + 4).attr("text-anchor", "end").attr("font-size", "11px").attr("fill", pal.ink).attr("font-family", FONT).text(c);
  });
  g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", h).attr("stroke", pal.ink);
  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(5).tickFormat((d) => fmt(d, unit))).call((s) => s.select(".domain").remove()).selectAll("text").attr("fill", pal.muted).attr("font-family", MONO).attr("font-size", "9px");
}

export function renderOhlc(container, data, pal) {
  const items = data.items || [];
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 16, bottom: 36, left: 52 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scaleBand().domain(items.map((d) => d.label)).range([0, w]).padding(0.35);
  const y = d3.scaleLinear().domain([d3.min(items, (d) => Number(d.l)), d3.max(items, (d) => Number(d.h))]).nice().range([h, 0]);
  items.forEach((it) => {
    const o = Number(it.o);
    const c = Number(it.c);
    const up = c >= o;
    const col = up ? pal.positive : pal.negative;
    const cx = x(it.label) + x.bandwidth() / 2;
    g.append("line").attr("x1", cx).attr("x2", cx).attr("y1", y(Number(it.h))).attr("y2", y(Number(it.l))).attr("stroke", col).attr("stroke-width", 1.4);
    g.append("rect")
      .attr("x", x(it.label))
      .attr("width", x.bandwidth())
      .attr("y", y(Math.max(o, c)))
      .attr("height", Math.max(2, Math.abs(y(o) - y(c))))
      .attr("fill", col);
  });
}

export function renderRidgeline(container, data, pal) {
  const groups = data.groups || [];
  if (!groups.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 12, right: 16, bottom: 20, left: 90 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const band = h / groups.length;
  const all = groups.flatMap((gr) => gr.values || []);
  const x = d3.scaleLinear().domain(d3.extent(all)).nice().range([0, w]);
  groups.forEach((gr, i) => {
    const vals = (gr.values || []).map(Number).sort(d3.ascending);
    const kde = kernel(vals);
    const ys = x.ticks(40).map((t) => [t, kde(t)]);
    const ymax = d3.max(ys, (d) => d[1]) || 1;
    const y = d3.scaleLinear().domain([0, ymax]).range([band * 0.85, 0]);
    const area = d3.area().x((d) => x(d[0])).y0(band * 0.85).y1((d) => y(d[1])).curve(d3.curveBasis);
    const gg = g.append("g").attr("transform", `translate(0,${i * band})`);
    gg.append("path").datum(ys).attr("d", area).attr("fill", pal.series[i % pal.series.length]).attr("opacity", 0.45).attr("stroke", pal.series[i % pal.series.length]);
    gg.append("text").attr("x", -8).attr("y", band * 0.55).attr("text-anchor", "end").attr("font-size", "11px").attr("fill", pal.ink).attr("font-family", FONT).text(gr.label);
  });
}

function kernel(sample) {
  const n = sample.length || 1;
  const sd = d3.deviation(sample) || 1;
  const bw = 1.06 * sd * n ** -0.2;
  return (x) => d3.mean(sample, (v) => Math.exp(-0.5 * ((x - v) / bw) ** 2) / (bw * Math.sqrt(2 * Math.PI)));
}

export function renderCorrMatrix(container, data, pal) {
  const rows = data.rows || data.labels || [];
  const vals = data.values || [];
  if (!rows.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 48, right: 16, bottom: 16, left: 88 };
  const svg = svgRoot(container, W, H);
  const n = rows.length;
  const size = Math.min((W - M.left - M.right) / n, (H - M.top - M.bottom) / n);
  const color = d3.scaleLinear().domain([-1, 0, 1]).range([pal.negative, pal.grid, pal.positive]);
  rows.forEach((r, i) => {
    svg.append("text").attr("x", M.left - 6).attr("y", M.top + i * size + size / 2 + 4).attr("text-anchor", "end").attr("font-size", "10px").attr("fill", pal.ink).attr("font-family", FONT).text(r);
    svg.append("text").attr("x", M.left + i * size + size / 2).attr("y", M.top - 8).attr("text-anchor", "middle").attr("font-size", "10px").attr("fill", pal.muted).attr("font-family", FONT).text(r);
    rows.forEach((_, j) => {
      const v = Number(vals[i]?.[j] ?? (i === j ? 1 : 0));
      svg.append("rect").attr("x", M.left + j * size).attr("y", M.top + i * size).attr("width", size - 2).attr("height", size - 2).attr("fill", color(v));
      if (size > 28) svg.append("text").attr("x", M.left + j * size + size / 2).attr("y", M.top + i * size + size / 2 + 4).attr("text-anchor", "middle").attr("font-size", "9px").attr("font-family", MONO).attr("fill", Math.abs(v) > 0.55 ? "#fff" : pal.ink).text(v.toFixed(2));
    });
  });
}

export function renderYieldCurve(container, data, pal, unit) {
  const tenors = data.tenors || data.xLabels || [];
  const series = data.series || [];
  if (!tenors.length || !series.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 24, right: 16, bottom: 36, left: 48 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scalePoint().domain(tenors).range([0, w]);
  const y = d3.scaleLinear().domain(d3.extent(series.flatMap((s) => s.values))).nice().range([h, 0]);
  const line = d3.line().x((_, i) => x(tenors[i])).y((d) => y(d)).curve(d3.curveMonotoneX);
  series.forEach((s, i) => {
    g.append("path").datum(s.values.map(Number)).attr("d", line).attr("fill", "none").attr("stroke", pal.series[i % pal.series.length]).attr("stroke-width", 2.2);
    g.append("text").attr("x", 8).attr("y", 12 + i * 16).attr("fill", pal.series[i % pal.series.length]).attr("font-size", "11px").attr("font-family", FONT).text(s.name);
  });
  tenors.forEach((t) => g.append("text").attr("x", x(t)).attr("y", h + 18).attr("text-anchor", "middle").attr("font-size", "10px").attr("fill", pal.muted).attr("font-family", FONT).text(t));
  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => fmt(d, unit || "%")).tickSize(0).tickPadding(6)).call((s) => s.select(".domain").remove()).selectAll("text").attr("fill", pal.muted).attr("font-family", MONO).attr("font-size", "10px");
}

export function renderForest(container, data, pal, unit) {
  const items = data.items || [];
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 36, bottom: 28, left: 120 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const y = d3.scaleBand().domain(items.map((d) => d.label)).range([0, h]).padding(0.35);
  const lo = d3.min(items, (d) => Number(d.low ?? d.value));
  const hi = d3.max(items, (d) => Number(d.high ?? d.value));
  const x = d3.scaleLinear().domain([Math.min(lo, 0) * 1.15, Math.max(hi, 0) * 1.15]).nice().range([0, w]);
  g.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", 0).attr("y2", h).attr("stroke", pal.ink).attr("stroke-width", 1);
  items.forEach((it) => {
    const cy = y(it.label) + y.bandwidth() / 2;
    const v = Number(it.value);
    const a = Number(it.low ?? v);
    const b = Number(it.high ?? v);
    g.append("line").attr("x1", x(a)).attr("x2", x(b)).attr("y1", cy).attr("y2", cy).attr("stroke", pal.primary).attr("stroke-width", 2);
    g.append("rect").attr("x", x(v) - 5).attr("y", cy - 5).attr("width", 10).attr("height", 10).attr("fill", pal.primary).attr("transform", `rotate(45 ${x(v)} ${cy})`);
    g.append("text").attr("x", -8).attr("y", cy + 4).attr("text-anchor", "end").attr("font-size", "11px").attr("fill", pal.ink).attr("font-family", FONT).text(it.label);
  });
  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(5).tickFormat((d) => fmt(d, unit))).call((s) => s.select(".domain").remove()).selectAll("text").attr("fill", pal.muted).attr("font-family", MONO).attr("font-size", "10px");
}

export function renderExposureStack(container, data, pal, unit) {
  const labs = data.xLabels || data.categories || [];
  const series = data.series || [];
  if (!labs.length || !series.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 28, right: 16, bottom: 32, left: 52 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scalePoint().domain(labs).range([0, w]);
  const keys = series.map((s) => s.name || "s");
  const stack = d3.stack().keys(keys).offset(d3.stackOffsetDiverging);
  const keyed = labs.map((_, i) => Object.fromEntries(series.map((s, si) => [keys[si], Number(s.values?.[i]) || 0])));
  const layers = stack(keyed);
  const y = d3.scaleLinear().domain([d3.min(layers, (l) => d3.min(l, (d) => d[0])), d3.max(layers, (l) => d3.max(l, (d) => d[1]))]).nice().range([h, 0]);
  const area = d3.area().x((_, i) => x(labs[i])).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(d3.curveMonotoneX);
  layers.forEach((layer, i) => {
    g.append("path").datum(layer).attr("d", area).attr("fill", pal.series[i % pal.series.length]).attr("opacity", 0.72);
  });
  series.forEach((s, i) => {
    g.append("text").attr("x", 4).attr("y", 12 + i * 14).attr("fill", pal.series[i % pal.series.length]).attr("font-size", "11px").attr("font-family", FONT).text(s.name);
  });
  g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", pal.ink);
  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => fmt(d, unit)).tickSize(0).tickPadding(6)).call((s) => s.select(".domain").remove()).selectAll("text").attr("fill", pal.muted).attr("font-family", MONO).attr("font-size", "10px");
}

export const FINANCE_RENDERERS = {
  fan_chart: renderFanChart,
  var_fan: renderFanChart,
  underwater: renderUnderwater,
  cum_bench: renderCumBench,
  rolling_metric: renderCumBench,
  brinson: renderBrinson,
  long_short: renderLongShort,
  ohlc: renderOhlc,
  ridgeline: renderRidgeline,
  violin_returns: renderRidgeline,
  corr_matrix: renderCorrMatrix,
  factor_heatmap: renderCorrMatrix,
  yield_curve: renderYieldCurve,
  exposure_stack: renderExposureStack,
  forest: renderForest,
};
