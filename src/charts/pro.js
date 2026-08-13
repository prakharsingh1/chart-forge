import * as d3 from "d3";
import { FONT, MONO } from "../theme.js";
import { fmt, signed } from "../lib/format.js";

function sizeOf(el) {
  return { W: Math.max(el.clientWidth || 0, 640), H: Math.max(el.clientHeight || 0, 360) };
}
function svgRoot(container, W, H) {
  d3.select(container).selectAll("*").remove();
  return d3
    .select(container)
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
}

function hatchPattern(svg, id, color) {
  const p = svg.append("defs").append("pattern").attr("id", id).attr("patternUnits", "userSpaceOnUse").attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)");
  p.append("rect").attr("width", 6).attr("height", 6).attr("fill", color).attr("opacity", 0.18);
  p.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6).attr("stroke", color).attr("stroke-width", 1.4);
}

function isHatch(item) {
  const t = String(item.type || item.pattern || "").toLowerCase();
  return t === "hatch" || t === "delta" || t === "buffer" || t === "target" || item.hatch;
}

export function renderSankeyPro(container, data, pal, unit) {
  const linksIn = (data.links || []).map((l) => ({
    source: String(l.source ?? l.from ?? ""),
    target: String(l.target ?? l.to ?? ""),
    value: Number(l.value) || 0,
  })).filter((l) => l.source && l.target && l.value > 0);
  if (!linksIn.length) return;

  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const nodes = new Map();
  const ensure = (name) => {
    if (!nodes.has(name)) nodes.set(name, { name, sourceLinks: [], targetLinks: [], value: 0, col: 0 });
    return nodes.get(name);
  };
  const links = linksIn.map((l) => {
    const s = ensure(l.source);
    const t = ensure(l.target);
    const lk = { source: s, target: t, value: l.value };
    s.sourceLinks.push(lk);
    t.targetLinks.push(lk);
    return lk;
  });
  const list = [...nodes.values()];
  list.forEach((n) => {
    n.value = Math.max(d3.sum(n.sourceLinks, (l) => l.value), d3.sum(n.targetLinks, (l) => l.value), 1);
  });
  for (let i = 0; i < 16; i++) {
    list.forEach((n) => {
      if (!n.targetLinks.length) n.col = 0;
      else n.col = 1 + d3.max(n.targetLinks, (l) => l.source.col);
    });
  }
  const maxCol = Math.max(1, d3.max(list, (n) => n.col) || 1);
  const padL = 168;
  const padR = 168;
  const padT = 12;
  const padB = 12;
  const nodeW = 12;
  const innerH = H - padT - padB;
  const colX = (c) => padL + (c / maxCol) * (W - padL - padR - nodeW);

  for (let c = 0; c <= maxCol; c++) {
    const col = list.filter((n) => n.col === c).sort((a, b) => b.value - a.value);
    const gap = Math.min(14, innerH / Math.max(col.length * 4, 1));
    const totalV = d3.sum(col, (n) => n.value) || 1;
    const usable = Math.max(40, innerH - gap * Math.max(0, col.length - 1));
    let y = padT;
    col.forEach((n) => {
      n.h = Math.max(10, (n.value / totalV) * usable);
      n.y = y;
      n.x = colX(c);
      n.w = nodeW;
      y += n.h + gap;
    });
  }

  list.forEach((n) => {
    n.sourceLinks.sort((a, b) => a.target.y - b.target.y);
    n.targetLinks.sort((a, b) => a.source.y - b.source.y);
    let sy = n.y;
    n.sourceLinks.forEach((l) => {
      l.sy = sy;
      l.sh = (l.value / n.value) * n.h;
      sy += l.sh;
    });
    let ty = n.y;
    n.targetLinks.forEach((l) => {
      l.ty = ty;
      l.th = (l.value / n.value) * n.h;
      ty += l.th;
    });
  });

  const color = d3.scaleOrdinal().domain(list.map((n) => n.name)).range(pal.series);
  const defs = svg.append("defs");
  links.forEach((l, i) => {
    const id = `sk-${i}`;
    const g = defs.append("linearGradient").attr("id", id).attr("gradientUnits", "userSpaceOnUse").attr("x1", l.source.x + l.source.w).attr("x2", l.target.x);
    g.append("stop").attr("offset", "0%").attr("stop-color", color(l.source.name)).attr("stop-opacity", 0.72);
    g.append("stop").attr("offset", "100%").attr("stop-color", color(l.target.name)).attr("stop-opacity", 0.55);
    const x0 = l.source.x + l.source.w;
    const x1 = l.target.x;
    const xm = (x0 + x1) / 2;
    const y0 = l.sy;
    const y1 = l.ty;
    const h0 = Math.max(2, l.sh);
    const h1 = Math.max(2, l.th);
    const d = `M${x0},${y0} C${xm},${y0} ${xm},${y1} ${x1},${y1} L${x1},${y1 + h1} C${xm},${y1 + h1} ${xm},${y0 + h0} ${x0},${y0 + h0} Z`;
    svg.append("path").attr("d", d).attr("fill", `url(#${id})`).attr("opacity", 0.9);
  });

  list.forEach((n) => {
    svg.append("rect").attr("x", n.x).attr("y", n.y).attr("width", n.w).attr("height", n.h).attr("fill", color(n.name));
    const left = n.col === 0;
    const label = `${n.name}  ${fmt(n.value, unit)}`;
    svg
      .append("text")
      .attr("x", left ? n.x - 8 : n.x + n.w + 8)
      .attr("y", n.y + n.h / 2 + 4)
      .attr("text-anchor", left ? "end" : "start")
      .attr("font-family", FONT)
      .attr("font-size", "12px")
      .attr("font-weight", 650)
      .attr("fill", pal.ink)
      .text(label);
  });
}

function linreg(pts) {
  const n = pts.length;
  const mx = d3.mean(pts, (p) => p.x);
  const my = d3.mean(pts, (p) => p.y);
  let num = 0;
  let den = 0;
  pts.forEach((p) => {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  });
  const b = den ? num / den : 0;
  return { a: my - b * mx, b, mx, my };
}

export function renderScatterPro(container, data, pal, _unit, opts = {}) {
  const points = (data.points || []).map((p) => ({
    label: p.label || "",
    x: Number(p.x),
    y: Number(p.y),
    size: Number(p.size) || 0,
  })).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (!points.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 28, right: 108, bottom: 48, left: 56 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const x0 = d3.min(points, (p) => p.x);
  const x1 = d3.max(points, (p) => p.x);
  const y0 = Math.min(0, d3.min(points, (p) => p.y));
  const y1 = d3.max(points, (p) => p.y);
  const x = d3.scaleLinear().domain([Math.min(0, x0), x1 * 1.06 || 1]).nice().range([0, w]);
  const y = d3.scaleLinear().domain([y0, y1 * 1.12 || 1]).nice().range([h, 0]);
  const sizes = points.map((p) => p.size).filter((s) => s > 0);
  const r = sizes.length
    ? d3.scaleSqrt().domain([0, d3.max(sizes)]).range([5, 28])
    : () => 6.5;

  x.ticks(8).forEach((t) => {
    g.append("line").attr("x1", x(t)).attr("x2", x(t)).attr("y1", 0).attr("y2", h).attr("stroke", pal.grid);
  });
  y.ticks(5).forEach((t) => {
    g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(t)).attr("y2", y(t)).attr("stroke", pal.grid);
  });

  const band = data.band || {};
  const bx0 = band.x0 != null ? Number(band.x0) : d3.quantile(points.map((p) => p.x).sort(d3.ascending), 0.25);
  const bx1 = band.x1 != null ? Number(band.x1) : d3.quantile(points.map((p) => p.x).sort(d3.ascending), 0.75);
  if (data.band !== false && Number.isFinite(bx0) && Number.isFinite(bx1) && bx1 > bx0) {
    g.append("rect").attr("x", x(bx0)).attr("y", 0).attr("width", Math.max(2, x(bx1) - x(bx0))).attr("height", h).attr("fill", pal.ink).attr("opacity", 0.05);
  }

  const fit = linreg(points);
  const xd = x.domain();
  g.append("line")
    .attr("x1", x(xd[0]))
    .attr("x2", x(xd[1]))
    .attr("y1", y(fit.a + fit.b * xd[0]))
    .attr("y2", y(fit.a + fit.b * xd[1]))
    .attr("stroke", pal.neutral)
    .attr("stroke-width", 1.4);

  if (opts.quadrants || data.quadrants) {
    g.append("line").attr("x1", x(fit.mx)).attr("x2", x(fit.mx)).attr("y1", 0).attr("y2", h).attr("stroke", pal.neutral).attr("stroke-dasharray", "5 4");
    g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(fit.my)).attr("y2", y(fit.my)).attr("stroke", pal.neutral).attr("stroke-dasharray", "5 4");
  } else {
    g.append("line").attr("x1", x(fit.mx)).attr("x2", x(fit.mx)).attr("y1", 0).attr("y2", h).attr("stroke", pal.muted).attr("stroke-dasharray", "5 4").attr("opacity", 0.85);
    g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(fit.my)).attr("y2", y(fit.my)).attr("stroke", pal.muted).attr("stroke-dasharray", "5 4").attr("opacity", 0.85);
    g.append("text").attr("x", x(fit.mx) + 6).attr("y", 12).attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.muted).text(data.xMeanLabel || "Average");
    g.append("text").attr("x", w + 6).attr("y", y(fit.my) + 4).attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.muted).text(data.yMeanLabel || "Average");
  }

  const fill = pal.series[2] || pal.primary;
  points.forEach((p) => {
    g.append("circle")
      .attr("cx", x(p.x))
      .attr("cy", y(p.y))
      .attr("r", typeof r === "function" ? r(p.size) : r)
      .attr("fill", fill)
      .attr("opacity", 0.55)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.6);
  });
  if (points.length <= 18) {
    points.forEach((p) => {
      if (!p.label) return;
      g.append("text").attr("x", x(p.x)).attr("y", y(p.y) - (typeof r === "function" ? r(p.size) : r) - 4).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "10px").attr("fill", pal.ink).text(p.label);
    });
  }

  g.append("g")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).ticks(8).tickSize(0).tickPadding(8))
    .call((s) => s.select(".domain").attr("stroke", pal.grid))
    .selectAll("text")
    .attr("font-family", MONO)
    .attr("font-size", "10px")
    .attr("fill", pal.muted);
  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(8).tickFormat((d) => (y1 <= 1.5 ? `${Math.round(d * 100)}%` : fmt(d))))
    .call((s) => s.select(".domain").remove())
    .selectAll("text")
    .attr("font-family", MONO)
    .attr("font-size", "10px")
    .attr("fill", pal.muted);

  svg.append("text").attr("x", M.left + w / 2).attr("y", H - 8).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "12px").attr("font-weight", 650).attr("fill", pal.ink).text(data.xLabel || "");
  svg.append("text").attr("x", M.left).attr("y", 16).attr("font-family", FONT).attr("font-size", "12px").attr("font-weight", 650).attr("fill", pal.ink).text(data.yLabel || "");
}

export function renderBubbleMatrix(container, data, pal) {
  const rows = data.rows || [];
  const cols = data.cols || data.columns || [];
  let cells = data.cells || [];
  if (!cells.length && rows.length && (data.values || data.sizes)) {
    const values = data.values || [];
    const sizes = data.sizes || data.values || [];
    cells = [];
    rows.forEach((r, ri) => {
      cols.forEach((c, ci) => {
        cells.push({ row: r, col: c, value: Number(values[ri]?.[ci]) || 0, size: Number(sizes[ri]?.[ci]) || 0 });
      });
    });
  }
  if (!rows.length || !cols.length || !cells.length) return;
  const { W, H } = sizeOf(container);
  const legendW = 132;
  const M = { top: 36, right: legendW + 16, bottom: 20, left: 88 };
  const svg = svgRoot(container, W, H);
  const x = d3.scaleBand().domain(cols).range([M.left, W - M.right]).padding(0.12);
  const y = d3.scaleBand().domain(rows).range([M.top, H - M.bottom]).padding(0.18);
  const maxSize = d3.max(cells, (c) => Number(c.size) || Number(c.value) || 0) || 1;
  const r = d3.scaleSqrt().domain([0, maxSize]).range([6, Math.min(x.bandwidth(), y.bandwidth()) / 2 - 2]);
  const breaks = data.breaks || [9, 11, 15];
  const fills = data.fills || ["#ffffff", "#9DC3E6", "#5B9BD5", pal.primary];
  const colorOf = (v) => {
    if (v < breaks[0]) return fills[0];
    if (v < breaks[1]) return fills[1];
    if (v < breaks[2]) return fills[2];
    return fills[3];
  };

  svg.append("rect").attr("x", M.left).attr("y", M.top).attr("width", W - M.left - M.right).attr("height", H - M.top - M.bottom).attr("fill", "none").attr("stroke", pal.grid);
  rows.forEach((row, i) => {
    const yy = y(row);
    if (i === 0) {
      svg.append("rect").attr("x", 8).attr("y", yy).attr("width", W - M.right - 8).attr("height", y.bandwidth()).attr("fill", pal.grid).attr("opacity", 0.55);
    }
    svg.append("line").attr("x1", M.left).attr("x2", W - M.right).attr("y1", yy + y.bandwidth()).attr("y2", yy + y.bandwidth()).attr("stroke", pal.grid).attr("stroke-dasharray", "3 4");
    svg.append("text").attr("x", M.left - 10).attr("y", yy + y.bandwidth() / 2 + 4).attr("text-anchor", "end").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink).text(row);
  });
  cols.forEach((c) => {
    svg.append("text").attr("x", x(c) + x.bandwidth() / 2).attr("y", M.top - 12).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink).text(c);
  });

  cells.forEach((cell) => {
    const cx = x(cell.col) + x.bandwidth() / 2;
    const cy = y(cell.row) + y.bandwidth() / 2;
    if (cx == null || cy == null || Number.isNaN(cx)) return;
    const val = Number(cell.value);
    const rad = r(Number(cell.size) || val || 0);
    const fill = colorOf(val);
    svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", rad).attr("fill", fill).attr("stroke", pal.neutral).attr("stroke-width", fill === "#ffffff" ? 1.2 : 0.4);
    const label = cell.label != null ? cell.label : `${val}${data.valueSuffix ?? "%"}`;
    const inside = rad > 16;
    svg
      .append("text")
      .attr("x", inside ? cx : cx + rad + 4)
      .attr("y", cy + 4)
      .attr("text-anchor", inside ? "middle" : "start")
      .attr("font-family", MONO)
      .attr("font-size", "11px")
      .attr("font-weight", 600)
      .attr("fill", pal.ink)
      .text(label);
  });

  const lg = svg.append("g").attr("transform", `translate(${W - legendW + 8},${M.top})`);
  lg.append("text").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.muted).text(data.colorLabel || "Value");
  const labels = data.colorLabels || [`≥${breaks[2]}%`, `${breaks[1]}–${breaks[2] - 0.1}%`, `${breaks[0]}–${breaks[1] - 0.1}%`, `<${breaks[0]}%`];
  [fills[3], fills[2], fills[1], fills[0]].forEach((f, i) => {
    const row = lg.append("g").attr("transform", `translate(0,${22 + i * 22})`);
    row.append("circle").attr("cx", 8).attr("cy", 0).attr("r", 8).attr("fill", f).attr("stroke", pal.neutral);
    row.append("text").attr("x", 22).attr("y", 4).attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(labels[i]);
  });
  lg.append("circle").attr("cx", 10).attr("cy", 128).attr("r", 16).attr("fill", pal.grid).attr("stroke", pal.neutral);
  lg.append("text").attr("x", 32).attr("y", 132).attr("font-family", FONT).attr("font-size", "10px").attr("fill", pal.muted).text(data.sizeLabel || "Size = volume");
}

export function renderWaterfallPro(container, data, pal, unit) {
  const items = data.items || [];
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const names = [...new Set(items.flatMap((it) => (it.segments || []).map((s) => s.name)))];
  const stacked = names.length > 0;
  const M = { top: 20, right: stacked ? 128 : 36, bottom: 56, left: 52 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const hid = `hatch-${Math.random().toString(36).slice(2, 8)}`;
  hatchPattern(svg, hid, pal.primary);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const color = d3.scaleOrdinal().domain(names).range(pal.series);

  let running = 0;
  const cols = items.map((it, idx) => {
    const segs = (it.segments || []).map((s) => ({ name: s.name, value: Number(s.value) || 0, hatch: s.hatch }));
    const raw = segs.length ? d3.sum(segs, (s) => s.value) : Number(it.value) || 0;
    const type = String(it.type || "").toLowerCase();
    const hatch = isHatch(it);
    const total = !hatch && (type === "total" || ((!type || type === "") && (idx === 0 || idx === items.length - 1)));
    let base;
    if (total) {
      base = 0;
      running = raw;
    } else {
      base = running;
      running += raw;
    }
    const y0 = Math.min(base, base + raw);
    const y1 = Math.max(base, base + raw);
    let acc = base;
    const stackedSegs = segs.length
      ? segs.map((s) => {
          const a = acc;
          acc += s.value;
          return { ...s, y0: Math.min(a, acc), y1: Math.max(a, acc) };
        })
      : [{ name: it.label, value: raw, y0, y1, hatch: isHatch(it) }];
    return {
      label: it.label,
      type: hatch ? "hatch" : total ? "total" : raw >= 0 ? "increase" : "decrease",
      value: raw,
      y0,
      y1,
      connector: total ? raw : running,
      stacked: stackedSegs,
      hatch,
    };
  });

  const yMin = Math.min(0, ...cols.map((c) => c.y0)) * 1.06;
  const yMax = Math.max(...cols.map((c) => c.y1)) * 1.18;
  const x = d3.scaleBand().domain(cols.map((c) => c.label)).range([0, w]).padding(0.34);
  const y = d3.scaleLinear().domain([yMin, yMax]).range([h, 0]);
  y.ticks(5).forEach((t) => {
    g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(t)).attr("y2", y(t)).attr("stroke", pal.grid);
  });
  if (yMin < 0) g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", pal.ink).attr("stroke-width", 1);

  for (let i = 0; i < cols.length - 1; i++) {
    const a = cols[i];
    const b = cols[i + 1];
    const yy = y(a.connector);
    g.append("line")
      .attr("x1", x(a.label) + x.bandwidth() + 1)
      .attr("x2", x(b.label) - 1)
      .attr("y1", yy)
      .attr("y2", yy)
      .attr("stroke", pal.neutral)
      .attr("stroke-width", 1);
  }

  cols.forEach((col) => {
    col.stacked.forEach((s) => {
      const fill = col.hatch || s.hatch ? `url(#${hid})` : stacked && s.name !== col.label ? color(s.name) : col.type === "total" ? pal.primary : col.type === "increase" ? pal.positive : pal.negative;
      const stroke = col.hatch ? pal.primary : "none";
      g.append("rect")
        .attr("x", x(col.label))
        .attr("width", x.bandwidth())
        .attr("y", y(s.y1))
        .attr("height", Math.max(1.5, Math.abs(y(s.y0) - y(s.y1))))
        .attr("fill", fill)
        .attr("stroke", stroke)
        .attr("stroke-width", col.hatch ? 1 : 0);
      if (stacked && Math.abs(y(s.y0) - y(s.y1)) > 16) {
        g.append("text")
          .attr("x", x(col.label) + x.bandwidth() / 2)
          .attr("y", (y(s.y0) + y(s.y1)) / 2 + 4)
          .attr("text-anchor", "middle")
          .attr("font-family", MONO)
          .attr("font-size", "9px")
          .attr("fill", col.hatch ? pal.primary : "#fff")
          .attr("font-weight", 600)
          .text(fmt(s.value, unit));
      }
    });
    g.append("text")
      .attr("x", x(col.label) + x.bandwidth() / 2)
      .attr("y", y(col.y1) - 6)
      .attr("text-anchor", "middle")
      .attr("font-family", MONO)
      .attr("font-size", "11px")
      .attr("font-weight", 600)
      .attr("fill", col.hatch ? pal.primary : col.type === "total" ? pal.primary : col.type === "increase" ? pal.positive : pal.negative)
      .text(col.type === "total" ? fmt(col.value, unit) : signed(col.value, unit));
  });

  const first = cols[0];
  const last = cols[cols.length - 1];
  if (first && last && first.type === "total" && last.type === "total") {
    const x1 = x(last.label) + x.bandwidth() + 10;
    g.append("line").attr("x1", x1).attr("x2", x1).attr("y1", y(first.value)).attr("y2", y(last.value)).attr("stroke", pal.primary).attr("stroke-width", 1.2).attr("marker-end", "none");
    g.append("text")
      .attr("x", x1 + 6)
      .attr("y", (y(first.value) + y(last.value)) / 2)
      .attr("font-family", MONO)
      .attr("font-size", "10px")
      .attr("fill", pal.primary)
      .text(signed(last.value - first.value, unit));
  }

  g.append("g")
    .attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
    .call((s) => s.select(".domain").attr("stroke", pal.grid))
    .selectAll("text")
    .attr("font-family", FONT)
    .attr("font-size", "11px")
    .attr("fill", pal.ink)
    .call((texts) =>
      texts.each(function (d) {
        const el = d3.select(this);
        const words = String(d).split(" ");
        if (words.length < 3) return;
        el.text(null);
        el.append("tspan").attr("x", 0).attr("dy", "0.9em").text(words.slice(0, 2).join(" "));
        el.append("tspan").attr("x", 0).attr("dy", "1.1em").text(words.slice(2).join(" "));
      })
    );
  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat((d) => fmt(d, unit)).tickSize(0).tickPadding(8))
    .call((s) => s.select(".domain").remove())
    .selectAll("text")
    .attr("font-family", MONO)
    .attr("font-size", "10px")
    .attr("fill", pal.muted);

  if (stacked) {
    names.forEach((name, i) => {
      const row = svg.append("g").attr("transform", `translate(${W - M.right + 12},${M.top + i * 18})`);
      row.append("rect").attr("width", 10).attr("height", 10).attr("fill", color(name));
      row.append("text").attr("x", 16).attr("y", 9).attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(name);
    });
  }
}

export const PRO_RENDERERS = {
  sankey: renderSankeyPro,
  alluvial: renderSankeyPro,
  scatter_bubble: renderScatterPro,
  connected_scatter: (c, d, p, u) => renderScatterPro(c, d, p, u, { quadrants: false }),
  alpha_beta: renderScatterPro,
  quadrant: (c, d, p, u) => renderScatterPro(c, { ...d, quadrants: true }, p, u, { quadrants: true }),
  bubble_matrix: renderBubbleMatrix,
  waterfall: renderWaterfallPro,
  stacked_waterfall: renderWaterfallPro,
};
