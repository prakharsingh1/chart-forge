import * as d3 from "d3";
import { FONT, MONO } from "../theme.js";
import { fmt, signed, wrapLabel } from "../lib/format.js";

function sizeOf(el) {
  const w = Math.max(el.clientWidth || 0, 640);
  const h = Math.max(el.clientHeight || 0, 360);
  return { W: w, H: h };
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

function gridY(g, y, w, pal, ticks = 5) {
  g.selectAll(".grid")
    .data(y.ticks(ticks))
    .join("line")
    .attr("x1", 0)
    .attr("x2", w)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .attr("stroke", pal.grid)
    .attr("stroke-width", 1);
}

function axisLeft(g, y, unit, pal) {
  g.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat((d) => fmt(d, unit)).tickSize(0).tickPadding(8))
    .call((s) => s.select(".domain").remove())
    .call((s) => s.selectAll("text").attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.muted));
}

function axisBottom(g, x, h, pal, band = true) {
  const ax = g.append("g").attr("transform", `translate(0,${h})`);
  if (band) {
    ax.call(d3.axisBottom(x).tickSize(0).tickPadding(10));
    ax.selectAll("text").each(function (d) {
      const lines = wrapLabel(d, 12);
      const el = d3.select(this).text(null).attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink);
      lines.forEach((ln, i) => {
        el.append("tspan").attr("x", 0).attr("dy", i === 0 ? "0.9em" : "1.1em").text(ln);
      });
    });
  } else {
    ax.call(d3.axisBottom(x).tickSize(0).tickPadding(10));
    ax.selectAll("text").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink);
  }
  ax.select(".domain").attr("stroke", pal.grid);
}

function legend(svg, items, colors, x, y, pal) {
  const g = svg.append("g").attr("transform", `translate(${x},${y})`);
  items.forEach((name, i) => {
    const row = g.append("g").attr("transform", `translate(0,${i * 18})`);
    row.append("rect").attr("width", 10).attr("height", 10).attr("rx", 1).attr("fill", colors(name));
    row.append("text").attr("x", 16).attr("y", 9).attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(name);
  });
}

function waterfallBars(items) {
  let running = 0;
  return items.map((item) => {
    const value = Number(item.value) || 0;
    const type = (item.type || "").toLowerCase();
    if (type === "total") {
      running = value;
      return { ...item, value, type: "total", y0: 0, y1: value, connector: value };
    }
    const y0 = running;
    running += value;
    const y1 = running;
    return {
      ...item,
      value,
      type: value >= 0 ? "increase" : "decrease",
      y0: Math.min(y0, y1),
      y1: Math.max(y0, y1),
      connector: y1,
      base: y0,
    };
  });
}

export function renderWaterfall(container, data, pal, unit) {
  const items = data.items || [];
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 24, bottom: 56, left: 56 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const bars = waterfallBars(items);
  const yMin = Math.min(0, ...bars.map((b) => b.y0)) * 1.08;
  const yMax = Math.max(...bars.map((b) => b.y1)) * 1.18;
  const x = d3.scaleBand().domain(bars.map((b) => b.label)).range([0, w]).padding(0.32);
  const y = d3.scaleLinear().domain([yMin, yMax]).range([h, 0]);
  gridY(g, y, w, pal);
  if (yMin < 0) g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", pal.ink).attr("stroke-width", 1);

  for (let i = 0; i < bars.length - 1; i++) {
    const a = bars[i];
    const b = bars[i + 1];
    const yy = y(a.connector);
    g.append("line")
      .attr("x1", x(a.label) + x.bandwidth() + 1)
      .attr("x2", x(b.label) - 1)
      .attr("y1", yy)
      .attr("y2", yy)
      .attr("stroke", pal.neutral)
      .attr("stroke-width", 1);
  }

  const bg = g.selectAll(".bar").data(bars).join("g");
  bg.append("rect")
    .attr("x", (d) => x(d.label))
    .attr("width", x.bandwidth())
    .attr("y", (d) => y(d.y1))
    .attr("height", (d) => Math.max(1.5, Math.abs(y(d.y0) - y(d.y1))))
    .attr("fill", (d) => (d.type === "total" ? pal.primary : d.type === "increase" ? pal.positive : pal.negative));

  bg.append("text")
    .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.y1) - 6)
    .attr("text-anchor", "middle")
    .attr("font-family", MONO)
    .attr("font-size", "11px")
    .attr("font-weight", 600)
    .attr("fill", (d) => (d.type === "total" ? pal.primary : d.type === "increase" ? pal.positive : pal.negative))
    .text((d) => (d.type === "total" ? fmt(d.value, unit) : signed(d.value, unit)));

  axisBottom(g, x, h, pal);
  axisLeft(g, y, unit, pal);
}

export function renderStackedWaterfall(container, data, pal, unit) {
  const items = data.items || [];
  if (!items.length) return;
  const names = [...new Set(items.flatMap((it) => (it.segments || []).map((s) => s.name)))];
  const color = d3.scaleOrdinal().domain(names).range(pal.series);
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 120, bottom: 56, left: 56 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

  let running = 0;
  const cols = items.map((it) => {
    const segs = it.segments || [];
    const sum = d3.sum(segs, (s) => Number(s.value) || 0);
    const type = (it.type || "").toLowerCase();
    let base = type === "total" ? 0 : running;
    if (type === "total") running = sum;
    else running += sum;
    let acc = base;
    const stacked = segs.map((s) => {
      const v = Number(s.value) || 0;
      const y0 = acc;
      acc += v;
      return { name: s.name, y0, y1: acc, v };
    });
    return { label: it.label, type, stacked, connector: type === "total" ? sum : running };
  });

  const yMax = Math.max(...cols.flatMap((c) => c.stacked.map((s) => s.y1))) * 1.15;
  const x = d3.scaleBand().domain(cols.map((c) => c.label)).range([0, w]).padding(0.3);
  const y = d3.scaleLinear().domain([Math.min(0, ...cols.flatMap((c) => c.stacked.map((s) => s.y0))), yMax]).range([h, 0]);
  gridY(g, y, w, pal);

  cols.forEach((col, i) => {
    col.stacked.forEach((s) => {
      g.append("rect")
        .attr("x", x(col.label))
        .attr("width", x.bandwidth())
        .attr("y", y(s.y1))
        .attr("height", Math.max(1, y(s.y0) - y(s.y1)))
        .attr("fill", color(s.name));
      if (y(s.y0) - y(s.y1) > 16) {
        g.append("text")
          .attr("x", x(col.label) + x.bandwidth() / 2)
          .attr("y", y(s.y0) + (y(s.y1) - y(s.y0)) / 2 + 4)
          .attr("text-anchor", "middle")
          .attr("font-family", MONO)
          .attr("font-size", "9px")
          .attr("fill", "#fff")
          .attr("font-weight", 600)
          .text(fmt(s.v, unit));
      }
    });
    if (i < cols.length - 1) {
      g.append("line")
        .attr("x1", x(col.label) + x.bandwidth())
        .attr("x2", x(cols[i + 1].label))
        .attr("y1", y(col.connector))
        .attr("y2", y(col.connector))
        .attr("stroke", pal.neutral);
    }
  });
  axisBottom(g, x, h, pal);
  axisLeft(g, y, unit, pal);
  legend(svg, names, color, W - M.right + 12, M.top, pal);
}

export function renderStackedBar(container, data, pal, unit, is100) {
  const cats = data.categories || [];
  const series = data.series || [];
  if (!cats.length || !series.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 128, bottom: 52, left: 52 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const keys = series.map((s) => s.name);
  const stackData = cats.map((cat, ci) => {
    const row = { category: cat };
    const total = d3.sum(series, (s) => Number(s.values[ci]) || 0) || 1;
    series.forEach((s) => {
      const v = Number(s.values[ci]) || 0;
      row[s.name] = is100 ? (v / total) * 100 : v;
    });
    return row;
  });
  const stacked = d3.stack().keys(keys)(stackData);
  const x = d3.scaleBand().domain(cats).range([0, w]).padding(0.34);
  const yMax = is100 ? 100 : (d3.max(stacked[stacked.length - 1], (d) => d[1]) || 1) * 1.12;
  const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);
  const color = d3.scaleOrdinal().domain(keys).range(pal.series);
  gridY(g, y, w, pal);
  stacked.forEach((layer, li) => {
    g.selectAll(`.s${li}`)
      .data(layer)
      .join("rect")
      .attr("x", (d) => x(d.data.category))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => Math.max(0, y(d[0]) - y(d[1])))
      .attr("fill", color(keys[li]));
    g.selectAll(`.t${li}`)
      .data(layer)
      .join("text")
      .attr("x", (d) => x(d.data.category) + x.bandwidth() / 2)
      .attr("y", (d) => y(d[0]) + (y(d[0]) - y(d[1])) / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("font-family", MONO)
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .attr("font-weight", 600)
      .text((d) => {
        const v = d[1] - d[0];
        return y(d[0]) - y(d[1]) > 18 ? fmt(v, is100 ? "%" : unit) : "";
      });
  });
  axisBottom(g, x, h, pal);
  axisLeft(g, y, is100 ? "%" : unit, pal);
  legend(svg, keys, color, W - M.right + 16, M.top, pal);
}

export function renderHorizontalBar(container, data, pal, unit) {
  const items = [...(data.items || [])].sort((a, b) => Number(b.value) - Number(a.value));
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 8, right: 72, bottom: 12, left: 128 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const y = d3.scaleBand().domain(items.map((d) => d.label)).range([0, h]).padding(0.28);
  const x = d3.scaleLinear().domain([0, d3.max(items, (d) => Number(d.value)) * 1.12]).range([0, w]);
  g.selectAll("rect")
    .data(items)
    .join("rect")
    .attr("y", (d) => y(d.label))
    .attr("height", y.bandwidth())
    .attr("width", (d) => x(Number(d.value)))
    .attr("fill", pal.primary);
  g.selectAll(".val")
    .data(items)
    .join("text")
    .attr("x", (d) => x(Number(d.value)) + 8)
    .attr("y", (d) => y(d.label) + y.bandwidth() / 2 + 4)
    .attr("font-family", MONO)
    .attr("font-size", "11px")
    .attr("font-weight", 600)
    .attr("fill", pal.ink)
    .text((d) => fmt(d.value, unit));
  g.append("g")
    .call(d3.axisLeft(y).tickSize(0).tickPadding(8))
    .call((s) => s.select(".domain").remove())
    .call((s) => s.selectAll("text").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink));
}

export function renderGroupedBar(container, data, pal, unit) {
  const cats = data.categories || [];
  let series = (data.series || []).filter((s) => Array.isArray(s.values));
  if (!cats.length) return;
  if (!series.length && (data.items || []).length) {
    series = [{ name: "Value", values: data.items.map((it) => Number(it.value) || 0) }];
  }
  if (!series.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 128, bottom: 52, left: 52 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const x0 = d3.scaleBand().domain(cats).range([0, w]).paddingInner(0.22);
  const x1 = d3.scaleBand().domain(series.map((s) => s.name)).range([0, Math.max(x0.bandwidth(), 1)]).padding(0.12);
  const yMax = d3.max(series, (s) => d3.max((s.values || []).map(Number))) || 1;
  const y = d3.scaleLinear().domain([0, yMax * 1.18]).range([h, 0]);
  const color = d3.scaleOrdinal().domain(series.map((s) => s.name)).range(pal.series);
  gridY(g, y, w, pal);
  cats.forEach((cat, ci) => {
    series.forEach((s) => {
      const val = Number(s.values[ci]) || 0;
      const bw = Math.max(x1.bandwidth(), 2);
      g.append("rect")
        .attr("x", (x0(cat) || 0) + (x1(s.name) || 0))
        .attr("y", y(val))
        .attr("width", bw)
        .attr("height", Math.max(0, h - y(val)))
        .attr("fill", color(s.name));
      g.append("text")
        .attr("x", (x0(cat) || 0) + (x1(s.name) || 0) + bw / 2)
        .attr("y", y(val) - 5)
        .attr("text-anchor", "middle")
        .attr("font-family", MONO)
        .attr("font-size", "9px")
        .attr("font-weight", 600)
        .attr("fill", pal.ink)
        .text(fmt(val, unit));
    });
  });
  axisBottom(g, x0, h, pal);
  axisLeft(g, y, unit, pal);
  legend(svg, series.map((s) => s.name), color, W - M.right + 16, M.top, pal);
}

export function renderTornado(container, data, pal, unit) {
  const cats = data.categories || [];
  const left = data.left || { values: [] };
  const right = data.right || { values: [] };
  if (!cats.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 36, right: 24, bottom: 16, left: 24 };
  const svg = svgRoot(container, W, H);
  const mid = W / 2;
  const barW = (W - M.left - M.right) / 2 - 70;
  const y = d3.scaleBand().domain(cats).range([M.top + 8, H - M.bottom]).padding(0.28);
  const maxVal = Math.max(d3.max(left.values || [0]), d3.max(right.values || [0]), 1);
  const xs = d3.scaleLinear().domain([0, maxVal * 1.15]).range([0, barW]);
  svg.append("text").attr("x", mid - 48).attr("y", 22).attr("text-anchor", "end").attr("font-family", FONT).attr("font-size", "12px").attr("font-weight", 700).attr("fill", pal.secondary).text(left.name || "Left");
  svg.append("text").attr("x", mid + 48).attr("y", 22).attr("text-anchor", "start").attr("font-family", FONT).attr("font-size", "12px").attr("font-weight", 700).attr("fill", pal.primary).text(right.name || "Right");
  cats.forEach((cat, i) => {
    const lv = Number(left.values?.[i]) || 0;
    const rv = Number(right.values?.[i]) || 0;
    svg.append("rect").attr("x", mid - 28 - xs(lv)).attr("y", y(cat)).attr("width", xs(lv)).attr("height", y.bandwidth()).attr("fill", pal.secondary);
    svg.append("rect").attr("x", mid + 28).attr("y", y(cat)).attr("width", xs(rv)).attr("height", y.bandwidth()).attr("fill", pal.primary);
    svg.append("text").attr("x", mid - 32 - xs(lv)).attr("y", y(cat) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").attr("font-family", MONO).attr("font-size", "10px").attr("font-weight", 600).attr("fill", pal.secondary).text(fmt(lv, unit));
    svg.append("text").attr("x", mid + 32 + xs(rv)).attr("y", y(cat) + y.bandwidth() / 2 + 4).attr("text-anchor", "start").attr("font-family", MONO).attr("font-size", "10px").attr("font-weight", 600).attr("fill", pal.primary).text(fmt(rv, unit));
    svg.append("text").attr("x", mid).attr("y", y(cat) + y.bandwidth() / 2 + 4).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(cat);
  });
}

export function renderMarimekko(container, data, pal) {
  const cats = data.categories || [];
  if (!cats.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 8, right: 16, bottom: 64, left: 16 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const totalW = d3.sum(cats, (c) => Number(c.width) || 0) || 1;
  const names = [...new Set(cats.flatMap((c) => (c.segments || []).map((s) => s.name)))];
  const color = d3.scaleOrdinal().domain(names).range(pal.series);
  let xOff = 0;
  cats.forEach((cat) => {
    const catW = ((Number(cat.width) || 0) / totalW) * w;
    const totalVal = d3.sum(cat.segments || [], (s) => Number(s.value) || 0) || 1;
    let yOff = 0;
    (cat.segments || []).forEach((seg) => {
      const segH = (Number(seg.value) / totalVal) * h;
      g.append("rect").attr("x", xOff + 1).attr("y", yOff).attr("width", Math.max(0, catW - 2)).attr("height", segH).attr("fill", color(seg.name)).attr("stroke", "#fff").attr("stroke-width", 1);
      if (segH > 20 && catW > 36) {
        g.append("text")
          .attr("x", xOff + catW / 2)
          .attr("y", yOff + segH / 2 + 4)
          .attr("text-anchor", "middle")
          .attr("font-family", MONO)
          .attr("font-size", "11px")
          .attr("fill", "#fff")
          .attr("font-weight", 700)
          .text(`${Math.round(seg.value)}%`);
      }
      yOff += segH;
    });
    g.append("text").attr("x", xOff + catW / 2).attr("y", h + 16).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(cat.label);
    g.append("text").attr("x", xOff + catW / 2).attr("y", h + 32).attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.muted).text(`${cat.width}%`);
    xOff += catW;
  });
  const lg = svg.append("g").attr("transform", `translate(${M.left},${H - 18})`);
  names.forEach((n, i) => {
    const row = lg.append("g").attr("transform", `translate(${i * 110},0)`);
    row.append("rect").attr("width", 8).attr("height", 8).attr("fill", color(n));
    row.append("text").attr("x", 12).attr("y", 8).attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(n);
  });
}

export function renderLineTrend(container, data, pal, unit) {
  const labels = data.xLabels || [];
  const series = (data.series || []).filter((s) => Array.isArray(s.values) && s.values.length);
  if (!labels.length || !series.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 28, right: 128, bottom: 44, left: 52 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const x = d3.scalePoint().domain(labels).range([0, w]).padding(0.12);
  const all = series.flatMap((s) => s.values.map(Number));
  const y = d3.scaleLinear().domain([Math.min(0, d3.min(all)), d3.max(all) * 1.18]).range([h, 0]);
  const color = d3.scaleOrdinal().domain(series.map((s) => s.name)).range(pal.series);
  gridY(g, y, w, pal);
  series.forEach((s, si) => {
    const line = d3.line().x((_, i) => x(labels[i])).y((d) => y(Number(d))).curve(d3.curveMonotoneX);
    const area = d3.area().x((_, i) => x(labels[i])).y0(h).y1((d) => y(Number(d))).curve(d3.curveMonotoneX);
    if (si === 0) g.append("path").datum(s.values).attr("d", area).attr("fill", color(s.name)).attr("opacity", 0.12);
    g.append("path").datum(s.values).attr("d", line).attr("fill", "none").attr("stroke", color(s.name)).attr("stroke-width", 2.4);
    s.values.forEach((v, i) => {
      g.append("circle").attr("cx", x(labels[i])).attr("cy", y(Number(v))).attr("r", 4).attr("fill", color(s.name)).attr("stroke", "#fff").attr("stroke-width", 1.5);
      g.append("text").attr("x", x(labels[i])).attr("y", y(Number(v)) - 10).attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "10px").attr("font-weight", 600).attr("fill", color(s.name)).text(fmt(v, unit));
    });
  });
  (data.annotations || []).forEach((ann, idx) => {
    if (ann.type !== "cagr") return;
    const x1 = x(labels[ann.from]) + M.left;
    const x2 = x(labels[ann.to]) + M.left;
    const yy = 14;
    const id = `arr-${idx}`;
    svg.append("defs").append("marker").attr("id", id).attr("viewBox", "0 0 10 7").attr("refX", 10).attr("refY", 3.5).attr("markerWidth", 7).attr("markerHeight", 6).attr("orient", "auto").append("polygon").attr("points", "0 0, 10 3.5, 0 7").attr("fill", pal.primary);
    svg.append("line").attr("x1", x1).attr("x2", x2).attr("y1", yy).attr("y2", yy).attr("stroke", pal.primary).attr("marker-end", `url(#${id})`);
    svg.append("text").attr("x", (x1 + x2) / 2).attr("y", yy - 4).attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "10px").attr("font-weight", 700).attr("fill", pal.primary).text(`CAGR ${ann.value}`);
  });
  axisBottom(g, x, h, pal, false);
  axisLeft(g, y, unit, pal);
  const lg = svg.append("g").attr("transform", `translate(${W - M.right + 16},${M.top})`);
  series.forEach((s, i) => {
    const row = lg.append("g").attr("transform", `translate(0,${i * 18})`);
    row.append("line").attr("x2", 16).attr("y1", 6).attr("y2", 6).attr("stroke", color(s.name)).attr("stroke-width", 2.4);
    row.append("circle").attr("cx", 8).attr("cy", 6).attr("r", 3).attr("fill", color(s.name));
    row.append("text").attr("x", 22).attr("y", 10).attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(s.name);
  });
}

export function renderAreaStacked(container, data, pal, unit) {
  const labels = data.xLabels || [];
  const series = data.series || [];
  if (!labels.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 128, bottom: 44, left: 52 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const keys = series.map((s) => s.name);
  const rows = labels.map((lab, i) => {
    const row = { k: lab };
    series.forEach((s) => {
      row[s.name] = Number(s.values[i]) || 0;
    });
    return row;
  });
  const stacked = d3.stack().keys(keys)(rows);
  const x = d3.scalePoint().domain(labels).range([0, w]).padding(0.1);
  const y = d3.scaleLinear().domain([0, d3.max(stacked[stacked.length - 1], (d) => d[1]) * 1.1]).range([h, 0]);
  const color = d3.scaleOrdinal().domain(keys).range(pal.series);
  const area = d3.area().x((d) => x(d.data.k)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(d3.curveMonotoneX);
  gridY(g, y, w, pal);
  stacked.forEach((layer, i) => {
    g.append("path").datum(layer).attr("d", area).attr("fill", color(keys[i])).attr("opacity", 0.9);
  });
  axisBottom(g, x, h, pal, false);
  axisLeft(g, y, unit, pal);
  legend(svg, keys, color, W - M.right + 16, M.top, pal);
}

export function renderPieDonut(container, data, pal) {
  const items = data.items || [];
  if (!items.length) return;
  const { W, H } = sizeOf(container);
  const svg = svgRoot(container, W, H);
  const cx = W * 0.38;
  const cy = H / 2;
  const radius = Math.min(W, H) / 2 - 36;
  const inner = data.donut === false ? 0 : radius * 0.58;
  const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);
  const color = d3.scaleOrdinal().domain(items.map((d) => d.label)).range(pal.series);
  const pie = d3.pie().value((d) => Number(d.value) || 0).sort(null).padAngle(0.012);
  const arc = d3.arc().innerRadius(inner).outerRadius(radius);
  const total = d3.sum(items, (d) => Number(d.value) || 0) || 1;
  g.selectAll("path").data(pie(items)).join("path").attr("d", arc).attr("fill", (d) => color(d.data.label)).attr("stroke", "#fff").attr("stroke-width", 2);
  const outer = d3.arc().innerRadius(radius + 18).outerRadius(radius + 18);
  g.selectAll(".lab")
    .data(pie(items))
    .join("text")
    .attr("transform", (d) => `translate(${outer.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("font-family", FONT)
    .attr("font-size", "11px")
    .attr("fill", pal.ink)
    .text((d) => {
      const pct = (d.data.value / total) * 100;
      return pct >= 4 ? `${d.data.label}  ${pct.toFixed(0)}%` : "";
    });
  if (inner > 0) {
    g.append("text").attr("text-anchor", "middle").attr("dy", "-0.15em").attr("font-family", MONO).attr("font-size", "22px").attr("font-weight", 700).attr("fill", pal.primary).text(fmt(total));
    g.append("text").attr("text-anchor", "middle").attr("dy", "1.25em").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.muted).text("Total");
  }
}

export function renderScatter(container, data, pal) {
  const points = data.points || [];
  if (!points.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 24, bottom: 48, left: 56 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const x = d3.scaleLinear().domain([0, d3.max(points, (p) => Number(p.x)) * 1.15]).range([0, w]);
  const y = d3.scaleLinear().domain([d3.min(points, (p) => Math.min(0, Number(p.y))) * 1.1, d3.max(points, (p) => Number(p.y)) * 1.2]).range([h, 0]);
  const r = d3.scaleSqrt().domain([0, d3.max(points, (p) => Number(p.size) || 20)]).range([8, 34]);
  gridY(g, y, w, pal);
  if (data.quadrants) {
    const mx = d3.median(points, (p) => Number(p.x));
    const my = d3.median(points, (p) => Number(p.y));
    g.append("line").attr("x1", x(mx)).attr("x2", x(mx)).attr("y1", 0).attr("y2", h).attr("stroke", pal.neutral).attr("stroke-dasharray", "4,3");
    g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(my)).attr("y2", y(my)).attr("stroke", pal.neutral).attr("stroke-dasharray", "4,3");
  }
  points.forEach((p, i) => {
    g.append("circle").attr("cx", x(Number(p.x))).attr("cy", y(Number(p.y))).attr("r", r(Number(p.size) || 20)).attr("fill", pal.series[i % pal.series.length]).attr("opacity", 0.82).attr("stroke", "#fff");
    g.append("text").attr("x", x(Number(p.x))).attr("y", y(Number(p.y)) - r(Number(p.size) || 20) - 4).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.ink).text(p.label);
  });
  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(8)).call((s) => s.select(".domain").attr("stroke", pal.grid)).call((s) => s.selectAll("text").attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.muted));
  axisLeft(g, y, "", pal);
  svg.append("text").attr("x", M.left + w / 2).attr("y", H - 8).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.muted).text(data.xLabel || "");
  svg.append("text").attr("transform", `translate(14,${M.top + h / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "11px").attr("fill", pal.muted).text(data.yLabel || "");
}

export function renderCombo(container, data, pal, unit) {
  const cats = data.categories || [];
  const bars = data.bars || { values: [] };
  const line = data.line || { values: [] };
  if (!cats.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 16, right: 56, bottom: 48, left: 52 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const x = d3.scaleBand().domain(cats).range([0, w]).padding(0.32);
  const yL = d3.scaleLinear().domain([0, d3.max(bars.values || [0]) * 1.18]).range([h, 0]);
  const yR = d3.scaleLinear().domain([0, d3.max(line.values || [0]) * 1.35]).range([h, 0]);
  gridY(g, yL, w, pal);
  g.selectAll("rect")
    .data(bars.values || [])
    .join("rect")
    .attr("x", (_, i) => x(cats[i]))
    .attr("width", x.bandwidth())
    .attr("y", (d) => yL(Number(d)))
    .attr("height", (d) => h - yL(Number(d)))
    .attr("fill", pal.primary);
  g.selectAll(".bl")
    .data(bars.values || [])
    .join("text")
    .attr("x", (_, i) => x(cats[i]) + x.bandwidth() / 2)
    .attr("y", (d) => yL(Number(d)) - 6)
    .attr("text-anchor", "middle")
    .attr("font-family", MONO)
    .attr("font-size", "10px")
    .attr("font-weight", 600)
    .attr("fill", pal.primary)
    .text((d) => fmt(d, unit));
  const lineGen = d3.line().x((_, i) => x(cats[i]) + x.bandwidth() / 2).y((d) => yR(Number(d))).curve(d3.curveMonotoneX);
  g.append("path").datum(line.values || []).attr("d", lineGen).attr("fill", "none").attr("stroke", pal.negative).attr("stroke-width", 2.4);
  (line.values || []).forEach((v, i) => {
    g.append("circle").attr("cx", x(cats[i]) + x.bandwidth() / 2).attr("cy", yR(Number(v))).attr("r", 4).attr("fill", pal.negative).attr("stroke", "#fff");
    g.append("text").attr("x", x(cats[i]) + x.bandwidth() / 2).attr("y", yR(Number(v)) - 10).attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "9px").attr("fill", pal.negative).attr("font-weight", 600).text(`${v}%`);
  });
  axisBottom(g, x, h, pal);
  axisLeft(g, yL, unit, pal);
  g.append("g")
    .attr("transform", `translate(${w},0)`)
    .call(d3.axisRight(yR).ticks(5).tickFormat((d) => `${d}%`).tickSize(0).tickPadding(8))
    .call((s) => s.select(".domain").remove())
    .call((s) => s.selectAll("text").attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.negative));
}

export function renderFunnel(container, data, pal) {
  const stages = data.stages || [];
  if (!stages.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 12, right: 72, bottom: 12, left: 120 };
  const w = W - M.left - M.right;
  const svg = svgRoot(container, W, H);
  const maxVal = Number(stages[0]?.value) || 1;
  const stageH = (H - M.top - M.bottom) / stages.length;
  stages.forEach((stage, i) => {
    const barW = w * (Number(stage.value) / maxVal);
    const xOff = M.left + (w - barW) / 2;
    svg.append("rect").attr("x", xOff).attr("y", M.top + i * stageH + 4).attr("width", barW).attr("height", stageH - 8).attr("fill", pal.series[i % pal.series.length]);
    svg.append("text").attr("x", M.left - 10).attr("y", M.top + i * stageH + stageH / 2 + 4).attr("text-anchor", "end").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink).text(stage.label);
    svg.append("text").attr("x", W / 2).attr("y", M.top + i * stageH + stageH / 2 + 4).attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "12px").attr("font-weight", 700).attr("fill", "#fff").text(fmt(stage.value));
    if (i > 0) {
      const drop = ((1 - Number(stage.value) / Number(stages[i - 1].value)) * 100).toFixed(0);
      svg.append("text").attr("x", W - M.right + 8).attr("y", M.top + i * stageH + stageH / 2 + 4).attr("font-family", MONO).attr("font-size", "11px").attr("fill", pal.negative).text(`−${drop}%`);
    }
  });
}

export function renderGantt(container, data, pal) {
  const axis = data.axis || [];
  const items = data.items || [];
  if (!axis.length || !items.length) return;
  const { W, H } = sizeOf(container);
  const M = { top: 28, right: 16, bottom: 28, left: 128 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const svg = svgRoot(container, W, H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
  const x = d3.scaleBand().domain(axis).range([0, w]).paddingInner(0.08);
  const y = d3.scaleBand().domain(items.map((d) => d.label)).range([0, h]).padding(0.32);
  axis.forEach((lab, i) => {
    g.append("line").attr("x1", x(lab)).attr("x2", x(lab)).attr("y1", 0).attr("y2", h).attr("stroke", pal.grid);
    g.append("text").attr("x", x(lab) + x.bandwidth() / 2).attr("y", -8).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "10px").attr("fill", pal.muted).text(lab);
    if (i === axis.length - 1) {
      g.append("line").attr("x1", x(lab) + x.bandwidth()).attr("x2", x(lab) + x.bandwidth()).attr("y1", 0).attr("y2", h).attr("stroke", pal.grid);
    }
  });
  items.forEach((it, i) => {
    const start = Number(it.start) || 0;
    const end = Math.max(start + 1, Number(it.end) || start + 1);
    const x0 = x(axis[Math.max(0, Math.min(axis.length - 1, start))]);
    const last = axis[Math.max(0, Math.min(axis.length - 1, end - 1))];
    const x1 = x(last) + x.bandwidth();
    g.append("rect")
      .attr("x", x0)
      .attr("y", y(it.label))
      .attr("width", Math.max(8, x1 - x0))
      .attr("height", y.bandwidth())
      .attr("rx", 2)
      .attr("fill", pal.series[i % pal.series.length]);
  });
  g.append("g")
    .call(d3.axisLeft(y).tickSize(0).tickPadding(8))
    .call((s) => s.select(".domain").remove())
    .call((s) => s.selectAll("text").attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.ink));
  (data.milestones || []).forEach((m) => {
    const lab = axis[Math.max(0, Math.min(axis.length - 1, Number(m.at)))];
    const cx = x(lab) + x.bandwidth() / 2;
    g.append("path").attr("d", d3.symbol().type(d3.symbolDiamond).size(70)()).attr("transform", `translate(${cx},-2)`).attr("fill", pal.negative);
    g.append("text").attr("x", cx).attr("y", h + 16).attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "10px").attr("fill", pal.negative).text(m.label);
  });
}

import { EXTRA_RENDERERS } from "./extra.js";
import { FINANCE_RENDERERS } from "./finance.js";
import { COMPLEX_RENDERERS } from "./complex.js";
import { PRO_RENDERERS } from "./pro.js";
import { normalizeChartData } from "../lib/chartData.js";

const RENDERERS = {
  waterfall: renderWaterfall,
  stacked_waterfall: renderStackedWaterfall,
  stacked_bar: (c, d, p, u) => renderStackedBar(c, d, p, u, false),
  "100_stacked": (c, d, p, u) => renderStackedBar(c, d, p, u, true),
  horizontal_bar: renderHorizontalBar,
  grouped_bar: renderGroupedBar,
  grouped_horizontal: renderGroupedBar,
  stacked_horizontal: (c, d, p, u) => renderStackedBar(c, d, p, u, false),
  "100_stacked_horizontal": (c, d, p, u) => renderStackedBar(c, d, p, u, true),
  waterfall_horizontal: renderWaterfall,
  tornado: renderTornado,
  diverging_bar: renderTornado,
  population_pyramid: renderTornado,
  marimekko: renderMarimekko,
  line_trend: renderLineTrend,
  step_line: renderLineTrend,
  bump: renderLineTrend,
  area_stacked: renderAreaStacked,
  area_100: renderAreaStacked,
  streamgraph: renderAreaStacked,
  pie_donut: renderPieDonut,
  nested_donut: (c, d, p) =>
    renderPieDonut(c, { items: (d.series || d.items || []).map((s) => ({ label: s.name || s.label, value: s.value ?? d3.sum(s.values || []) })), donut: true }, p),
  scatter_bubble: renderScatter,
  quadrant: (c, d, p) => renderScatter(c, { ...d, quadrants: true }, p),
  hexbin: renderScatter,
  connected_scatter: renderScatter,
  histogram: renderHorizontalBar,
  combo: renderCombo,
  funnel: renderFunnel,
  gantt: renderGantt,
  timeline: renderGantt,
  ...EXTRA_RENDERERS,
  ...FINANCE_RENDERERS,
  ...COMPLEX_RENDERERS,
  ...PRO_RENDERERS,
};

export function renderChart(container, chart, pal) {
  if (!container || !chart) return false;
  const data = normalizeChartData(chart.chartType, chart.data || {});
  const fn = RENDERERS[chart.chartType];
  if (!fn) return false;
  try {
    fn(container, data, pal, chart.unit || "");
    const drawn = container.querySelectorAll("rect, path, circle, line, text, polygon");
    return drawn.length > 0;
  } catch (e) {
    console.error(chart.chartType, e);
    d3.select(container).selectAll("*").remove();
    d3.select(container).append("div").style("padding", "24px").style("color", "#a00").text(`Could not render ${chart.chartType}`);
    return false;
  }
}
