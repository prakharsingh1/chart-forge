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

export function renderLollipop(container, data, pal, unit) {
  const items = [...(data.items || [])].sort((a, b) => Number(b.value) - Number(a.value));
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 12, right: 64, bottom: 12, left: 120 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const y = d3.scaleBand().domain(items.map((d) => d.label)).range([0, h]).padding(0.35);
  const x = d3.scaleLinear().domain([0, d3.max(items, (d) => Number(d.value)) * 1.12]).range([0, w]);
  g.selectAll("line").data(items).join("line").attr("x1", 0).attr("x2", (d) => x(d.value)).attr("y1", (d) => y(d.label) + y.bandwidth() / 2).attr("y2", (d) => y(d.label) + y.bandwidth() / 2).attr("stroke", pal.primary).attr("stroke-width", 2);
  g.selectAll("circle").data(items).join("circle").attr("cx", (d) => x(d.value)).attr("cy", (d) => y(d.label) + y.bandwidth() / 2).attr("r", 7).attr("fill", pal.accent || pal.primary);
  g.selectAll(".v").data(items).join("text").attr("x", (d) => x(d.value) + 12).attr("y", (d) => y(d.label) + y.bandwidth() / 2 + 4).attr("font-family", MONO).attr("font-size", "11px").attr("fill", pal.ink).text((d) => fmt(d.value, unit));
  g.append("g").call(d3.axisLeft(y).tickSize(0).tickPadding(8)).call((s) => s.select(".domain").remove()).call((s) => s.selectAll("text").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink));
}

export function renderDumbbell(container, data, pal) {
  const cats = data.categories || [];
  const a = data.start || data.left?.values || [];
  const b = data.end || data.right?.values || [];
  if (!cats.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 28, right: 40, bottom: 16, left: 110 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const y = d3.scaleBand().domain(cats).range([0, h]).padding(0.3);
  const max = d3.max([...a, ...b].map(Number)) * 1.15 || 1;
  const x = d3.scaleLinear().domain([0, max]).range([0, w]);
  cats.forEach((c, i) => {
    const y0 = y(c) + y.bandwidth() / 2;
    g.append("line").attr("x1", x(a[i] || 0)).attr("x2", x(b[i] || 0)).attr("y1", y0).attr("y2", y0).attr("stroke", pal.neutral).attr("stroke-width", 3);
    g.append("circle").attr("cx", x(a[i] || 0)).attr("cy", y0).attr("r", 7).attr("fill", pal.secondary);
    g.append("circle").attr("cx", x(b[i] || 0)).attr("cy", y0).attr("r", 7).attr("fill", pal.primary);
  });
  g.append("g").call(d3.axisLeft(y).tickSize(0).tickPadding(8)).call((s) => s.select(".domain").remove()).call((s) => s.selectAll("text").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink));
}

export function renderBullet(container, data, pal) {
  const items = data.items || [];
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const M = { top: 16, right: 40, bottom: 16, left: 110 };
  const y = d3.scaleBand().domain(items.map((d) => d.label)).range([M.top, H - M.bottom]).padding(0.35);
  const max = d3.max(items, (d) => Math.max(Number(d.target) || 0, Number(d.value) || 0)) * 1.2 || 1;
  const x = d3.scaleLinear().domain([0, max]).range([M.left, W - M.right]);
  items.forEach((it) => {
    svg.append("rect").attr("x", M.left).attr("y", y(it.label)).attr("width", x(it.target || 0) - M.left).attr("height", y.bandwidth()).attr("fill", pal.grid);
    svg.append("rect").attr("x", M.left).attr("y", y(it.label) + y.bandwidth() * 0.28).attr("width", x(it.value || 0) - M.left).attr("height", y.bandwidth() * 0.44).attr("fill", pal.primary);
  });
  svg.append("g").attr("transform", `translate(${M.left},0)`).call(d3.axisLeft(y).tickSize(0)).call((s) => s.select(".domain").remove()).call((s) => s.selectAll("text").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink));
}

export function renderTreemap(container, data, pal, unit) {
  const items = data.items || [];
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const root = d3.hierarchy({ children: items }).sum((d) => Number(d.value) || 0);
  d3.treemap().size([W - 8, H - 8]).padding(3)(root);
  const color = d3.scaleOrdinal().range(pal.series);
  root.leaves().forEach((n, i) => {
    svg.append("rect").attr("x", n.x0 + 4).attr("y", n.y0 + 4).attr("width", n.x1 - n.x0).attr("height", n.y1 - n.y0).attr("rx", 6).attr("fill", color(i));
    if (n.x1 - n.x0 > 48 && n.y1 - n.y0 > 28) {
      svg.append("text").attr("x", n.x0 + 12).attr("y", n.y0 + 22).attr("fill", "#fff").attr("font-family", FONT).attr("font-size", "12px").attr("font-weight", 700).text(n.data.label);
      svg.append("text").attr("x", n.x0 + 12).attr("y", n.y0 + 40).attr("fill", "#fff").attr("font-family", MONO).attr("font-size", "11px").text(fmt(n.data.value, unit));
    }
  });
}

export function renderWaffle(container, data, pal) {
  const items = data.items || [];
  const total = d3.sum(items, (d) => Number(d.value)) || 1;
  const cells = [];
  items.forEach((it, i) => {
    const n = Math.round((Number(it.value) / total) * 100);
    for (let k = 0; k < n; k++) cells.push(i);
  });
  while (cells.length < 100) cells.push(items.length - 1);
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const size = Math.min((W - 160) / 10, (H - 24) / 10);
  cells.slice(0, 100).forEach((si, i) => {
    const c = i % 10;
    const r = Math.floor(i / 10);
    svg.append("rect").attr("x", 16 + c * (size + 3)).attr("y", 12 + r * (size + 3)).attr("width", size).attr("height", size).attr("rx", 3).attr("fill", pal.series[si % pal.series.length]);
  });
  items.forEach((it, i) => {
    svg.append("rect").attr("x", W - 140).attr("y", 20 + i * 22).attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", pal.series[i % pal.series.length]);
    svg.append("text").attr("x", W - 124).attr("y", 30 + i * 22).attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink).text(it.label);
  });
}

export function renderPacked(container, data, pal) {
  const items = data.items || [];
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const root = d3.pack().size([W, H]).padding(4)(d3.hierarchy({ children: items }).sum((d) => Number(d.value) || 0));
  const color = d3.scaleOrdinal().range(pal.series);
  root.leaves().forEach((n, i) => {
    svg.append("circle").attr("cx", n.x).attr("cy", n.y).attr("r", n.r).attr("fill", color(i)).attr("opacity", 0.9);
    if (n.r > 18) svg.append("text").attr("x", n.x).attr("y", n.y + 4).attr("text-anchor", "middle").attr("fill", "#fff").attr("font-family", FONT).attr("font-size", "11px").text(n.data.label);
  });
}

export function renderNightingale(container, data, pal) {
  const items = data.items || [];
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${W / 2},${H / 2})`);
  const r = Math.min(W, H) / 2 - 36;
  const max = d3.max(items, (d) => Number(d.value)) || 1;
  const angle = d3.scaleBand().domain(items.map((d) => d.label)).range([0, Math.PI * 2]).padding(0.04);
  const rad = d3.scaleLinear().domain([0, max]).range([20, r]);
  items.forEach((it, i) => {
    const start = angle(it.label);
    const arc = d3.arc().innerRadius(12).outerRadius(rad(it.value)).startAngle(start).endAngle(start + angle.bandwidth());
    g.append("path").attr("d", arc).attr("fill", pal.series[i % pal.series.length]);
  });
}

export function renderHeatmap(container, data, pal) {
  const rows = data.rows || data.labels || [];
  const values = data.values || [];
  const cols = data.cols || data.columns || (Array.isArray(values[0]) ? rows : []);
  if (!rows.length || !cols.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 36, right: 16, bottom: 16, left: 72 };
  const svg = svgRoot(container, W, H);
  const x = d3.scaleBand().domain(cols).range([M.left, W - M.right]).padding(0.08);
  const y = d3.scaleBand().domain(rows).range([M.top, H - M.bottom]).padding(0.08);
  const flat = values.flat().map(Number);
  const color = d3.scaleLinear().domain([d3.min(flat), d3.max(flat)]).range([pal.grid, pal.primary]);
  rows.forEach((r, ri) => {
    cols.forEach((c, ci) => {
      const v = Number(values[ri]?.[ci]) || 0;
      svg.append("rect").attr("x", x(c)).attr("y", y(r)).attr("width", x.bandwidth()).attr("height", y.bandwidth()).attr("rx", 4).attr("fill", color(v));
      svg.append("text").attr("x", x(c) + x.bandwidth() / 2).attr("y", y(r) + y.bandwidth() / 2 + 4).attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "10px").attr("fill", v > (d3.max(flat) || 1) * 0.55 ? "#fff" : pal.ink).text(v);
    });
  });
  cols.forEach((c) => svg.append("text").attr("x", x(c) + x.bandwidth() / 2).attr("y", M.top - 10).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.muted).text(c));
  rows.forEach((r) => svg.append("text").attr("x", M.left - 8).attr("y", y(r) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(r));
}

export function renderRadar(container, data, pal) {
  const cats = data.categories || [];
  const series = data.series || [];
  if (!cats.length) return;
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const cx = W / 2 - 40;
  const cy = H / 2;
  const r = Math.min(W, H) / 2 - 48;
  const max = d3.max(series.flatMap((s) => s.values)) || 1;
  const angle = (i) => (Math.PI * 2 * i) / cats.length - Math.PI / 2;
  cats.forEach((_, i) => {
    svg.append("line").attr("x1", cx).attr("y1", cy).attr("x2", cx + Math.cos(angle(i)) * r).attr("y2", cy + Math.sin(angle(i)) * r).attr("stroke", pal.grid);
    svg.append("text").attr("x", cx + Math.cos(angle(i)) * (r + 16)).attr("y", cy + Math.sin(angle(i)) * (r + 16)).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(cats[i]);
  });
  series.forEach((s, si) => {
    const pts = s.values.map((v, i) => [cx + Math.cos(angle(i)) * r * (v / max), cy + Math.sin(angle(i)) * r * (v / max)]);
    svg.append("polygon").attr("points", pts.map((p) => p.join(",")).join(" ")).attr("fill", pal.series[si % pal.series.length]).attr("opacity", 0.25).attr("stroke", pal.series[si % pal.series.length]).attr("stroke-width", 2);
  });
}

export function renderSankeyLite(container, data, pal) {
  const links = data.links || [];
  const names = [...new Set(links.flatMap((l) => [l.source, l.target]))];
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const left = names.filter((n) => links.some((l) => l.source === n));
  const right = names.filter((n) => links.some((l) => l.target === n));
  const yL = d3.scaleBand().domain(left).range([24, H - 24]).padding(0.3);
  const yR = d3.scaleBand().domain(right).range([24, H - 24]).padding(0.3);
  const max = d3.max(links, (l) => Number(l.value)) || 1;
  links.forEach((l, i) => {
    const y1 = yL(l.source) + yL.bandwidth() / 2;
    const y2 = yR(l.target) + yR.bandwidth() / 2;
    const path = `M 120 ${y1} C ${W / 2} ${y1}, ${W / 2} ${y2}, ${W - 140} ${y2}`;
    svg.append("path").attr("d", path).attr("fill", "none").attr("stroke", pal.series[i % pal.series.length]).attr("stroke-width", Math.max(4, (l.value / max) * 28)).attr("opacity", 0.45);
  });
  left.forEach((n) => svg.append("text").attr("x", 16).attr("y", yL(n) + yL.bandwidth() / 2 + 4).attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink).text(n));
  right.forEach((n) => svg.append("text").attr("x", W - 16).attr("y", yR(n) + yR.bandwidth() / 2 + 4).attr("text-anchor", "end").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink).text(n));
}

export function renderGauge(container, data, pal) {
  const v = Number(data.value) || 0;
  const max = Number(data.max) || 100;
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const cx = W / 2;
  const cy = H / 2 + 20;
  const r = Math.min(W, H) / 2 - 30;
  const arc = d3.arc().innerRadius(r - 22).outerRadius(r).startAngle(-Math.PI * 0.75);
  svg.append("g").attr("transform", `translate(${cx},${cy})`).append("path").attr("d", arc.endAngle(Math.PI * 0.75)()).attr("fill", pal.grid);
  svg.append("g").attr("transform", `translate(${cx},${cy})`).append("path").attr("d", arc.endAngle(-Math.PI * 0.75 + Math.PI * 1.5 * Math.min(1, v / max))()).attr("fill", pal.primary);
  svg.append("text").attr("x", cx).attr("y", cy).attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "36px").attr("font-weight", 700).attr("fill", pal.ink).text(v);
  svg.append("text").attr("x", cx).attr("y", cy + 28).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "13px").attr("fill", pal.muted).text(`of ${max}${data.target ? ` · target ${data.target}` : ""}`);
}

export function renderKpis(container, data, pal) {
  const items = (data.items || data.kpis || []).filter((it) => it && (it.label || it.name));
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const n = items.length;
  const cardW = (W - 24 - (n - 1) * 12) / n;
  items.forEach((it, i) => {
    const x = 12 + i * (cardW + 12);
    const val = it.value == null || it.value === "" ? "—" : String(it.value);
    svg.append("rect").attr("x", x).attr("y", H / 2 - 54).attr("width", cardW).attr("height", 108).attr("rx", 16).attr("fill", pal.grid);
    svg.append("text").attr("x", x + 18).attr("y", H / 2 - 20).attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.muted).text(it.label || it.name);
    svg.append("text").attr("x", x + 18).attr("y", H / 2 + 18).attr("font-family", MONO).attr("font-size", val.length > 8 ? "18px" : "28px").attr("font-weight", 700).attr("fill", pal.ink).text(val);
    if (it.delta) svg.append("text").attr("x", x + 18).attr("y", H / 2 + 40).attr("font-family", FONT).attr("font-size", "12px").attr("fill", String(it.delta).startsWith("-") ? pal.negative : pal.positive).text(it.delta);
  });
}

export function renderProgressRings(container, data, pal) {
  const items = data.items || [];
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const n = items.length;
  items.forEach((it, i) => {
    const cx = (W / (n + 1)) * (i + 1);
    const cy = H / 2;
    const r = 48;
    const pct = Math.min(1, Number(it.value) / 100);
    const arc = d3.arc().innerRadius(r - 10).outerRadius(r).startAngle(0);
    svg.append("g").attr("transform", `translate(${cx},${cy})`).append("path").attr("d", arc.endAngle(Math.PI * 2)()).attr("fill", pal.grid);
    svg.append("g").attr("transform", `translate(${cx},${cy})`).append("path").attr("d", arc.endAngle(Math.PI * 2 * pct)()).attr("fill", pal.series[i % pal.series.length]);
    svg.append("text").attr("x", cx).attr("y", cy + 4).attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "14px").attr("fill", pal.ink).text(`${Math.round(pct * 100)}%`);
    svg.append("text").attr("x", cx).attr("y", cy + r + 22).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.muted).text(it.label);
  });
}

export function renderBoxplot(container, data, pal) {
  const items = data.items || [];
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 20, bottom: 40, left: 40 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const x = d3.scaleBand().domain(items.map((d) => d.label)).range([0, w]).padding(0.4);
  const y = d3.scaleLinear().domain([d3.min(items, (d) => d.min) * 0.9, d3.max(items, (d) => d.max) * 1.1]).range([h, 0]);
  items.forEach((it) => {
    const cx = x(it.label) + x.bandwidth() / 2;
    g.append("line").attr("x1", cx).attr("x2", cx).attr("y1", y(it.min)).attr("y2", y(it.max)).attr("stroke", pal.ink);
    g.append("rect").attr("x", x(it.label)).attr("width", x.bandwidth()).attr("y", y(it.q3)).attr("height", Math.max(2, y(it.q1) - y(it.q3))).attr("fill", pal.primary).attr("opacity", 0.35).attr("stroke", pal.primary);
    g.append("line").attr("x1", x(it.label)).attr("x2", x(it.label) + x.bandwidth()).attr("y1", y(it.med)).attr("y2", y(it.med)).attr("stroke", pal.ink).attr("stroke-width", 2);
  });
}

export function renderSlope(container, data, pal, unit) {
  const series = data.series || [];
  const labels = data.categories || ["Now", "Then"];
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const x0 = 140;
  const x1 = W - 140;
  const max = d3.max(series.flatMap((s) => s.values)) || 1;
  const y = d3.scaleLinear().domain([0, max * 1.1]).range([H - 40, 30]);
  svg.append("text").attr("x", x0).attr("y", 18).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.muted).text(labels[0]);
  svg.append("text").attr("x", x1).attr("y", 18).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.muted).text(labels[1] || "Next");
  series.forEach((s, i) => {
    const c = pal.series[i % pal.series.length];
    svg.append("line").attr("x1", x0).attr("x2", x1).attr("y1", y(s.values[0])).attr("y2", y(s.values[1])).attr("stroke", c).attr("stroke-width", 2.4);
    svg.append("circle").attr("cx", x0).attr("cy", y(s.values[0])).attr("r", 5).attr("fill", c);
    svg.append("circle").attr("cx", x1).attr("cy", y(s.values[1])).attr("r", 5).attr("fill", c);
    svg.append("text").attr("x", x0 - 10).attr("y", y(s.values[0]) + 4).attr("text-anchor", "end").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(`${s.name} ${fmt(s.values[0], unit)}`);
    svg.append("text").attr("x", x1 + 10).attr("y", y(s.values[1]) + 4).attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(fmt(s.values[1], unit));
  });
}

export function renderPareto(container, data, pal) {
  const items = [...(data.items || [])].sort((a, b) => Number(b.value) - Number(a.value));
  const { W, H } = sizeOf(container);
  const M = { top: 20, right: 48, bottom: 48, left: 48 };
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const total = d3.sum(items, (d) => Number(d.value)) || 1;
  let acc = 0;
  const rows = items.map((d) => {
    acc += Number(d.value);
    return { ...d, cum: (acc / total) * 100 };
  });
  const x = d3.scaleBand().domain(rows.map((d) => d.label)).range([0, w]).padding(0.3);
  const y = d3.scaleLinear().domain([0, d3.max(rows, (d) => d.value) * 1.15]).range([h, 0]);
  const yR = d3.scaleLinear().domain([0, 100]).range([h, 0]);
  rows.forEach((d) => {
    g.append("rect").attr("x", x(d.label)).attr("y", y(d.value)).attr("width", x.bandwidth()).attr("height", h - y(d.value)).attr("fill", pal.primary);
  });
  const line = d3.line().x((d) => x(d.label) + x.bandwidth() / 2).y((d) => yR(d.cum));
  g.append("path").datum(rows).attr("d", line).attr("fill", "none").attr("stroke", pal.negative).attr("stroke-width", 2.2);
}

export function renderWinLoss(container, data, pal) {
  const items = data.items || [];
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const x = d3.scaleBand().domain(items.map((d) => d.label)).range([20, W - 20]).padding(0.35);
  const mid = H / 2;
  items.forEach((it) => {
    const v = Number(it.value);
    const h = 40;
    svg.append("rect").attr("x", x(it.label)).attr("width", x.bandwidth()).attr("y", v >= 0 ? mid - h : mid).attr("height", h).attr("rx", 3).attr("fill", v >= 0 ? pal.positive : pal.negative);
  });
}

export function renderBeeswarm(container, data, pal) {
  const items = data.items || [];
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const x = d3.scaleLinear().domain([0, d3.max(items, (d) => Number(d.value)) * 1.1]).range([40, W - 40]);
  items.forEach((it, i) => {
    svg.append("circle").attr("cx", x(it.value)).attr("cy", H / 2 + ((i % 7) - 3) * 14).attr("r", 8).attr("fill", pal.series[i % pal.series.length]).attr("opacity", 0.85);
  });
}

export const EXTRA_RENDERERS = {
  lollipop: renderLollipop,
  dumbbell: renderDumbbell,
  range_bar: renderDumbbell,
  bullet: renderBullet,
  pareto: renderPareto,
  win_loss: renderWinLoss,
  slope: renderSlope,
  treemap: renderTreemap,
  sunburst: renderNightingale,
  waffle: renderWaffle,
  packed_circles: renderPacked,
  nightingale: renderNightingale,
  polar_area: renderNightingale,
  beeswarm: renderBeeswarm,
  boxplot: renderBoxplot,
  heatmap: renderHeatmap,
  cohort: renderHeatmap,
  calendar_heatmap: renderHeatmap,
  radar: renderRadar,
  sankey: renderSankeyLite,
  chord: renderSankeyLite,
  alluvial: renderSankeyLite,
  gauge: renderGauge,
  kpi_cards: renderKpis,
  progress_ring: renderProgressRings,
};
