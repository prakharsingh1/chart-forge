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

export function renderQq(container, data, pal, unit) {
  const sample = (data.sample || data.values || (data.points || []).map((p) => p.y)).map(Number).filter((n) => !Number.isNaN(n)).sort(d3.ascending);
  if (sample.length < 3) return;
  const n = sample.length;
  const mean = d3.mean(sample);
  const sd = d3.deviation(sample) || 1;
  const pts = sample.map((y, i) => {
    const p = (i + 0.5) / n;
    const x = mean + sd * invNorm(p);
    return { x, y };
  });
  const { W, H } = sizeOf(container);
  const M = { top: 20, right: 20, bottom: 40, left: 48 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scaleLinear().domain(d3.extent(pts, (d) => d.x)).nice().range([0, w]);
  const y = d3.scaleLinear().domain(d3.extent(pts, (d) => d.y)).nice().range([h, 0]);
  g.append("line").attr("x1", x.range()[0]).attr("x2", x.range()[1]).attr("y1", y(x.domain()[0])).attr("y2", y(x.domain()[1])).attr("stroke", pal.neutral).attr("stroke-dasharray", "4 3");
  g.selectAll("circle").data(pts).join("circle").attr("cx", (d) => x(d.x)).attr("cy", (d) => y(d.y)).attr("r", 3.5).attr("fill", pal.primary).attr("opacity", 0.85);
  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => fmt(d, unit)).tickSize(0).tickPadding(6)).call((s) => s.select(".domain").remove()).selectAll("text").attr("fill", pal.muted).attr("font-family", MONO).attr("font-size", "10px");
  svg.append("text").attr("x", M.left).attr("y", H - 8).attr("fill", pal.muted).attr("font-size", "10px").attr("font-family", FONT).text("Theoretical quantile →");
}
function invNorm(p) {
  const a = [ -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577509590705e2, -3.066479806614716e1, 2.506628238459241e0 ];
  const b = [ -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1 ];
  const c = [ -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783 ];
  const d = [ 7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416 ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q, r;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5;
  r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function renderHorizon(container, data, pal, unit) {
  const labs = data.xLabels || data.categories || [];
  const values = (data.values || data.series?.[0]?.values || []).map(Number);
  if (!values.length) return;
  const bands = Number(data.bands) || 4;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 16, bottom: 28, left: 16 };
  const svg = svgRoot(container, W, H);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const max = d3.max(values, Math.abs) || 1;
  const bandH = h / bands;
  const x = d3.scaleLinear().domain([0, values.length - 1]).range([M.left, M.left + w]);
  const y = d3.scaleLinear().domain([0, max / bands]).range([bandH, 0]);
  const area = d3.area().x((_, i) => x(i)).y0(bandH).y1((d) => y(d)).curve(d3.curveMonotoneX);
  for (let b = 0; b < bands; b++) {
    const layer = values.map((v) => Math.max(0, Math.min(max / bands, Math.abs(v) - b * (max / bands))));
    const g = svg.append("g").attr("transform", `translate(0,${M.top + (bands - 1 - b) * bandH})`);
    g.append("path").datum(layer).attr("d", area).attr("fill", pal.primary).attr("opacity", 0.22 + b * 0.18);
  }
  svg.append("text").attr("x", M.left).attr("y", H - 8).attr("fill", pal.muted).attr("font-size", "10px").attr("font-family", FONT).text(labs[0] ? `${labs[0]} → ${labs[labs.length - 1] || ""} · ${bands} bands ${unit || ""}` : "");
}

export function renderVolSurface(container, data, pal) {
  const rows = data.rows || data.tenors || [];
  const cols = data.cols || data.strikes || [];
  const values = data.values || [];
  if (!rows.length || !cols.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 36, right: 16, bottom: 28, left: 52 };
  const svg = svgRoot(container, W, H);
  const x = d3.scaleBand().domain(cols).range([M.left, W - M.right]).padding(0.06);
  const y = d3.scaleBand().domain(rows).range([M.top, H - M.bottom]).padding(0.06);
  const flat = values.flat().map(Number);
  const color = d3.scaleSequential(d3.interpolateTurbo).domain([d3.min(flat) || 0, d3.max(flat) || 1]);
  rows.forEach((r, ri) => {
    cols.forEach((c, ci) => {
      const v = Number(values[ri]?.[ci]) || 0;
      svg.append("rect").attr("x", x(c)).attr("y", y(r)).attr("width", x.bandwidth()).attr("height", y.bandwidth()).attr("rx", 3).attr("fill", color(v));
      if (x.bandwidth() > 28) svg.append("text").attr("x", x(c) + x.bandwidth() / 2).attr("y", y(r) + y.bandwidth() / 2 + 4).attr("text-anchor", "middle").attr("font-size", "9px").attr("font-family", MONO).attr("fill", v > (d3.max(flat) || 1) * 0.62 ? "#fff" : pal.ink).text(v.toFixed(1));
    });
  });
  cols.forEach((c) => svg.append("text").attr("x", x(c) + x.bandwidth() / 2).attr("y", M.top - 8).attr("text-anchor", "middle").attr("font-size", "10px").attr("fill", pal.muted).attr("font-family", FONT).text(c));
  rows.forEach((r) => svg.append("text").attr("x", M.left - 6).attr("y", y(r) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").attr("font-size", "10px").attr("fill", pal.ink).attr("font-family", FONT).text(r));
}

export function renderOrderBook(container, data, pal, unit) {
  const bids = data.bids || [];
  const asks = data.asks || [];
  if (!bids.length && !asks.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 24, right: 16, bottom: 32, left: 16 };
  const svg = svgRoot(container, W, H);
  const mid = W / 2;
  const max = d3.max([...bids, ...asks], (d) => Number(d.size || d.value)) || 1;
  const y = d3.scaleBand().domain(d3.range(Math.max(bids.length, asks.length))).range([M.top, H - M.bottom]).padding(0.12);
  const x = d3.scaleLinear().domain([0, max]).range([0, mid - M.left - 20]);
  bids.forEach((b, i) => {
    svg.append("rect").attr("x", mid - x(Number(b.size || b.value))).attr("y", y(i)).attr("width", x(Number(b.size || b.value))).attr("height", y.bandwidth()).attr("fill", pal.positive).attr("opacity", 0.8);
    svg.append("text").attr("x", mid - x(Number(b.size || b.value)) - 4).attr("y", y(i) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").attr("font-size", "10px").attr("font-family", MONO).attr("fill", pal.ink).text(b.price ?? b.label);
  });
  asks.forEach((a, i) => {
    svg.append("rect").attr("x", mid + 8).attr("y", y(i)).attr("width", x(Number(a.size || a.value))).attr("height", y.bandwidth()).attr("fill", pal.negative).attr("opacity", 0.8);
    svg.append("text").attr("x", mid + 12 + x(Number(a.size || a.value))).attr("y", y(i) + y.bandwidth() / 2 + 4).attr("font-size", "10px").attr("font-family", MONO).attr("fill", pal.ink).text(a.price ?? a.label);
  });
  svg.append("text").attr("x", mid - 40).attr("y", 16).attr("fill", pal.positive).attr("font-size", "11px").attr("font-family", FONT).text("Bids");
  svg.append("text").attr("x", mid + 16).attr("y", 16).attr("fill", pal.negative).attr("font-size", "11px").attr("font-family", FONT).text(`Asks ${unit || ""}`);
}

export function renderParallel(container, data, pal) {
  const axes = data.axes || data.categories || [];
  const rows = data.rows || data.items || [];
  if (axes.length < 2 || !rows.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 28, right: 24, bottom: 20, left: 36 };
  const svg = svgRoot(container, W, H);
  const x = d3.scalePoint().domain(axes).range([M.left, W - M.right]);
  const ys = {};
  axes.forEach((ax) => {
    const vals = rows.map((r) => Number(r[ax] ?? r.values?.[axes.indexOf(ax)])).filter((n) => !Number.isNaN(n));
    ys[ax] = d3.scaleLinear().domain(d3.extent(vals)).range([H - M.bottom, M.top]);
  });
  const line = (row) => d3.line()(axes.map((ax) => [x(ax), ys[ax](Number(row[ax] ?? row.values?.[axes.indexOf(ax)]) || 0)]));
  rows.forEach((row, i) => {
    svg.append("path").attr("d", line(row)).attr("fill", "none").attr("stroke", pal.series[i % pal.series.length]).attr("stroke-width", 1.4).attr("opacity", 0.75);
  });
  axes.forEach((ax) => {
    svg.append("line").attr("x1", x(ax)).attr("x2", x(ax)).attr("y1", M.top).attr("y2", H - M.bottom).attr("stroke", pal.grid);
    svg.append("text").attr("x", x(ax)).attr("y", 16).attr("text-anchor", "middle").attr("font-size", "11px").attr("fill", pal.ink).attr("font-family", FONT).text(ax);
  });
}

export function renderAlphaBeta(container, data, pal, unit) {
  const points = data.points || [];
  if (!points.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 20, right: 20, bottom: 40, left: 48 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scaleLinear().domain(d3.extent(points, (d) => Number(d.x))).nice().range([0, w]);
  const y = d3.scaleLinear().domain(d3.extent(points, (d) => Number(d.y))).nice().range([h, 0]);
  const n = points.length;
  const mx = d3.mean(points, (d) => Number(d.x));
  const my = d3.mean(points, (d) => Number(d.y));
  const cov = d3.mean(points, (d) => (Number(d.x) - mx) * (Number(d.y) - my));
  const vx = d3.mean(points, (d) => (Number(d.x) - mx) ** 2) || 1;
  const beta = cov / vx;
  const alpha = my - beta * mx;
  g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(alpha)).attr("y2", y(alpha + beta * x.invert(w))).attr("stroke", pal.primary).attr("stroke-width", 2);
  points.forEach((p, i) => {
    g.append("circle").attr("cx", x(Number(p.x))).attr("cy", y(Number(p.y))).attr("r", Math.max(4, Math.sqrt(Number(p.size) || 16) / 2)).attr("fill", pal.series[i % pal.series.length]).attr("opacity", 0.85);
    if (p.label) g.append("text").attr("x", x(Number(p.x)) + 6).attr("y", y(Number(p.y)) - 6).attr("font-size", "10px").attr("fill", pal.ink).attr("font-family", FONT).text(p.label);
  });
  svg.append("text").attr("x", M.left).attr("y", 14).attr("font-size", "11px").attr("fill", pal.muted).attr("font-family", MONO).text(`α ${alpha.toFixed(2)}  β ${beta.toFixed(2)}  n=${n}${unit ? `  ${unit}` : ""}`);
}

export function renderStyleBox(container, data, pal) {
  const points = data.points || [];
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const M = { top: 28, right: 16, bottom: 28, left: 72 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const labelsX = ["Value", "Blend", "Growth"];
  const labelsY = ["Large", "Mid", "Small"];
  const x = d3.scaleBand().domain(labelsX).range([M.left, M.left + w]).padding(0.08);
  const y = d3.scaleBand().domain(labelsY).range([M.top, M.top + h]).padding(0.08);
  labelsY.forEach((ry) => {
    labelsX.forEach((cx) => {
      svg.append("rect").attr("x", x(cx)).attr("y", y(ry)).attr("width", x.bandwidth()).attr("height", y.bandwidth()).attr("fill", pal.grid).attr("stroke", pal.slide);
    });
  });
  points.forEach((p, i) => {
    const cx = x(p.xLabel || labelsX[Math.min(2, Math.max(0, Math.round(Number(p.x))))]);
    const cy = y(p.yLabel || labelsY[Math.min(2, Math.max(0, Math.round(Number(p.y))))]);
    if (cx == null || cy == null) return;
    svg.append("circle").attr("cx", cx + x.bandwidth() / 2).attr("cy", cy + y.bandwidth() / 2).attr("r", Math.max(8, Math.sqrt(Number(p.size) || 40))).attr("fill", pal.series[i % pal.series.length]).attr("opacity", 0.85);
    svg.append("text").attr("x", cx + x.bandwidth() / 2).attr("y", cy + y.bandwidth() / 2 + 4).attr("text-anchor", "middle").attr("font-size", "10px").attr("fill", pal.ink).attr("font-family", FONT).text(p.label);
  });
  labelsX.forEach((l) => svg.append("text").attr("x", x(l) + x.bandwidth() / 2).attr("y", H - 8).attr("text-anchor", "middle").attr("font-size", "11px").attr("fill", pal.muted).attr("font-family", FONT).text(l));
  labelsY.forEach((l) => svg.append("text").attr("x", M.left - 8).attr("y", y(l) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").attr("font-size", "11px").attr("fill", pal.ink).attr("font-family", FONT).text(l));
}

function asTree(data) {
  if (data.children) return data;
  if (data.items) return { name: "root", children: data.items.map((it) => ({ name: it.label || it.name, value: Number(it.value) || 0, children: it.children })) };
  return { name: "root", children: [] };
}

export function renderIcicle(container, data, pal) {
  const root = d3.hierarchy(asTree(data)).sum((d) => d.value || 0);
  if (!root.leaves().length) return;
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  d3.partition().size([H - 8, W - 8]).padding(1)(root);
  const color = d3.scaleOrdinal(pal.series);
  root.descendants().forEach((d, i) => {
    if (!d.depth) return;
    svg.append("rect").attr("x", d.y0 + 4).attr("y", d.x0 + 4).attr("width", Math.max(0, d.y1 - d.y0 - 1)).attr("height", Math.max(0, d.x1 - d.x0 - 1)).attr("fill", color(d.depth + i)).attr("rx", 3);
    if (d.x1 - d.x0 > 16 && d.y1 - d.y0 > 36) {
      svg.append("text").attr("x", d.y0 + 10).attr("y", d.x0 + 16).attr("fill", "#fff").attr("font-size", "11px").attr("font-family", FONT).text(d.data.name || d.data.label);
    }
  });
}

export function renderSunburstReal(container, data, pal) {
  const root = d3.hierarchy(asTree(data)).sum((d) => d.value || 0);
  if (!root.leaves().length) return;
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const r = Math.min(W, H) / 2 - 8;
  const g = svg.append("g").attr("transform", `translate(${W / 2},${H / 2})`);
  d3.partition().size([2 * Math.PI, r])(root);
  const arc = d3.arc().startAngle((d) => d.x0).endAngle((d) => d.x1).innerRadius((d) => d.y0).outerRadius((d) => d.y1);
  const color = d3.scaleOrdinal(pal.series);
  root.descendants().filter((d) => d.depth).forEach((d, i) => {
    g.append("path").attr("d", arc(d)).attr("fill", color(d.data.name || i)).attr("stroke", pal.slide).attr("stroke-width", 1);
  });
}

export function renderStreamReal(container, data, pal) {
  const labs = data.xLabels || data.categories || [];
  const series = data.series || [];
  if (!labs.length || !series.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 20, right: 120, bottom: 32, left: 16 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const keys = series.map((s) => s.name);
  const rows = labs.map((_, i) => Object.fromEntries(series.map((s) => [s.name, Number(s.values?.[i]) || 0])));
  const stacked = d3.stack().keys(keys).offset(d3.stackOffsetWiggle).order(d3.stackOrderInsideOut)(rows);
  const x = d3.scalePoint().domain(labs).range([0, w]);
  const y = d3.scaleLinear().domain([d3.min(stacked, (l) => d3.min(l, (d) => d[0])), d3.max(stacked, (l) => d3.max(l, (d) => d[1]))]).range([h, 0]);
  const area = d3.area().x((_, i) => x(labs[i])).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(d3.curveBasis);
  stacked.forEach((layer, i) => {
    g.append("path").datum(layer).attr("d", area).attr("fill", pal.series[i % pal.series.length]).attr("opacity", 0.88);
    g.append("text").attr("x", w + 8).attr("y", 14 + i * 16).attr("fill", pal.series[i % pal.series.length]).attr("font-size", "11px").attr("font-family", FONT).text(keys[i]);
  });
}

export function renderHexbinReal(container, data, pal) {
  const points = data.points || [];
  if (points.length < 3) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 16, bottom: 32, left: 40 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scaleLinear().domain(d3.extent(points, (d) => Number(d.x))).nice().range([0, w]);
  const y = d3.scaleLinear().domain(d3.extent(points, (d) => Number(d.y))).nice().range([h, 0]);
  const radius = 14;
  const bins = new Map();
  points.forEach((p) => {
    const px = x(Number(p.x));
    const py = y(Number(p.y));
    const q = Math.round(py / (radius * 1.5));
    const r = Math.round((px / (radius * Math.sqrt(3))) - (q % 2 ? 0.5 : 0));
    const key = `${q},${r}`;
    bins.set(key, (bins.get(key) || 0) + 1);
  });
  const max = d3.max(bins.values()) || 1;
  const hex = (cx, cy, rad) => d3.range(6).map((i) => [cx + rad * Math.sin((i * Math.PI) / 3), cy + rad * Math.cos((i * Math.PI) / 3)]).join(" ");
  bins.forEach((count, key) => {
    const [q, r] = key.split(",").map(Number);
    const cy = q * radius * 1.5;
    const cx = (r + (q % 2 ? 0.5 : 0)) * radius * Math.sqrt(3);
    g.append("polygon").attr("points", hex(cx, cy, radius - 1)).attr("fill", pal.primary).attr("opacity", 0.2 + 0.75 * (count / max));
  });
}

export function renderChordReal(container, data, pal) {
  const labels = data.labels || data.rows || [];
  const matrix = data.matrix || data.values || [];
  if (labels.length < 2 || !matrix.length) return;
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const r = Math.min(W, H) / 2 - 48;
  const g = svg.append("g").attr("transform", `translate(${W / 2},${H / 2})`);
  const chord = d3.chord().padAngle(0.04).sortSubgroups(d3.descending)(matrix.map((row) => row.map(Number)));
  const arc = d3.arc().innerRadius(r).outerRadius(r + 12);
  const ribbon = d3.ribbon().radius(r - 2);
  const color = d3.scaleOrdinal(pal.series);
  g.append("g")
    .selectAll("path")
    .data(chord.groups)
    .join("path")
    .attr("d", arc)
    .attr("fill", (_, i) => color(i));
  g.append("g")
    .selectAll("path")
    .data(chord)
    .join("path")
    .attr("d", ribbon)
    .attr("fill", (d) => color(d.source.index))
    .attr("opacity", 0.7);
  chord.groups.forEach((d, i) => {
    const a = (d.startAngle + d.endAngle) / 2;
    g.append("text")
      .attr("transform", `rotate(${(a * 180) / Math.PI - 90}) translate(${r + 20}) ${a > Math.PI ? "rotate(180)" : ""}`)
      .attr("text-anchor", a > Math.PI ? "end" : "start")
      .attr("font-size", "11px")
      .attr("fill", pal.ink)
      .attr("font-family", FONT)
      .text(labels[i]);
  });
}

export function renderViolinReal(container, data, pal, unit) {
  const groups = data.groups || [];
  if (!groups.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 16, bottom: 36, left: 48 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const all = groups.flatMap((gr) => (gr.values || []).map(Number));
  const y = d3.scaleLinear().domain(d3.extent(all)).nice().range([h, 0]);
  const x = d3.scaleBand().domain(groups.map((d) => d.label)).range([0, w]).padding(0.35);
  groups.forEach((gr, i) => {
    const vals = (gr.values || []).map(Number).sort(d3.ascending);
    const n = vals.length || 1;
    const sd = d3.deviation(vals) || 1;
    const bw = 1.06 * sd * n ** -0.2;
    const kde = (t) => d3.mean(vals, (v) => Math.exp(-0.5 * ((t - v) / bw) ** 2) / (bw * Math.sqrt(2 * Math.PI)));
    const ticks = y.ticks(40);
    const dens = ticks.map((t) => [t, kde(t)]);
    const maxd = d3.max(dens, (d) => d[1]) || 1;
    const xw = d3.scaleLinear().domain([0, maxd]).range([0, x.bandwidth() / 2]);
    const area = d3.area().x0((d) => x(gr.label) + x.bandwidth() / 2 - xw(d[1])).x1((d) => x(gr.label) + x.bandwidth() / 2 + xw(d[1])).y((d) => y(d[0])).curve(d3.curveBasis);
    g.append("path").datum(dens).attr("d", area).attr("fill", pal.series[i % pal.series.length]).attr("opacity", 0.45).attr("stroke", pal.series[i % pal.series.length]);
    g.append("line").attr("x1", x(gr.label) + x.bandwidth() / 2).attr("x2", x(gr.label) + x.bandwidth() / 2).attr("y1", y(d3.quantile(vals, 0.25))).attr("y2", y(d3.quantile(vals, 0.75))).attr("stroke", pal.ink).attr("stroke-width", 3);
  });
  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => fmt(d, unit)).tickSize(0).tickPadding(6)).call((s) => s.select(".domain").remove()).selectAll("text").attr("fill", pal.muted).attr("font-family", MONO).attr("font-size", "10px");
  groups.forEach((gr) => g.append("text").attr("x", x(gr.label) + x.bandwidth() / 2).attr("y", h + 18).attr("text-anchor", "middle").attr("font-size", "11px").attr("fill", pal.ink).attr("font-family", FONT).text(gr.label));
}

export function renderLorenz(container, data, pal) {
  const items = [...(data.items || [])].sort((a, b) => Number(a.value) - Number(b.value));
  if (!items.length) return;
  const total = d3.sum(items, (d) => Number(d.value)) || 1;
  let acc = 0;
  const pts = [{ x: 0, y: 0 }, ...items.map((it, i) => {
    acc += Number(it.value);
    return { x: (i + 1) / items.length, y: acc / total, label: it.label };
  })];
  const { W, H } = sizeOf(container);
  const M = { top: 20, right: 20, bottom: 36, left: 44 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scaleLinear().domain([0, 1]).range([0, w]);
  const y = d3.scaleLinear().domain([0, 1]).range([h, 0]);
  g.append("line").attr("x1", 0).attr("y1", h).attr("x2", w).attr("y2", 0).attr("stroke", pal.neutral).attr("stroke-dasharray", "4 3");
  g.append("path").datum(pts).attr("d", d3.line().x((d) => x(d.x)).y((d) => y(d.y)).curve(d3.curveMonotoneX)).attr("fill", "none").attr("stroke", pal.primary).attr("stroke-width", 2.4);
  g.append("path").datum(pts).attr("d", d3.area().x((d) => x(d.x)).y0(h).y1((d) => y(d.y)).curve(d3.curveMonotoneX)).attr("fill", pal.primary).attr("opacity", 0.12);
}

export function renderCandlesVolume(container, data, pal) {
  const items = data.items || [];
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 12, right: 16, bottom: 28, left: 48 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const hPrice = (H - M.top - M.bottom) * 0.68;
  const hVol = (H - M.top - M.bottom) * 0.28;
  const x = d3.scaleBand().domain(items.map((d) => d.label)).range([0, w]).padding(0.3);
  const y = d3.scaleLinear().domain([d3.min(items, (d) => Number(d.l)), d3.max(items, (d) => Number(d.h))]).nice().range([hPrice, 0]);
  const yv = d3.scaleLinear().domain([0, d3.max(items, (d) => Number(d.volume || d.v || 0)) || 1]).range([hPrice + 8 + hVol, hPrice + 8]);
  items.forEach((it) => {
    const o = Number(it.o);
    const c = Number(it.c);
    const col = c >= o ? pal.positive : pal.negative;
    const cx = x(it.label) + x.bandwidth() / 2;
    g.append("line").attr("x1", cx).attr("x2", cx).attr("y1", y(Number(it.h))).attr("y2", y(Number(it.l))).attr("stroke", col);
    g.append("rect").attr("x", x(it.label)).attr("width", x.bandwidth()).attr("y", y(Math.max(o, c))).attr("height", Math.max(2, Math.abs(y(o) - y(c)))).attr("fill", col);
    g.append("rect").attr("x", x(it.label)).attr("width", x.bandwidth()).attr("y", yv(Number(it.volume || it.v || 0))).attr("height", Math.max(1, yv(0) - yv(Number(it.volume || it.v || 0)))).attr("fill", col).attr("opacity", 0.4);
  });
}

export function renderPnlCalendar(container, data, pal) {
  const days = data.days || data.items || [];
  if (!days.length) return;
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const cols = 7;
  const rows = Math.ceil(days.length / cols);
  const cellW = (W - 24) / cols;
  const cellH = (H - 36) / rows;
  const max = d3.max(days, (d) => Math.abs(Number(d.value))) || 1;
  days.forEach((d, i) => {
    const v = Number(d.value);
    const c = i % cols;
    const r = Math.floor(i / cols);
    svg.append("rect")
      .attr("x", 12 + c * cellW)
      .attr("y", 24 + r * cellH)
      .attr("width", cellW - 4)
      .attr("height", cellH - 4)
      .attr("rx", 4)
      .attr("fill", v >= 0 ? pal.positive : pal.negative)
      .attr("opacity", 0.15 + 0.8 * (Math.abs(v) / max));
    svg.append("text").attr("x", 12 + c * cellW + 8).attr("y", 24 + r * cellH + 16).attr("font-size", "10px").attr("fill", pal.ink).attr("font-family", MONO).text(d.label || i + 1);
  });
}

export function renderLadder(container, data, pal, unit) {
  const items = data.items || [];
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 48, bottom: 16, left: 88 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const y = d3.scaleBand().domain(items.map((d) => d.label)).range([0, h]).padding(0.25);
  const max = d3.max(items, (d) => Number(d.value)) || 1;
  const x = d3.scaleLinear().domain([0, max * 1.1]).range([0, w]);
  items.forEach((it, i) => {
    g.append("rect").attr("y", y(it.label)).attr("height", y.bandwidth()).attr("width", x(Number(it.value))).attr("fill", pal.series[i % pal.series.length]);
    g.append("text").attr("x", -8).attr("y", y(it.label) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").attr("font-size", "11px").attr("fill", pal.ink).attr("font-family", FONT).text(it.label);
    g.append("text").attr("x", x(Number(it.value)) + 6).attr("y", y(it.label) + y.bandwidth() / 2 + 4).attr("font-size", "11px").attr("fill", pal.muted).attr("font-family", MONO).text(fmt(it.value, unit));
  });
}

export function renderMosaic(container, data, pal) {
  const cats = data.categories || [];
  if (!cats.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 12, right: 16, bottom: 28, left: 16 };
  const svg = svgRoot(container, W, H);
  const totalW = d3.sum(cats, (c) => Number(c.width || d3.sum(c.segments || [], (s) => Number(s.value))) || 1);
  const x = d3.scaleLinear().domain([0, totalW]).range([M.left, W - M.right]);
  let x0 = 0;
  cats.forEach((c) => {
    const width = Number(c.width || d3.sum(c.segments || [], (s) => Number(s.value))) || 1;
    const segs = c.segments || [];
    const tot = d3.sum(segs, (s) => Number(s.value)) || 1;
    let y0 = M.top;
    const h = H - M.top - M.bottom;
    segs.forEach((s, i) => {
      const hh = (Number(s.value) / tot) * h;
      svg.append("rect").attr("x", x(x0)).attr("y", y0).attr("width", x(x0 + width) - x(x0) - 2).attr("height", hh - 2).attr("fill", pal.series[i % pal.series.length]);
      if (hh > 18) svg.append("text").attr("x", x(x0) + 8).attr("y", y0 + 16).attr("fill", "#fff").attr("font-size", "11px").attr("font-family", FONT).text(s.name);
      y0 += hh;
    });
    svg.append("text").attr("x", (x(x0) + x(x0 + width)) / 2).attr("y", H - 8).attr("text-anchor", "middle").attr("font-size", "11px").attr("fill", pal.ink).attr("font-family", FONT).text(c.label);
    x0 += width;
  });
}

export const COMPLEX_RENDERERS = {
  qq_plot: renderQq,
  horizon: renderHorizon,
  vol_surface: renderVolSurface,
  order_book: renderOrderBook,
  parallel_coords: renderParallel,
  alpha_beta: renderAlphaBeta,
  style_box: renderStyleBox,
  icicle: renderIcicle,
  sunburst: renderSunburstReal,
  streamgraph: renderStreamReal,
  hexbin: renderHexbinReal,
  chord: renderChordReal,
  violin_returns: renderViolinReal,
  lorenz: renderLorenz,
  candles_volume: renderCandlesVolume,
  pnl_calendar: renderPnlCalendar,
  liquidity_ladder: renderLadder,
  mosaic: renderMosaic,
};
