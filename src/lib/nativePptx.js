import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";
import { fmt, signed } from "./format.js";
import { chartToTable } from "./table.js";
import { CF_PREFIX, CF_JSON_PATH } from "./pptxImport.js";
import { PALETTES } from "../theme.js";

const hex = (c) => String(c || "051C2C").replace("#", "").toUpperCase();

const PLOT = { x: 0.42, y: 1.12, w: 12.5, h: 5.5 };

function chrome(slide, s, pal, pptx) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.07,
    fill: { color: hex(pal.primary) },
    line: { color: hex(pal.primary) },
  });
  slide.addText(s.title || "", {
    x: 0.4,
    y: 0.2,
    w: 12.5,
    h: 0.52,
    fontSize: 20,
    fontFace: pal.fontFace || "Calibri",
    bold: true,
    color: hex(pal.ink),
    valign: "middle",
  });
  slide.addText(s.subtitle || "", {
    x: 0.4,
    y: 0.72,
    w: 12.5,
    h: 0.28,
    fontSize: 12,
    fontFace: pal.fontFace || "Calibri",
    color: hex(pal.muted),
  });
  slide.addText(s.source || "Source: ChartForge", {
    x: 0.4,
    y: 7.14,
    w: 9.2,
    h: 0.22,
    fontSize: 10,
    fontFace: "Calibri",
    color: "8C8C8C",
  });
  const payload = {
    title: s.title,
    subtitle: s.subtitle,
    source: s.source,
    insight: s.insight,
    chart: s.chart,
  };
  slide.addNotes(`${CF_PREFIX}${JSON.stringify(payload)}\nCHARTFORGE_END`);
}

function chartOpts(pal, extra = {}) {
  return {
    x: PLOT.x,
    y: PLOT.y,
    w: PLOT.w,
    h: PLOT.h,
    showValue: true,
    showLegend: true,
    legendPos: "r",
    chartColors: pal.series.map(hex),
    chartArea: { fill: { color: "FFFFFF" } },
    fontFace: "Calibri",
    catAxisLabelColor: hex(pal.ink),
    valAxisLabelColor: hex(pal.muted),
    catAxisLabelFontSize: 11,
    valAxisLabelFontSize: 10,
    dataBorder: { pt: 0, color: "FFFFFF" },
    valGridLine: { color: hex(pal.grid), style: "solid", size: 0.5 },
    valAxisMinVal: 0,
    barGapWidthPct: 60,
    ...extra,
  };
}

function seriesFromCategories(data) {
  const labels = (data.categories || []).map((c) => (typeof c === "string" ? c : c.label));
  return (data.series || []).map((s) => ({
    name: s.name,
    labels,
    values: (s.values || []).map(Number),
  }));
}

function waterfallSeries(items) {
  const labels = items.map((i) => i.label);
  const base = [];
  const up = [];
  const down = [];
  const total = [];
  let running = 0;
  items.forEach((it) => {
    const type = String(it.type || "").toLowerCase();
    const v = Number(it.value) || 0;
    if (type === "total") {
      base.push(0);
      up.push(0);
      down.push(0);
      total.push(v);
      running = v;
    } else if (v >= 0) {
      base.push(running);
      up.push(v);
      down.push(0);
      total.push(0);
      running += v;
    } else {
      running += v;
      base.push(running);
      up.push(0);
      down.push(-v);
      total.push(0);
    }
  });
  return [
    { name: "_base", labels, values: base },
    { name: "Increase", labels, values: up },
    { name: "Decrease", labels, values: down },
    { name: "Total", labels, values: total },
  ];
}

function addNativeChart(slide, pptx, chart, pal) {
  const d = chart.data || {};
  const type = chart.chartType;
  const o = chartOpts(pal);

  if (type === "grouped_bar" && d.series) {
    slide.addChart(pptx.ChartType.bar, seriesFromCategories(d), { ...o, barGrouping: "clustered", barDir: "col" });
    return true;
  }
  if (type === "stacked_bar" && d.series) {
    slide.addChart(pptx.ChartType.bar, seriesFromCategories(d), { ...o, barGrouping: "stacked", barDir: "col" });
    return true;
  }
  if (type === "100_stacked" && d.series) {
    slide.addChart(pptx.ChartType.bar, seriesFromCategories(d), { ...o, barGrouping: "percentStacked", barDir: "col" });
    return true;
  }
  if (type === "horizontal_bar" && d.items) {
    const labels = d.items.map((i) => i.label);
    const values = d.items.map((i) => Number(i.value) || 0);
    slide.addChart(pptx.ChartType.bar, [{ name: chart.unit || "Value", labels, values }], {
      ...o,
      barGrouping: "clustered",
      barDir: "bar",
      showLegend: false,
      chartColors: [hex(pal.primary)],
    });
    return true;
  }
  if (type === "line_trend" && d.series) {
    const labels = d.xLabels || [];
    const series = d.series.map((s) => ({ name: s.name, labels, values: (s.values || []).map(Number) }));
    slide.addChart(pptx.ChartType.line, series, { ...o, lineDataSymbol: "circle", showValue: true });
    return true;
  }
  if (type === "area_stacked" && d.series) {
    const labels = d.xLabels || [];
    const series = d.series.map((s) => ({ name: s.name, labels, values: (s.values || []).map(Number) }));
    slide.addChart(pptx.ChartType.area, series, { ...o, barGrouping: "stacked" });
    return true;
  }
  if (type === "pie_donut" && d.items) {
    const labels = d.items.map((i) => i.label);
    const values = d.items.map((i) => Number(i.value) || 0);
    slide.addChart(d.donut === false ? pptx.ChartType.pie : pptx.ChartType.doughnut, [{ name: "Share", labels, values }], {
      ...o,
      showPercent: true,
      showLegend: true,
    });
    return true;
  }
  if (type === "scatter_bubble" && d.points) {
    const labels = d.points.map((p) => p.label);
    slide.addChart(pptx.ChartType.bubble, [
      {
        name: "Portfolio",
        labels,
        values: d.points.map((p) => Number(p.x) || 0),
        sizes: d.points.map((p) => Number(p.size) || 20),
      },
    ], { ...o, showValue: false, showLegend: false });
    return true;
  }
  if (type === "combo" && d.categories) {
    const labels = d.categories;
    slide.addChart(
      [
        {
          type: pptx.ChartType.bar,
          data: [{ name: d.bars?.name || "Bars", labels, values: (d.bars?.values || []).map(Number) }],
          options: { barGrouping: "clustered", barDir: "col" },
        },
        {
          type: pptx.ChartType.line,
          data: [{ name: d.line?.name || "Line", labels, values: (d.line?.values || []).map(Number) }],
          options: { secondaryValAxis: true },
        },
      ],
      {
        ...o,
        chartColors: [hex(pal.primary), hex(pal.negative)],
      }
    );
    return true;
  }
  if (type === "stacked_waterfall" && d.items) {
    const labels = d.items.map((i) => i.label);
    const names = [...new Set(d.items.flatMap((i) => (i.segments || []).map((s) => s.name)))];
    const series = names.map((name) => ({
      name,
      labels,
      values: d.items.map((it) => Number((it.segments || []).find((s) => s.name === name)?.value) || 0),
    }));
    slide.addChart(pptx.ChartType.bar, series, { ...o, barGrouping: "stacked", barDir: "col" });
    return true;
  }
  if (type === "waterfall" && d.items) {
    slide.addChart(pptx.ChartType.bar, waterfallSeries(d.items), {
      ...o,
      barGrouping: "stacked",
      barDir: "col",
      showLegend: false,
      chartColors: ["FFFFFF", hex(pal.positive), hex(pal.negative), hex(pal.primary)],
      valLabelFormatCode: "#,##0;-#,##0;",
    });
    return true;
  }
  return false;
}

function addShapeWaterfall(slide, pptx, chart, pal) {
  const items = chart.data?.items || [];
  if (!items.length) return;
  let running = 0;
  const bars = items.map((item) => {
    const value = Number(item.value) || 0;
    const type = String(item.type || "").toLowerCase();
    if (type === "total") {
      running = value;
      return { label: item.label, y0: 0, y1: value, value, kind: "total" };
    }
    const y0 = running;
    running += value;
    return { label: item.label, y0, y1: running, value, kind: value >= 0 ? "increase" : "decrease" };
  });
  const yMin = Math.min(0, ...bars.map((b) => Math.min(b.y0, b.y1)));
  const yMax = Math.max(...bars.map((b) => Math.max(b.y0, b.y1))) * 1.12 || 1;
  const span = yMax - yMin || 1;
  const n = bars.length;
  const gap = 0.12;
  const barW = Math.min(1.15, (PLOT.w - gap * n) / n);
  const plotH = PLOT.h - 0.45;
  bars.forEach((b, i) => {
    const x = PLOT.x + i * (barW + gap);
    const top = Math.max(b.y0, b.y1);
    const bot = Math.min(b.y0, b.y1);
    const h = Math.max(0.08, ((top - bot) / span) * plotH);
    const y = PLOT.y + ((yMax - top) / span) * plotH;
    const color = b.kind === "total" ? pal.primary : b.kind === "increase" ? pal.positive : pal.negative;
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: barW,
      h,
      fill: { color: hex(color) },
      line: { color: hex(color) },
    });
    slide.addText(b.kind === "total" ? fmt(b.value, chart.unit) : signed(b.value, chart.unit), {
      x,
      y: y - 0.22,
      w: barW,
      h: 0.2,
      fontSize: 10,
      fontFace: "Calibri",
      bold: true,
      align: "center",
      color: hex(color),
    });
    slide.addText(b.label, {
      x,
      y: PLOT.y + plotH + 0.06,
      w: barW,
      h: 0.36,
      fontSize: 10,
      fontFace: "Calibri",
      align: "center",
      color: hex(pal.ink),
    });
  });
}

function addMekko(slide, pptx, chart, pal) {
  const cats = chart.data?.categories || [];
  const totalW = cats.reduce((a, c) => a + (Number(c.width) || 0), 0) || 1;
  const names = [...new Set(cats.flatMap((c) => (c.segments || []).map((s) => s.name)))];
  let xOff = PLOT.x;
  cats.forEach((cat) => {
    const catW = ((Number(cat.width) || 0) / totalW) * PLOT.w;
    const sum = (cat.segments || []).reduce((a, s) => a + (Number(s.value) || 0), 0) || 1;
    let yOff = PLOT.y;
    (cat.segments || []).forEach((seg, si) => {
      const h = ((Number(seg.value) || 0) / sum) * (PLOT.h - 0.4);
      const color = pal.series[si % pal.series.length];
      slide.addShape(pptx.ShapeType.rect, {
        x: xOff + 0.02,
        y: yOff,
        w: Math.max(0.15, catW - 0.04),
        h,
        fill: { color: hex(color) },
        line: { color: "FFFFFF", width: 0.75 },
      });
      if (h > 0.28 && catW > 0.7) {
        slide.addText(`${Math.round(seg.value)}%`, {
          x: xOff,
          y: yOff + h / 2 - 0.12,
          w: catW,
          h: 0.24,
          fontSize: 11,
          fontFace: "Calibri",
          bold: true,
          align: "center",
          color: "FFFFFF",
        });
      }
      yOff += h;
    });
    slide.addText(`${cat.label}\n${cat.width}%`, {
      x: xOff,
      y: PLOT.y + PLOT.h - 0.38,
      w: catW,
      h: 0.38,
      fontSize: 10,
      fontFace: "Calibri",
      align: "center",
      color: hex(pal.ink),
    });
    xOff += catW;
  });
  names.forEach((name, i) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: PLOT.x + i * 1.6,
      y: 6.85,
      w: 0.14,
      h: 0.14,
      fill: { color: hex(pal.series[i % pal.series.length]) },
    });
    slide.addText(name, {
      x: PLOT.x + 0.2 + i * 1.6,
      y: 6.82,
      w: 1.3,
      h: 0.2,
      fontSize: 10,
      fontFace: "Calibri",
      color: hex(pal.ink),
    });
  });
}

function addGantt(slide, pptx, chart, pal) {
  const axis = chart.data?.axis || [];
  const items = chart.data?.items || [];
  if (!axis.length || !items.length) return;
  const left = 1.8;
  const top = PLOT.y;
  const w = PLOT.w - 1.4;
  const rowH = Math.min(0.42, (PLOT.h - 0.4) / items.length);
  const colW = w / axis.length;
  axis.forEach((lab, i) => {
    slide.addText(lab, {
      x: PLOT.x + left + i * colW,
      y: top - 0.22,
      w: colW,
      h: 0.2,
      fontSize: 10,
      align: "center",
      fontFace: "Calibri",
      color: hex(pal.muted),
    });
  });
  items.forEach((it, i) => {
    const y = top + i * rowH;
    slide.addText(it.label, {
      x: PLOT.x,
      y,
      w: left - 0.08,
      h: rowH - 0.06,
      fontSize: 11,
      fontFace: "Calibri",
      valign: "middle",
      color: hex(pal.ink),
    });
    const start = Number(it.start) || 0;
    const end = Math.max(start + 1, Number(it.end) || start + 1);
    slide.addShape(pptx.ShapeType.rect, {
      x: PLOT.x + left + start * colW,
      y: y + 0.06,
      w: Math.max(0.12, (end - start) * colW - 0.04),
      h: rowH - 0.14,
      fill: { color: hex(pal.series[i % pal.series.length]) },
      line: { color: hex(pal.series[i % pal.series.length]) },
    });
  });
}

function addFunnel(slide, pptx, chart, pal) {
  const stages = chart.data?.stages || [];
  const max = Number(stages[0]?.value) || 1;
  const rowH = (PLOT.h - 0.2) / Math.max(stages.length, 1);
  stages.forEach((st, i) => {
    const frac = (Number(st.value) || 0) / max;
    const w = Math.max(1.2, PLOT.w * frac * 0.85);
    const x = PLOT.x + (PLOT.w - w) / 2;
    const y = PLOT.y + i * rowH;
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: y + 0.05,
      w,
      h: rowH - 0.1,
      fill: { color: hex(pal.series[i % pal.series.length]) },
    });
    slide.addText(`${st.label}   ${fmt(st.value, chart.unit)}`, {
      x,
      y: y + 0.05,
      w,
      h: rowH - 0.1,
      fontSize: 12,
      fontFace: "Calibri",
      bold: true,
      align: "center",
      valign: "middle",
      color: "FFFFFF",
    });
  });
}

function addTornado(slide, pptx, chart, pal) {
  const cats = chart.data?.categories || [];
  const left = chart.data?.left || { values: [] };
  const right = chart.data?.right || { values: [] };
  const max = Math.max(1, ...(left.values || []), ...(right.values || []));
  const mid = PLOT.x + PLOT.w / 2;
  const barW = PLOT.w / 2 - 1.1;
  const rowH = (PLOT.h - 0.3) / Math.max(cats.length, 1);
  slide.addText(left.name || "Left", {
    x: PLOT.x,
    y: PLOT.y - 0.05,
    w: barW,
    h: 0.22,
    align: "right",
    bold: true,
    fontSize: 12,
    fontFace: "Calibri",
    color: hex(pal.secondary),
  });
  slide.addText(right.name || "Right", {
    x: mid + 0.4,
    y: PLOT.y - 0.05,
    w: barW,
    h: 0.22,
    bold: true,
    fontSize: 12,
    fontFace: "Calibri",
    color: hex(pal.primary),
  });
  cats.forEach((cat, i) => {
    const lv = Number(left.values?.[i]) || 0;
    const rv = Number(right.values?.[i]) || 0;
    const y = PLOT.y + 0.28 + i * rowH;
    const lw = (lv / max) * barW;
    const rw = (rv / max) * barW;
    slide.addShape(pptx.ShapeType.rect, {
      x: mid - 0.35 - lw,
      y,
      w: lw,
      h: rowH - 0.12,
      fill: { color: hex(pal.secondary) },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: mid + 0.35,
      y,
      w: rw,
      h: rowH - 0.12,
      fill: { color: hex(pal.primary) },
    });
    slide.addText(cat, {
      x: mid - 0.32,
      y,
      w: 0.64,
      h: rowH - 0.12,
      align: "center",
      valign: "middle",
      fontSize: 10,
      fontFace: "Calibri",
      color: hex(pal.ink),
    });
    slide.addText(fmt(lv, chart.unit), {
      x: mid - 0.35 - lw - 0.7,
      y,
      w: 0.68,
      h: rowH - 0.12,
      align: "right",
      valign: "middle",
      fontSize: 10,
      fontFace: "Calibri",
      color: hex(pal.secondary),
    });
    slide.addText(fmt(rv, chart.unit), {
      x: mid + 0.35 + rw + 0.04,
      y,
      w: 0.68,
      h: rowH - 0.12,
      valign: "middle",
      fontSize: 10,
      fontFace: "Calibri",
      color: hex(pal.primary),
    });
  });
}

function addDataTable(slide, pptx, chart, pal) {
  const table = chartToTable(chart);
  if (!table.rows?.length) return;
  const rows = [
    table.columns.map((c) => ({
      text: String(c),
      options: { bold: true, fill: { color: "F4F4F1" }, color: hex(pal.ink), fontSize: 9, fontFace: "Calibri" },
    })),
    ...table.rows.map((r) =>
      r.map((c) => ({
        text: String(c ?? ""),
        options: { fontSize: 9, fontFace: "Calibri", color: hex(pal.ink) },
      }))
    ),
  ];
  slide.addTable(rows, {
    x: 0.4,
    y: 6.72,
    w: 12.5,
    h: 0.38,
    border: [{ pt: 0.25, color: "D0D0D0" }],
    colW: table.columns.map(() => 12.5 / table.columns.length),
    valign: "middle",
  });
}

function addChartObject(slide, pptx, chart, pal) {
  const native = addNativeChart(slide, pptx, chart, pal);
  if (native) return;
  const type = chart.chartType;
  if (type === "waterfall" || type === "stacked_waterfall") addShapeWaterfall(slide, pptx, chart, pal);
  else if (type === "marimekko") addMekko(slide, pptx, chart, pal);
  else if (type === "gantt") addGantt(slide, pptx, chart, pal);
  else if (type === "funnel") addFunnel(slide, pptx, chart, pal);
  else if (type === "tornado") addTornado(slide, pptx, chart, pal);
  else addDataTable(slide, pptx, chart, pal);
}

export async function exportNativeDeck(deck, paletteKey, customPal) {
  const pal = customPal || PALETTES[paletteKey] || PALETTES.mckinsey;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "ChartForge";
  pptx.title = deck.name || "ChartForge deck";
  pptx.subject = "Editable consulting charts (native Office objects, not images)";

  (deck.slides || []).forEach((s) => {
    const slide = pptx.addSlide();
    chrome(slide, s, pal, pptx);
    if (s.chart) addChartObject(slide, pptx, s.chart, pal);
    else if (s.body || (s.originalTexts || []).length) {
      const body = s.body || (s.originalTexts || []).slice(1).join("\n");
      slide.addText(body, {
        x: 0.5,
        y: 1.2,
        w: 12.3,
        h: 5.6,
        fontSize: 14,
        fontFace: "Calibri",
        color: hex(pal.ink),
        valign: "top",
      });
    }
  });

  const blob = await pptx.write({ outputType: "blob" });
  const zip = await JSZip.loadAsync(blob);
  zip.file(
    CF_JSON_PATH,
    JSON.stringify({
      version: 1,
      palette: paletteKey,
      name: deck.name,
      insights: deck.insights || null,
      slides: deck.slides,
    })
  );
  const out = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(out);
  a.download = (deck.name || "ChartForge").replace(/\.pptx$/i, "") + "_ChartForge.pptx";
  a.click();
}
