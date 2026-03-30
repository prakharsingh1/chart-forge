import { useState, useRef, useCallback, useEffect } from "react";
import * as d3 from "d3";
import Papa from "papaparse";
import * as XLSX from "xlsx";

/* ═══════════════════════════════════════════════════
   CONSULTING COLOR PALETTES
   ═══════════════════════════════════════════════════ */
const PALETTES = {
  mckinsey: { primary: "#003A70", secondary: "#0072CE", accent: "#00A3E0", positive: "#43B02A", negative: "#DA291C", neutral: "#A7A8AA", series: ["#003A70","#0072CE","#00A3E0","#6ECEB2","#43B02A","#FFB81C","#E87722","#DA291C","#6D2077","#A7A8AA"] },
  bain: { primary: "#CC0000", secondary: "#1B365D", accent: "#00629B", positive: "#00629B", negative: "#CC0000", neutral: "#97999B", series: ["#CC0000","#E31937","#FF6B35","#1B365D","#00629B","#71C5E8","#B7312C","#4A4F55","#97999B","#D5D6D2"] },
  bcg: { primary: "#00875A", secondary: "#004C45", accent: "#2B9F78", positive: "#00875A", negative: "#E76F51", neutral: "#6B6B8D", series: ["#00875A","#2B9F78","#55B790","#004C45","#007A5E","#A8D5BA","#1A1A2E","#3D3D5C","#6B6B8D","#D4D4E3"] },
  thinkcell: { primary: "#1B3A5C", secondary: "#4A7FB5", accent: "#7BAFD4", positive: "#5B8C5A", negative: "#C0504D", neutral: "#808080", series: ["#1B3A5C","#4A7FB5","#7BAFD4","#A8C5DA","#5B8C5A","#8DB580","#C0504D","#D4817E","#E8B960","#808080"] },
  dark: { primary: "#E8453C", secondary: "#FF8C42", accent: "#FFD166", positive: "#06D6A0", negative: "#E8453C", neutral: "#A7A8AA", series: ["#E8453C","#FF8C42","#FFD166","#06D6A0","#118AB2","#073B4C","#7209B7","#F72585","#4CC9F0","#80ED99"] },
  monochrome: { primary: "#1a1a2e", secondary: "#404066", accent: "#66669e", positive: "#404066", negative: "#1a1a2e", neutral: "#9999c2", series: ["#1a1a2e","#2d2d4a","#404066","#535382","#66669e","#8080b3","#9999c2","#b3b3d1","#cccce0","#e6e6f0"] },
};

/* ═══════════════════════════════════════════════════
   CHART TYPE DEFINITIONS
   ═══════════════════════════════════════════════════ */
const CHART_TYPES = [
  { id: "waterfall", name: "Waterfall / Bridge", icon: "📊", desc: "EBIT bridges, revenue walks, cost breakdowns with floating bars and connectors" },
  { id: "stacked_waterfall", name: "Stacked Waterfall", icon: "📊", desc: "Multi-segment waterfall showing composition within each step" },
  { id: "stacked_bar", name: "Stacked Bar", icon: "📊", desc: "Compare composition across categories with segment labels" },
  { id: "100_stacked", name: "100% Stacked Bar", icon: "📊", desc: "Show proportional breakdown with percentage labels" },
  { id: "horizontal_bar", name: "Horizontal Bar (Ranked)", icon: "📊", desc: "Sorted horizontal bars for ranking comparisons" },
  { id: "grouped_bar", name: "Grouped / Clustered Bar", icon: "📊", desc: "Side-by-side multi-series comparison" },
  { id: "tornado", name: "Tornado / Butterfly", icon: "🦋", desc: "Two-sided comparison (e.g., male vs female, pros vs cons)" },
  { id: "marimekko", name: "Marimekko / Mekko", icon: "📊", desc: "Variable-width bars showing market share and size" },
  { id: "line_trend", name: "Multi-Line Trend", icon: "📈", desc: "Time series with CAGR annotations and target lines" },
  { id: "area_stacked", name: "Stacked Area", icon: "📈", desc: "Composition trends over time" },
  { id: "pie_donut", name: "Pie / Donut", icon: "🍩", desc: "Share of total with callout labels" },
  { id: "scatter_bubble", name: "Scatter / Bubble", icon: "⚬", desc: "Correlation with optional bubble size" },
  { id: "combo", name: "Combo (Bar + Line)", icon: "📊", desc: "Dual-axis bar and line overlay" },
  { id: "funnel", name: "Funnel", icon: "🔻", desc: "Conversion funnel with stage labels and drop-off rates" },
];

/* ═══════════════════════════════════════════════════
   FILE EXTRACTION (PDF via Gemini, Excel, CSV)
   ═══════════════════════════════════════════════════ */
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}

async function extractPdfWithGemini(apiKey, file) {
  const b64 = await fileToBase64(file);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [
        { inlineData: { mimeType: "application/pdf", data: b64 } },
        { text: `Extract ALL content from this PDF. I need EVERYTHING:
1. ALL text, headings, paragraphs, footnotes, captions
2. ALL numbers, percentages, statistics, currency values
3. ALL tables - reproduce in markdown table format with exact numbers
4. ALL charts/graphs - describe axes, data points, values shown
5. ALL lists, bullet points, key findings

Format:
TITLE: [title]
FULL TEXT: [all text in order]
TABLES: [markdown tables with exact data]
NUMERICAL DATA: [all quantifiable data points]
CHARTS DESCRIBED: [describe every chart with data values]

Be EXHAUSTIVE. Extract EVERY data point.` }
      ]}], generationConfig: { temperature: 0.1, maxOutputTokens: 16384 } })
    }
  );
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API error ${res.status}`); }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function tryParseTablesFromText(text) {
  const rows = [], columns = [];
  const tableLines = text.match(/\|(.+)\|/g);
  if (tableLines && tableLines.length >= 3) {
    const headers = tableLines[0].split("|").map(h => h.trim()).filter(h => h && !h.match(/^[-:]+$/));
    if (headers.length > 0) {
      columns.push(...headers);
      for (let i = 1; i < tableLines.length; i++) {
        const cells = tableLines[i].split("|").map(c => c.trim()).filter(c => c && !c.match(/^[-:]+$/));
        if (cells.length >= headers.length - 1) {
          const row = {};
          headers.forEach((h, j) => {
            const val = cells[j] || "";
            const num = parseFloat(val.replace(/[,%$€£₹\s]/g, ""));
            row[h] = isNaN(num) ? val : num;
          });
          rows.push(row);
        }
      }
    }
  }
  return { data: rows, columns };
}

async function extractTextFromFile(file, apiKey) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "csv" || ext === "tsv") {
    return new Promise((resolve) => {
      Papa.parse(file, { header: true, skipEmptyLines: true, dynamicTyping: true,
        complete: (r) => resolve({ text: JSON.stringify(r.data, null, 2), data: r.data, columns: r.meta.fields || [], type: "tabular" }),
        error: () => resolve({ text: "", data: [], columns: [], type: "tabular" }) });
    });
  }
  if (["xlsx", "xls", "xlsm"].includes(ext)) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: "array" });
          let allData = [], allCols = [], allText = "";
          wb.SheetNames.forEach((name) => {
            const json = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
            const cols = json.length > 0 ? Object.keys(json[0]) : [];
            allText += `\n--- Sheet: ${name} ---\n${JSON.stringify(json, null, 2)}\n`;
            if (json.length > allData.length) { allData = json; allCols = cols; }
          });
          resolve({ text: allText, data: allData, columns: allCols, type: "tabular" });
        } catch { resolve({ text: "", data: [], columns: [], type: "tabular" }); }
      };
      reader.readAsArrayBuffer(file);
    });
  }
  if (ext === "pdf") {
    const text = await extractPdfWithGemini(apiKey, file);
    const { data, columns } = tryParseTablesFromText(text);
    return { text, data, columns, type: data.length > 0 ? "tabular" : "document", pdfExtracted: true };
  }
  if (ext === "txt" || ext === "md") {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ text: e.target.result, data: [], columns: [], type: "document" });
      reader.readAsText(file);
    });
  }
  return { text: "", data: [], columns: [], type: "unknown" };
}

/* ═══════════════════════════════════════════════════
   GEMINI API CALLS
   ═══════════════════════════════════════════════════ */
async function geminiCall(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 16384 } }) }
  );
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `API error ${res.status}`); }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function extractInsights(apiKey, fc) {
  const prompt = `You are a McKinsey senior engagement manager. Analyze this document/data thoroughly.

${fc.pdfExtracted ? "Content extracted from PDF via Gemini:" : ""}
CONTENT: ${fc.text.slice(0, 14000)}
${fc.type === "tabular" && fc.data.length > 0 ? `COLUMNS: ${JSON.stringify(fc.columns)}\nSAMPLE (15 rows): ${JSON.stringify(fc.data.slice(0, 15), null, 2)}\nTOTAL ROWS: ${fc.data.length}` : ""}

Extract EVERY number and data point. Respond ONLY with valid JSON (no markdown):
{
  "title": "Brief title",
  "executive_summary": "2-3 sentence summary",
  "key_metrics": [{"name": "metric", "value": "value with unit", "trend": "up|down|stable"}],
  "insights": ["insight1", "insight2", "insight3", "insight4", "insight5"],
  "data_structure": { "has_time_series": bool, "has_categories": bool, "has_numeric_comparisons": bool, "primary_dimension": "desc", "key_measures": ["m1","m2"] },
  "extracted_data": [ {"category": "label", "values": {"metric1": 123, "metric2": 456}} ],
  "recommended_charts": [
    { "type": "waterfall|stacked_waterfall|stacked_bar|100_stacked|horizontal_bar|grouped_bar|tornado|marimekko|line_trend|area_stacked|pie_donut|scatter_bubble|combo|funnel",
      "title": "Chart title", "why": "Reason", "priority": 1 }
  ]
}
"extracted_data" is CRITICAL - structure ALL chartable data here.`;
  const text = await geminiCall(apiKey, prompt);
  return JSON.parse(text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
}

async function generateChartData(apiKey, fc, insights, selectedTypes, paletteKey, customInstr) {
  const pal = PALETTES[paletteKey] || PALETTES.thinkcell;
  const prompt = `You are a Think-Cell chart designer for McKinsey/BCG/Bain presentations. Generate chart DATA (not configs) for D3.js rendering.

CONTEXT: ${insights.executive_summary}
DATA: ${fc.type === "tabular" && fc.data.length > 0
    ? `Columns: ${JSON.stringify(fc.columns)}\nData (50 rows): ${JSON.stringify(fc.data.slice(0, 50), null, 2)}`
    : `Text: ${fc.text.slice(0, 8000)}`}
${insights.extracted_data ? `EXTRACTED: ${JSON.stringify(insights.extracted_data)}` : ""}
INSIGHTS: ${JSON.stringify(insights.insights)}
CHART TYPES REQUESTED: ${JSON.stringify(selectedTypes)}
${customInstr ? `CUSTOM: ${customInstr}` : ""}

For EACH requested chart type, return the exact data structure below. Respond ONLY with JSON array:

[
  {
    "id": "chart_1",
    "chartType": "waterfall|stacked_waterfall|stacked_bar|100_stacked|horizontal_bar|grouped_bar|tornado|marimekko|line_trend|area_stacked|pie_donut|scatter_bubble|combo|funnel",
    "title": "Descriptive title (like a slide headline)",
    "subtitle": "Supporting detail",
    "insight": "Key takeaway sentence",
    "unit": "$M|%|units|etc",
    "data": { ... }
  }
]

DATA STRUCTURES PER CHART TYPE:

waterfall: { "items": [{"label":"Start","value":1500,"type":"total"},{"label":"Growth","value":150,"type":"increase"},{"label":"Decline","value":-80,"type":"decrease"},{"label":"End","value":1570,"type":"total"}] }

stacked_waterfall: { "items": [{"label":"Q1","segments":[{"name":"Product A","value":50},{"name":"Product B","value":30}],"type":"increase"},{"label":"Total","segments":[{"name":"Total","value":180}],"type":"total"}] }

stacked_bar: { "categories": ["Cat1","Cat2"], "series": [{"name":"Seg1","values":[10,20]},{"name":"Seg2","values":[15,25]}] }

100_stacked: { "categories": ["Cat1","Cat2"], "series": [{"name":"Seg1","values":[40,55]},{"name":"Seg2","values":[60,45]}] }

horizontal_bar: { "items": [{"label":"Item1","value":100},{"label":"Item2","value":85}] }

grouped_bar: { "categories": ["Cat1","Cat2"], "series": [{"name":"2023","values":[100,120]},{"name":"2024","values":[110,140]}] }

tornado: { "categories": ["Cat1","Cat2"], "left": {"name":"Left","values":[50,30]}, "right": {"name":"Right","values":[60,40]} }

marimekko: { "categories": [{"label":"Seg1","width":40,"segments":[{"name":"A","value":60},{"name":"B","value":40}]},{"label":"Seg2","width":60,"segments":[{"name":"A","value":45},{"name":"B","value":55}]}] }

line_trend: { "xLabels": ["2020","2021","2022"], "series": [{"name":"Revenue","values":[100,120,150],"showCAGR":true}], "annotations": [{"type":"cagr","from":0,"to":2,"value":"22%"}] }

area_stacked: { "xLabels": ["2020","2021"], "series": [{"name":"A","values":[50,60]},{"name":"B","values":[30,40]}] }

pie_donut: { "items": [{"label":"Seg1","value":40},{"label":"Seg2","value":35},{"label":"Other","value":25}], "donut": true }

scatter_bubble: { "points": [{"label":"A","x":10,"y":20,"size":30}], "xLabel": "Revenue", "yLabel": "Growth" }

combo: { "categories": ["Q1","Q2"], "bars": {"name":"Revenue","values":[100,120]}, "line": {"name":"Margin %","values":[15,18]} }

funnel: { "stages": [{"label":"Awareness","value":10000},{"label":"Interest","value":6000},{"label":"Decision","value":2000},{"label":"Purchase","value":800}] }

RULES:
- Use REAL data from the document, never make up numbers
- Waterfall items must have type: total/increase/decrease
- Sort horizontal bars descending by value
- For 100% stacked, values per category must sum to 100
- Limit pie/donut to max 8 segments, group rest as "Other"
- Include CAGR annotations on line_trend when showing multi-year data
- All values should be numbers, not strings

Generate exactly ${selectedTypes.length} charts.`;

  const text = await geminiCall(apiKey, prompt);
  return JSON.parse(text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
}

/* ═══════════════════════════════════════════════════
   D3 CHART RENDERERS - Think-Cell Quality
   ═══════════════════════════════════════════════════ */

const FONT = "'DM Sans', 'Segoe UI', sans-serif";
const MONO = "'JetBrains Mono', monospace";

function fmt(v, unit) {
  if (v === undefined || v === null) return "";
  const abs = Math.abs(v);
  let s;
  if (abs >= 1e9) s = (v/1e9).toFixed(1) + "B";
  else if (abs >= 1e6) s = (v/1e6).toFixed(1) + "M";
  else if (abs >= 1e3) s = (v/1e3).toFixed(1) + "K";
  else s = Number.isInteger(v) ? v.toString() : v.toFixed(1);
  if (unit === "%" || unit === "percent") return s + "%";
  if (unit && unit.startsWith("$")) return "$" + s;
  if (unit === "€") return "€" + s;
  return s;
}

function renderWaterfall(container, chartData, pal, unit) {
  const items = chartData.items || [];
  if (!items.length) return;

  const W = container.clientWidth || 700;
  const H = 400;
  const M = { top: 40, right: 30, bottom: 80, left: 60 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;

  const svg = d3.select(container).append("svg").attr("width", W).attr("height", H).attr("viewBox", `0 0 ${W} ${H}`);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

  // Calculate running totals
  let running = 0;
  const bars = items.map((item, i) => {
    if (item.type === "total") {
      const b = { label: item.label, start: 0, end: item.value, value: item.value, type: "total" };
      running = item.value;
      return b;
    }
    const start = running;
    running += item.value;
    return { label: item.label, start: Math.min(start, running), end: Math.max(start, running), value: item.value, type: item.value >= 0 ? "increase" : "decrease", baseStart: start };
  });

  const allVals = bars.flatMap(b => [b.start, b.end]);
  const yMin = Math.min(0, ...allVals) * 1.05;
  const yMax = Math.max(...allVals) * 1.15;

  const x = d3.scaleBand().domain(bars.map(b => b.label)).range([0, w]).padding(0.25);
  const y = d3.scaleLinear().domain([yMin, yMax]).range([h, 0]);

  // Grid lines
  g.selectAll(".grid").data(y.ticks(6)).join("line").attr("class", "grid")
    .attr("x1", 0).attr("x2", w).attr("y1", d => y(d)).attr("y2", d => y(d))
    .attr("stroke", "#E8E6E0").attr("stroke-dasharray", "2,3");

  // Zero line
  if (yMin < 0) g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "#333").attr("stroke-width", 1);

  // Connector lines between bars
  for (let i = 0; i < bars.length - 1; i++) {
    const curr = bars[i];
    const nextBar = bars[i + 1];
    const currEnd = curr.type === "total" ? curr.end : (curr.value >= 0 ? curr.end : curr.start);
    const connY = y(curr.type === "total" ? curr.value : (curr.baseStart !== undefined ? curr.baseStart + curr.value : curr.end));
    g.append("line")
      .attr("x1", x(curr.label) + x.bandwidth())
      .attr("x2", x(nextBar.label))
      .attr("y1", connY).attr("y2", connY)
      .attr("stroke", "#999").attr("stroke-width", 1).attr("stroke-dasharray", "3,2");
  }

  // Bars
  const barG = g.selectAll(".bar").data(bars).join("g").attr("class", "bar");
  barG.append("rect")
    .attr("x", d => x(d.label))
    .attr("width", x.bandwidth())
    .attr("y", d => y(d.end))
    .attr("height", d => Math.max(1, Math.abs(y(d.start) - y(d.end))))
    .attr("fill", d => d.type === "total" ? pal.primary : d.type === "increase" ? pal.positive : pal.negative)
    .attr("rx", 1);

  // Value labels
  barG.append("text")
    .attr("x", d => x(d.label) + x.bandwidth() / 2)
    .attr("y", d => {
      if (d.type === "total") return y(d.value) - 6;
      return d.value >= 0 ? y(d.end) - 6 : y(d.start) - 6;
    })
    .attr("text-anchor", "middle")
    .attr("font-family", MONO).attr("font-size", "11px").attr("font-weight", "600")
    .attr("fill", d => d.type === "total" ? pal.primary : d.type === "increase" ? pal.positive : pal.negative)
    .text(d => (d.type !== "total" && d.value > 0 ? "+" : "") + fmt(d.value, unit));

  // X axis labels
  g.selectAll(".xlabel").data(bars).join("text").attr("class", "xlabel")
    .attr("x", d => x(d.label) + x.bandwidth() / 2)
    .attr("y", h + 16).attr("text-anchor", "middle")
    .attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#555")
    .each(function(d) {
      const words = d.label.split(/\s+/);
      const el = d3.select(this);
      if (words.length > 2) {
        el.text(words.slice(0, 2).join(" "));
        el.append("tspan").attr("x", x(d.label) + x.bandwidth() / 2).attr("dy", "1.1em").text(words.slice(2).join(" "));
      } else el.text(d.label);
    });

  // Y axis
  g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(d => fmt(d, unit)))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").attr("stroke", "none"))
    .call(g => g.selectAll("text").attr("font-family", MONO).attr("font-size", "10px").attr("fill", "#888"));
}

function renderStackedBar(container, chartData, pal, unit, is100) {
  const cats = chartData.categories || [];
  const series = chartData.series || [];
  if (!cats.length || !series.length) return;

  const W = container.clientWidth || 700;
  const H = 400;
  const M = { top: 40, right: 120, bottom: 60, left: 60 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;

  const svg = d3.select(container).append("svg").attr("width", W).attr("height", H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

  // Compute stacked data
  const stackData = cats.map((cat, ci) => {
    const row = { category: cat };
    let total = 0;
    series.forEach(s => { total += (s.values[ci] || 0); });
    series.forEach(s => {
      row[s.name] = is100 ? ((s.values[ci] || 0) / total * 100) : (s.values[ci] || 0);
    });
    return row;
  });

  const keys = series.map(s => s.name);
  const stack = d3.stack().keys(keys)(stackData);

  const x = d3.scaleBand().domain(cats).range([0, w]).padding(0.3);
  const yMax = is100 ? 100 : d3.max(stack[stack.length - 1], d => d[1]) * 1.1;
  const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);
  const color = d3.scaleOrdinal().domain(keys).range(pal.series);

  // Grid
  g.selectAll(".grid").data(y.ticks(5)).join("line")
    .attr("x1", 0).attr("x2", w).attr("y1", d => y(d)).attr("y2", d => y(d)).attr("stroke", "#E8E6E0").attr("stroke-dasharray", "2,3");

  // Bars
  stack.forEach((layer, li) => {
    g.selectAll(`.bar-${li}`).data(layer).join("rect")
      .attr("x", d => x(d.data.category)).attr("width", x.bandwidth())
      .attr("y", d => y(d[1])).attr("height", d => Math.max(0, y(d[0]) - y(d[1])))
      .attr("fill", color(keys[li])).attr("rx", 1);

    // Segment labels
    g.selectAll(`.lbl-${li}`).data(layer).join("text")
      .attr("x", d => x(d.data.category) + x.bandwidth() / 2)
      .attr("y", d => y(d[0]) + (y(d[0]) - y(d[1])) / 2 + 4)
      .attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "9px").attr("fill", "#fff").attr("font-weight", "600")
      .text(d => { const v = d[1] - d[0]; return (y(d[0]) - y(d[1])) > 18 ? fmt(v, is100 ? "%" : unit) : ""; });
  });

  // Axes
  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).tickSize(0).tickPadding(10))
    .call(g => g.select(".domain").attr("stroke", "#ccc"))
    .call(g => g.selectAll("text").attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#555"));

  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => fmt(d, is100 ? "%" : unit)))
    .call(g => g.select(".domain").remove()).call(g => g.selectAll(".tick line").remove())
    .call(g => g.selectAll("text").attr("font-family", MONO).attr("font-size", "10px").attr("fill", "#888"));

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${W - M.right + 12}, ${M.top})`);
  keys.forEach((k, i) => {
    const lg = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
    lg.append("rect").attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", color(k));
    lg.append("text").attr("x", 14).attr("y", 9).attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#555").text(k);
  });
}

function renderHorizontalBar(container, chartData, pal, unit) {
  const items = (chartData.items || []).sort((a, b) => b.value - a.value);
  if (!items.length) return;

  const W = container.clientWidth || 700;
  const H = Math.max(300, items.length * 36 + 80);
  const M = { top: 20, right: 80, bottom: 20, left: 120 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;

  const svg = d3.select(container).append("svg").attr("width", W).attr("height", H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

  const y = d3.scaleBand().domain(items.map(d => d.label)).range([0, h]).padding(0.3);
  const x = d3.scaleLinear().domain([0, d3.max(items, d => d.value) * 1.1]).range([0, w]);

  g.selectAll(".bar").data(items).join("rect")
    .attr("x", 0).attr("y", d => y(d.label)).attr("width", d => x(d.value)).attr("height", y.bandwidth())
    .attr("fill", (d, i) => pal.series[i % pal.series.length]).attr("rx", 2);

  g.selectAll(".lbl").data(items).join("text")
    .attr("x", d => x(d.value) + 6).attr("y", d => y(d.label) + y.bandwidth() / 2 + 4)
    .attr("font-family", MONO).attr("font-size", "11px").attr("fill", "#333").attr("font-weight", "600")
    .text(d => fmt(d.value, unit));

  g.append("g").call(d3.axisLeft(y).tickSize(0).tickPadding(8))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text").attr("font-family", FONT).attr("font-size", "11px").attr("fill", "#333"));
}

function renderGroupedBar(container, chartData, pal, unit) {
  const cats = chartData.categories || [];
  const series = chartData.series || [];
  if (!cats.length) return;

  const W = container.clientWidth || 700;
  const H = 400;
  const M = { top: 40, right: 120, bottom: 60, left: 60 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;

  const svg = d3.select(container).append("svg").attr("width", W).attr("height", H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

  const x0 = d3.scaleBand().domain(cats).range([0, w]).paddingInner(0.2);
  const x1 = d3.scaleBand().domain(series.map(s => s.name)).range([0, x0.bandwidth()]).padding(0.08);
  const yMax = d3.max(series, s => d3.max(s.values)) * 1.15;
  const y = d3.scaleLinear().domain([0, yMax]).range([h, 0]);
  const color = d3.scaleOrdinal().domain(series.map(s => s.name)).range(pal.series);

  g.selectAll(".grid").data(y.ticks(5)).join("line")
    .attr("x1", 0).attr("x2", w).attr("y1", d => y(d)).attr("y2", d => y(d)).attr("stroke", "#E8E6E0").attr("stroke-dasharray", "2,3");

  cats.forEach((cat, ci) => {
    series.forEach((s, si) => {
      const val = s.values[ci] || 0;
      g.append("rect").attr("x", x0(cat) + x1(s.name)).attr("y", y(val)).attr("width", x1.bandwidth()).attr("height", h - y(val))
        .attr("fill", color(s.name)).attr("rx", 1);
      g.append("text").attr("x", x0(cat) + x1(s.name) + x1.bandwidth() / 2).attr("y", y(val) - 5)
        .attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "9px").attr("fill", "#555").attr("font-weight", "600")
        .text(fmt(val, unit));
    });
  });

  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x0).tickSize(0).tickPadding(10))
    .call(g => g.select(".domain").attr("stroke", "#ccc"))
    .call(g => g.selectAll("text").attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#555"));
  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => fmt(d, unit)))
    .call(g => g.select(".domain").remove()).call(g => g.selectAll(".tick line").remove())
    .call(g => g.selectAll("text").attr("font-family", MONO).attr("font-size", "10px").attr("fill", "#888"));

  const legend = svg.append("g").attr("transform", `translate(${W - M.right + 12}, ${M.top})`);
  series.forEach((s, i) => {
    const lg = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
    lg.append("rect").attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", color(s.name));
    lg.append("text").attr("x", 14).attr("y", 9).attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#555").text(s.name);
  });
}

function renderTornado(container, chartData, pal, unit) {
  const cats = chartData.categories || [];
  const left = chartData.left || {};
  const right = chartData.right || {};
  if (!cats.length) return;

  const W = container.clientWidth || 700;
  const H = Math.max(300, cats.length * 40 + 80);
  const M = { top: 40, right: 30, bottom: 30, left: 30 };
  const mid = W / 2;
  const barW = (W - M.left - M.right) / 2 - 60;
  const svg = d3.select(container).append("svg").attr("width", W).attr("height", H);

  const y = d3.scaleBand().domain(cats).range([M.top + 20, H - M.bottom]).padding(0.25);
  const maxVal = Math.max(d3.max(left.values || []), d3.max(right.values || []));
  const xL = d3.scaleLinear().domain([0, maxVal * 1.15]).range([0, barW]);
  const xR = d3.scaleLinear().domain([0, maxVal * 1.15]).range([0, barW]);

  // Headers
  svg.append("text").attr("x", mid - 40).attr("y", M.top).attr("text-anchor", "end")
    .attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.secondary).attr("font-weight", "700").text(left.name || "Left");
  svg.append("text").attr("x", mid + 40).attr("y", M.top).attr("text-anchor", "start")
    .attr("font-family", FONT).attr("font-size", "12px").attr("fill", pal.primary).attr("font-weight", "700").text(right.name || "Right");

  cats.forEach((cat, i) => {
    const lv = (left.values || [])[i] || 0;
    const rv = (right.values || [])[i] || 0;
    // Left bar
    svg.append("rect").attr("x", mid - 20 - xL(lv)).attr("y", y(cat)).attr("width", xL(lv)).attr("height", y.bandwidth())
      .attr("fill", pal.secondary).attr("rx", 2);
    svg.append("text").attr("x", mid - 24 - xL(lv)).attr("y", y(cat) + y.bandwidth() / 2 + 4)
      .attr("text-anchor", "end").attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.secondary).attr("font-weight", "600")
      .text(fmt(lv, unit));
    // Right bar
    svg.append("rect").attr("x", mid + 20).attr("y", y(cat)).attr("width", xR(rv)).attr("height", y.bandwidth())
      .attr("fill", pal.primary).attr("rx", 2);
    svg.append("text").attr("x", mid + 24 + xR(rv)).attr("y", y(cat) + y.bandwidth() / 2 + 4)
      .attr("text-anchor", "start").attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.primary).attr("font-weight", "600")
      .text(fmt(rv, unit));
    // Center label
    svg.append("text").attr("x", mid).attr("y", y(cat) + y.bandwidth() / 2 + 4)
      .attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#333").attr("font-weight", "500")
      .text(cat);
  });
}

function renderLineTrend(container, chartData, pal, unit) {
  const labels = chartData.xLabels || [];
  const series = chartData.series || [];
  if (!labels.length) return;

  const W = container.clientWidth || 700;
  const H = 400;
  const M = { top: 30, right: 120, bottom: 50, left: 60 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;

  const svg = d3.select(container).append("svg").attr("width", W).attr("height", H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

  const x = d3.scalePoint().domain(labels).range([0, w]).padding(0.1);
  const allVals = series.flatMap(s => s.values);
  const y = d3.scaleLinear().domain([Math.min(0, d3.min(allVals)) * 0.9, d3.max(allVals) * 1.15]).range([h, 0]);
  const color = d3.scaleOrdinal().domain(series.map(s => s.name)).range(pal.series);

  g.selectAll(".grid").data(y.ticks(5)).join("line")
    .attr("x1", 0).attr("x2", w).attr("y1", d => y(d)).attr("y2", d => y(d)).attr("stroke", "#E8E6E0").attr("stroke-dasharray", "2,3");

  series.forEach((s, si) => {
    const line = d3.line().x((d, i) => x(labels[i])).y(d => y(d)).curve(d3.curveMonotoneX);
    g.append("path").datum(s.values).attr("d", line).attr("fill", "none")
      .attr("stroke", color(s.name)).attr("stroke-width", 2.5);
    // Dots + labels
    s.values.forEach((v, i) => {
      g.append("circle").attr("cx", x(labels[i])).attr("cy", y(v)).attr("r", 4).attr("fill", color(s.name)).attr("stroke", "#fff").attr("stroke-width", 2);
      g.append("text").attr("x", x(labels[i])).attr("y", y(v) - 10).attr("text-anchor", "middle")
        .attr("font-family", MONO).attr("font-size", "10px").attr("fill", color(s.name)).attr("font-weight", "600").text(fmt(v, unit));
    });
  });

  // CAGR annotations
  (chartData.annotations || []).forEach(ann => {
    if (ann.type === "cagr" && ann.from !== undefined && ann.to !== undefined) {
      const x1 = x(labels[ann.from]), x2 = x(labels[ann.to]);
      const yTop = M.top - 15;
      svg.append("line").attr("x1", x1 + M.left).attr("x2", x2 + M.left).attr("y1", yTop).attr("y2", yTop)
        .attr("stroke", pal.primary).attr("stroke-width", 1.5).attr("marker-end", "url(#arrowhead)");
      svg.append("text").attr("x", (x1 + x2) / 2 + M.left).attr("y", yTop - 4).attr("text-anchor", "middle")
        .attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.primary).attr("font-weight", "700")
        .text(`CAGR: ${ann.value}`);
      // Arrow def
      svg.append("defs").append("marker").attr("id", "arrowhead").attr("viewBox", "0 0 10 7").attr("refX", 10).attr("refY", 3.5)
        .attr("markerWidth", 8).attr("markerHeight", 6).attr("orient", "auto")
        .append("polygon").attr("points", "0 0, 10 3.5, 0 7").attr("fill", pal.primary);
    }
  });

  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).tickSize(0).tickPadding(10))
    .call(g => g.select(".domain").attr("stroke", "#ccc"))
    .call(g => g.selectAll("text").attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#555"));
  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => fmt(d, unit)))
    .call(g => g.select(".domain").remove()).call(g => g.selectAll(".tick line").remove())
    .call(g => g.selectAll("text").attr("font-family", MONO).attr("font-size", "10px").attr("fill", "#888"));

  const legend = svg.append("g").attr("transform", `translate(${W - M.right + 12}, ${M.top})`);
  series.forEach((s, i) => {
    const lg = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
    lg.append("line").attr("x1", 0).attr("x2", 16).attr("y1", 5).attr("y2", 5).attr("stroke", color(s.name)).attr("stroke-width", 2.5);
    lg.append("circle").attr("cx", 8).attr("cy", 5).attr("r", 3).attr("fill", color(s.name));
    lg.append("text").attr("x", 22).attr("y", 9).attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#555").text(s.name);
  });
}

function renderPieDonut(container, chartData, pal) {
  const items = chartData.items || [];
  if (!items.length) return;

  const W = container.clientWidth || 700;
  const H = 380;
  const radius = Math.min(W, H) / 2 - 60;
  const innerR = chartData.donut ? radius * 0.55 : 0;

  const svg = d3.select(container).append("svg").attr("width", W).attr("height", H);
  const g = svg.append("g").attr("transform", `translate(${W / 2 - 40},${H / 2})`);
  const color = d3.scaleOrdinal().domain(items.map(d => d.label)).range(pal.series);
  const pie = d3.pie().value(d => d.value).sort(null).padAngle(0.02);
  const arc = d3.arc().innerRadius(innerR).outerRadius(radius);
  const labelArc = d3.arc().innerRadius(radius + 20).outerRadius(radius + 20);

  const total = d3.sum(items, d => d.value);

  g.selectAll("path").data(pie(items)).join("path").attr("d", arc)
    .attr("fill", d => color(d.data.label)).attr("stroke", "#fff").attr("stroke-width", 2);

  g.selectAll(".label").data(pie(items)).join("text")
    .attr("transform", d => `translate(${labelArc.centroid(d)})`)
    .attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#333")
    .text(d => { const pct = (d.data.value / total * 100).toFixed(0); return pct > 4 ? `${d.data.label} ${pct}%` : ""; });

  // Center label for donut
  if (chartData.donut) {
    g.append("text").attr("text-anchor", "middle").attr("dy", "-0.2em")
      .attr("font-family", MONO).attr("font-size", "22px").attr("fill", pal.primary).attr("font-weight", "700").text(fmt(total));
    g.append("text").attr("text-anchor", "middle").attr("dy", "1.2em")
      .attr("font-family", FONT).attr("font-size", "11px").attr("fill", "#888").text("Total");
  }
}

function renderFunnel(container, chartData, pal) {
  const stages = chartData.stages || [];
  if (!stages.length) return;

  const W = container.clientWidth || 700;
  const H = 400;
  const M = { top: 30, bottom: 20, left: 120, right: 80 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;
  const maxVal = stages[0]?.value || 1;

  const svg = d3.select(container).append("svg").attr("width", W).attr("height", H);
  const stageH = h / stages.length;

  stages.forEach((stage, i) => {
    const pct = stage.value / maxVal;
    const barW = w * pct;
    const xOff = M.left + (w - barW) / 2;

    svg.append("rect").attr("x", xOff).attr("y", M.top + i * stageH + 2).attr("width", barW).attr("height", stageH - 4)
      .attr("fill", pal.series[i % pal.series.length]).attr("rx", 3);

    svg.append("text").attr("x", M.left - 8).attr("y", M.top + i * stageH + stageH / 2 + 4)
      .attr("text-anchor", "end").attr("font-family", FONT).attr("font-size", "11px").attr("fill", "#333").attr("font-weight", "500")
      .text(stage.label);

    svg.append("text").attr("x", W / 2).attr("y", M.top + i * stageH + stageH / 2 + 4)
      .attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "12px").attr("fill", "#fff").attr("font-weight", "700")
      .text(fmt(stage.value));

    // Drop-off rate
    if (i > 0) {
      const dropoff = ((1 - stage.value / stages[i - 1].value) * 100).toFixed(0);
      svg.append("text").attr("x", W - M.right + 10).attr("y", M.top + i * stageH + stageH / 2 + 4)
        .attr("text-anchor", "start").attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.negative)
        .text(`-${dropoff}%`);
    }
  });
}

function renderCombo(container, chartData, pal, unit) {
  const cats = chartData.categories || [];
  const bars = chartData.bars || {};
  const line = chartData.line || {};
  if (!cats.length) return;

  const W = container.clientWidth || 700;
  const H = 400;
  const M = { top: 30, right: 80, bottom: 60, left: 60 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;

  const svg = d3.select(container).append("svg").attr("width", W).attr("height", H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

  const x = d3.scaleBand().domain(cats).range([0, w]).padding(0.3);
  const yL = d3.scaleLinear().domain([0, d3.max(bars.values || [0]) * 1.15]).range([h, 0]);
  const yR = d3.scaleLinear().domain([0, d3.max(line.values || [0]) * 1.3]).range([h, 0]);

  g.selectAll(".grid").data(yL.ticks(5)).join("line")
    .attr("x1", 0).attr("x2", w).attr("y1", d => yL(d)).attr("y2", d => yL(d)).attr("stroke", "#E8E6E0").attr("stroke-dasharray", "2,3");

  // Bars
  g.selectAll(".bar").data(bars.values || []).join("rect")
    .attr("x", (d, i) => x(cats[i])).attr("y", d => yL(d)).attr("width", x.bandwidth()).attr("height", d => h - yL(d))
    .attr("fill", pal.primary).attr("rx", 2);

  g.selectAll(".barlbl").data(bars.values || []).join("text")
    .attr("x", (d, i) => x(cats[i]) + x.bandwidth() / 2).attr("y", d => yL(d) - 6)
    .attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.primary).attr("font-weight", "600")
    .text(d => fmt(d, unit));

  // Line
  const lineGen = d3.line().x((d, i) => x(cats[i]) + x.bandwidth() / 2).y(d => yR(d)).curve(d3.curveMonotoneX);
  g.append("path").datum(line.values || []).attr("d", lineGen).attr("fill", "none")
    .attr("stroke", pal.negative || pal.accent).attr("stroke-width", 2.5);
  (line.values || []).forEach((v, i) => {
    g.append("circle").attr("cx", x(cats[i]) + x.bandwidth() / 2).attr("cy", yR(v)).attr("r", 4)
      .attr("fill", pal.negative || pal.accent).attr("stroke", "#fff").attr("stroke-width", 2);
  });

  g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x).tickSize(0).tickPadding(10))
    .call(g => g.select(".domain").attr("stroke", "#ccc"))
    .call(g => g.selectAll("text").attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#555"));
  g.append("g").call(d3.axisLeft(yL).ticks(5).tickFormat(d => fmt(d, unit)))
    .call(g => g.select(".domain").remove()).call(g => g.selectAll(".tick line").remove())
    .call(g => g.selectAll("text").attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.primary));
  g.append("g").attr("transform", `translate(${w},0)`).call(d3.axisRight(yR).ticks(5).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove()).call(g => g.selectAll(".tick line").remove())
    .call(g => g.selectAll("text").attr("font-family", MONO).attr("font-size", "10px").attr("fill", pal.negative || pal.accent));
}

function renderMarimekko(container, chartData, pal) {
  const cats = chartData.categories || [];
  if (!cats.length) return;

  const W = container.clientWidth || 700;
  const H = 400;
  const M = { top: 30, right: 20, bottom: 60, left: 40 };
  const w = W - M.left - M.right;
  const h = H - M.top - M.bottom;

  const svg = d3.select(container).append("svg").attr("width", W).attr("height", H);
  const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

  const totalWidth = d3.sum(cats, c => c.width);
  let xOffset = 0;

  const allSegNames = [...new Set(cats.flatMap(c => (c.segments || []).map(s => s.name)))];
  const color = d3.scaleOrdinal().domain(allSegNames).range(pal.series);

  cats.forEach(cat => {
    const catW = (cat.width / totalWidth) * w;
    const totalVal = d3.sum(cat.segments || [], s => s.value);
    let yOff = 0;

    (cat.segments || []).forEach(seg => {
      const segH = (seg.value / totalVal) * h;
      g.append("rect").attr("x", xOffset + 1).attr("y", yOff).attr("width", catW - 2).attr("height", segH)
        .attr("fill", color(seg.name));
      if (segH > 18) {
        g.append("text").attr("x", xOffset + catW / 2).attr("y", yOff + segH / 2 + 4)
          .attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "10px").attr("fill", "#fff").attr("font-weight", "600")
          .text((seg.value).toFixed(0) + "%");
      }
      yOff += segH;
    });

    // Category label
    g.append("text").attr("x", xOffset + catW / 2).attr("y", h + 14)
      .attr("text-anchor", "middle").attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#333").text(cat.label);
    g.append("text").attr("x", xOffset + catW / 2).attr("y", h + 28)
      .attr("text-anchor", "middle").attr("font-family", MONO).attr("font-size", "9px").attr("fill", "#888").text(cat.width + "%");

    xOffset += catW;
  });

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${M.left}, ${H - 16})`);
  allSegNames.forEach((name, i) => {
    const lg = legend.append("g").attr("transform", `translate(${i * 100}, 0)`);
    lg.append("rect").attr("width", 8).attr("height", 8).attr("rx", 1).attr("fill", color(name));
    lg.append("text").attr("x", 12).attr("y", 8).attr("font-family", FONT).attr("font-size", "9px").attr("fill", "#555").text(name);
  });
}

// Dispatcher
function renderChart(container, chart, paletteKey) {
  if (!container || !chart?.data) return;
  d3.select(container).selectAll("*").remove();
  const pal = PALETTES[paletteKey] || PALETTES.thinkcell;
  const unit = chart.unit || "";

  const renderers = {
    waterfall: renderWaterfall,
    stacked_waterfall: (c, d, p, u) => renderWaterfall(c, d, p, u), // simplified
    stacked_bar: (c, d, p, u) => renderStackedBar(c, d, p, u, false),
    "100_stacked": (c, d, p, u) => renderStackedBar(c, d, p, u, true),
    horizontal_bar: renderHorizontalBar,
    grouped_bar: renderGroupedBar,
    tornado: renderTornado,
    marimekko: renderMarimekko,
    line_trend: renderLineTrend,
    area_stacked: renderLineTrend, // reuse with fill
    pie_donut: renderPieDonut,
    scatter_bubble: renderLineTrend, // fallback
    combo: renderCombo,
    funnel: renderFunnel,
  };

  const fn = renderers[chart.chartType];
  if (fn) {
    try { fn(container, chart.data, pal, unit); } catch (e) { console.error("Render error:", chart.chartType, e); }
  }
}

/* ═══════════════════════════════════════════════════
   CHART COMPONENT
   ═══════════════════════════════════════════════════ */
function ChartView({ chart, index, paletteKey }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) renderChart(ref.current, chart, paletteKey);
  }, [chart, paletteKey]);

  const downloadPNG = () => {
    const svgEl = ref.current?.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2 + 60;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1a1a2e";
      ctx.font = "bold 24px DM Sans, sans-serif";
      ctx.fillText(chart.title, 30, 40);
      ctx.drawImage(img, 0, 60, canvas.width, img.height * 2);
      const a = document.createElement("a");
      a.download = `${chart.title.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadSVG = () => {
    const svgEl = ref.current?.querySelector("svg");
    if (!svgEl) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.download = `${chart.title.replace(/[^a-zA-Z0-9]/g, "_")}.svg`;
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  return (
    <div style={S.chartCard}>
      <div style={S.chartHeader}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a2e", marginBottom: "3px" }}>{chart.title}</h3>
            {chart.subtitle && <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>{chart.subtitle}</p>}
          </div>
          <span style={{ fontSize: "9px", padding: "3px 8px", borderRadius: "4px", background: "#F0F4FA", color: "#003A70", fontWeight: 700, fontFamily: MONO, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            {CHART_TYPES.find(t => t.id === chart.chartType)?.name || chart.chartType}
          </span>
        </div>
      </div>
      <div ref={ref} style={S.chartBody} />
      <div style={S.chartFooter}>
        <span style={{ fontStyle: "italic", maxWidth: "60%", fontSize: "11px" }}>💡 {chart.insight}</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={downloadPNG} style={{ ...S.btn, ...S.btnGhost, padding: "4px 10px", fontSize: "10px" }}>📥 PNG</button>
          <button onClick={downloadSVG} style={{ ...S.btn, ...S.btnGhost, padding: "4px 10px", fontSize: "10px" }}>📥 SVG</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EXPORT TO EXCEL
   ═══════════════════════════════════════════════════ */
function exportToExcel(charts, rawData) {
  const wb = XLSX.utils.book_new();
  if (rawData?.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rawData), "Raw Data");
  }
  charts.forEach((chart, i) => {
    const d = chart.data;
    let rows = [];
    if (d.items) rows = d.items.map(it => ({ Label: it.label, Value: it.value, Type: it.type || "" }));
    else if (d.categories && d.series) {
      rows = (Array.isArray(d.categories) ? d.categories : []).map((cat, ci) => {
        const row = { Category: typeof cat === "string" ? cat : cat.label };
        (d.series || []).forEach(s => { row[s.name] = s.values?.[ci] ?? ""; });
        return row;
      });
    } else if (d.stages) rows = d.stages.map(s => ({ Stage: s.label, Value: s.value }));
    if (rows.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), `Chart ${i + 1}`.slice(0, 31));
  });
  XLSX.writeFile(wb, "InsightForge_Charts.xlsx");
}

/* ═══════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════ */
const S = {
  page: { minHeight: "100vh", background: "#FAFAF8", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  header: { padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E8E6E0", background: "#fff", position: "sticky", top: 0, zIndex: 100 },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoMark: { width: "30px", height: "30px", borderRadius: "7px", background: "linear-gradient(135deg, #1B3A5C, #4A7FB5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "14px" },
  container: { maxWidth: "1100px", margin: "0 auto", padding: "28px 20px" },
  card: { background: "#fff", borderRadius: "10px", border: "1px solid #E8E6E0", padding: "24px", marginBottom: "16px" },
  cardTitle: { fontSize: "11px", fontWeight: 700, color: "#1B3A5C", letterSpacing: "0.06em", marginBottom: "12px", textTransform: "uppercase" },
  input: { width: "100%", padding: "11px 13px", borderRadius: "7px", border: "1px solid #D5D3CD", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif", background: "#FAFAF8" },
  btn: { padding: "9px 18px", borderRadius: "7px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" },
  btnPrimary: { background: "#1B3A5C", color: "#fff" },
  btnSecondary: { background: "transparent", color: "#1B3A5C", border: "1px solid #1B3A5C" },
  btnGhost: { background: "transparent", color: "#666", border: "1px solid #D5D3CD" },
  tag: { display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 11px", borderRadius: "5px", fontSize: "11px", fontWeight: 500, cursor: "pointer", border: "1px solid #D5D3CD", background: "#fff", color: "#555", transition: "all 0.15s" },
  tagActive: { background: "#1B3A5C", color: "#fff", borderColor: "#1B3A5C" },
  chartCard: { background: "#fff", borderRadius: "10px", border: "1px solid #E8E6E0", overflow: "hidden", marginBottom: "16px" },
  chartHeader: { padding: "16px 20px 8px" },
  chartBody: { padding: "4px 16px 16px", minHeight: "380px" },
  chartFooter: { padding: "10px 20px", borderTop: "1px solid #F0EEE8", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#888" },
  dropzone: { border: "2px dashed #D5D3CD", borderRadius: "10px", padding: "44px 28px", textAlign: "center", cursor: "pointer", background: "#fff", transition: "all 0.2s" },
  dropzoneActive: { borderColor: "#1B3A5C", background: "#F0F4FA" },
  metricCard: { padding: "14px", borderRadius: "8px", background: "#F5F5F0", border: "1px solid #E8E6E0", flex: "1", minWidth: "130px" },
  insightPill: { padding: "9px 14px", borderRadius: "7px", fontSize: "12px", lineHeight: 1.5, background: "#F5F5F0", border: "1px solid #E8E6E0", color: "#333" },
  stepDot: (active, done) => ({ width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, background: done ? "#1B3A5C" : active ? "#4A7FB5" : "#E8E6E0", color: done || active ? "#fff" : "#999" }),
  stepLine: (done) => ({ width: "36px", height: "2px", background: done ? "#1B3A5C" : "#E8E6E0", borderRadius: "1px" }),
};

/* ═══════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════ */
export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("gk") || "");
  const [keySet, setKeySet] = useState(!!localStorage.getItem("gk"));
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [insights, setInsights] = useState(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [palette, setPalette] = useState("thinkcell");
  const [customInstr, setCustomInstr] = useState("");
  const [autoMode, setAutoMode] = useState(true);
  const fileRef = useRef(null);

  const saveKey = () => { localStorage.setItem("gk", apiKey); setKeySet(true); };
  const clearKey = () => { localStorage.removeItem("gk"); setApiKey(""); setKeySet(false); };

  const handleFile = useCallback(async (f) => {
    setFile(f); setError("");
    const ext = f.name.split(".").pop().toLowerCase();
    setLoadMsg(ext === "pdf" ? "Sending PDF to Gemini for deep extraction..." : "Parsing file...");
    setLoading(true);
    try {
      const content = await extractTextFromFile(f, apiKey);
      if (!content.text && !content.data.length) throw new Error("Could not extract content.");
      setFileContent(content);
      setLoadMsg("Analyzing with AI...");
      const ins = await extractInsights(apiKey, content);
      setInsights(ins);
      if (ins.recommended_charts) setSelectedTypes(ins.recommended_charts.map(c => c.type).slice(0, 4));
      setStep(1);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(""); }
  }, [apiKey]);

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }, [handleFile]);

  const toggleType = (t) => setSelectedTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const generate = async () => {
    if (!autoMode && !selectedTypes.length) { setError("Select at least one chart type"); return; }
    setLoading(true); setError(""); setCharts([]);
    setLoadMsg("Designing Think-Cell quality charts...");
    try {
      const types = autoMode && insights?.recommended_charts ? insights.recommended_charts.map(c => c.type).slice(0, 4) : selectedTypes;
      const configs = await generateChartData(apiKey, fileContent, insights, types, palette, customInstr);
      setCharts(configs);
      setStep(3);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setLoadMsg(""); }
  };

  const reset = () => { setStep(0); setFile(null); setFileContent(null); setInsights(null); setCharts([]); setError(""); setSelectedTypes([]); setAutoMode(true); setCustomInstr(""); };

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}.fadeUp{animation:fadeUp .4s ease both}input:focus,textarea:focus{border-color:#1B3A5C!important}`}</style>

      {/* Header */}
      <header style={S.header}>
        <div style={S.logo}>
          <div style={S.logoMark}>IF</div>
          <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>InsightForge</span>
          <span style={{ fontSize: "8px", padding: "2px 6px", borderRadius: "3px", background: "#1B3A5C", color: "#fff", fontWeight: 700, letterSpacing: "0.08em" }}>THINK-CELL AI</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {keySet && <span style={{ fontSize: "10px", color: "#999", fontFamily: MONO }}>••••{apiKey.slice(-4)}</span>}
          {keySet && <button onClick={clearKey} style={{ ...S.btn, ...S.btnGhost, padding: "5px 10px", fontSize: "10px" }}>Change Key</button>}
          {step > 0 && <button onClick={reset} style={{ ...S.btn, ...S.btnGhost, padding: "5px 10px", fontSize: "10px" }}>New</button>}
        </div>
      </header>

      <div style={S.container}>
        {/* API KEY */}
        {!keySet && (
          <div className="fadeUp" style={{ maxWidth: "460px", margin: "70px auto", textAlign: "center" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "6px", fontFamily: "'Playfair Display', serif" }}>Think-Cell Quality Charts</h1>
            <p style={{ color: "#777", fontSize: "14px", marginBottom: "32px", lineHeight: 1.6 }}>Upload case studies, data files, or PDFs. AI extracts insights and generates consulting-grade visualizations with D3.js.</p>
            <div style={S.card}>
              <label style={S.cardTitle}>Gemini API Key</label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && apiKey.trim()) saveKey(); }}
                placeholder="AIza..." style={{ ...S.input, marginBottom: "10px", fontFamily: MONO }} />
              <button onClick={saveKey} disabled={!apiKey.trim()} style={{ ...S.btn, ...S.btnPrimary, width: "100%", justifyContent: "center", opacity: apiKey.trim() ? 1 : 0.4, marginTop: "8px" }}>Get Started</button>
            </div>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: "#999", fontSize: "11px", textDecoration: "underline" }}>Get free Gemini API key</a>
          </div>
        )}

        {keySet && (
          <>
            {/* Steps */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
              {["Upload", "Insights", "Configure", "Charts"].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={S.stepDot(i === step, i < step)}>{i < step ? "✓" : i + 1}</div>
                  <span style={{ fontSize: "11px", fontWeight: i === step ? 700 : 400, color: i <= step ? "#1a1a2e" : "#999" }}>{s}</span>
                  {i < 3 && <div style={S.stepLine(i < step)} />}
                </div>
              ))}
            </div>

            {/* STEP 0: Upload */}
            {step === 0 && (
              <div className="fadeUp">
                <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                  onClick={() => !loading && fileRef.current?.click()} style={{ ...S.dropzone, ...(dragOver ? S.dropzoneActive : {}) }}>
                  <input ref={fileRef} type="file" accept=".csv,.tsv,.xlsx,.xls,.pdf,.txt,.md" onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} style={{ display: "none" }} />
                  {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                      <div style={{ width: "28px", height: "28px", border: "3px solid #E8E6E0", borderTopColor: "#1B3A5C", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                      <p style={{ color: "#1B3A5C", fontWeight: 600, fontSize: "13px" }}>{loadMsg}</p>
                    </div>
                  ) : (<>
                    <div style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.3 }}>📄</div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#333", marginBottom: "4px" }}>Drop your file here</p>
                    <p style={{ fontSize: "12px", color: "#999" }}>PDF case studies, Excel data, CSV files</p>
                  </>)}
                </div>
              </div>
            )}

            {/* STEP 1: Insights */}
            {step === 1 && insights && (
              <div className="fadeUp">
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div>
                      <p style={{ ...S.cardTitle, marginBottom: "2px" }}>Analysis Complete</p>
                      <h2 style={{ fontSize: "20px", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{insights.title}</h2>
                    </div>
                    <span style={{ fontSize: "10px", color: "#888", fontFamily: MONO, background: "#F5F5F0", padding: "3px 8px", borderRadius: "4px" }}>{file?.name}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.7, marginBottom: "16px" }}>{insights.executive_summary}</p>
                  {insights.key_metrics?.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                      {insights.key_metrics.map((m, i) => (
                        <div key={i} style={S.metricCard}>
                          <p style={{ fontSize: "10px", color: "#888", fontWeight: 600, marginBottom: "3px" }}>{m.name}</p>
                          <p style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e" }}>{m.value}</p>
                          {m.trend && <span style={{ fontSize: "10px", color: m.trend === "up" ? "#00875A" : m.trend === "down" ? "#CC0000" : "#888" }}>{m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"} {m.trend}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={S.cardTitle}>Key Insights</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {insights.insights?.map((ins, i) => (<div key={i} style={S.insightPill}><span style={{ color: "#1B3A5C", fontWeight: 700, marginRight: "6px" }}>{i + 1}.</span>{ins}</div>))}
                  </div>
                </div>
                {insights.recommended_charts?.length > 0 && (
                  <div style={S.card}>
                    <p style={S.cardTitle}>AI Recommended Charts</p>
                    {insights.recommended_charts.map((rc, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "6px", background: "#F5F5F0", marginBottom: "6px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#1B3A5C", fontFamily: MONO, minWidth: "100px" }}>{CHART_TYPES.find(c => c.id === rc.type)?.name || rc.type}</span>
                        <span style={{ fontSize: "12px", color: "#333", fontWeight: 500 }}>{rc.title}</span>
                        <span style={{ fontSize: "11px", color: "#888", marginLeft: "auto" }}>{rc.why}</span>
                      </div>
                    ))}
                  </div>
                )}
                {fileContent?.pdfExtracted && (
                  <details style={{ marginBottom: "12px" }}>
                    <summary style={{ ...S.cardTitle, cursor: "pointer", padding: "10px 0" }}>📄 View Extracted PDF Content ({fileContent.text.length.toLocaleString()} chars)</summary>
                    <div style={{ ...S.card, maxHeight: "350px", overflowY: "auto" }}>
                      <pre style={{ fontSize: "11px", color: "#555", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: MONO, margin: 0 }}>{fileContent.text.slice(0, 6000)}</pre>
                    </div>
                  </details>
                )}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button onClick={reset} style={{ ...S.btn, ...S.btnGhost }}>Start Over</button>
                  <button onClick={() => setStep(2)} style={{ ...S.btn, ...S.btnPrimary }}>Configure Charts →</button>
                </div>
              </div>
            )}

            {/* STEP 2: Configure */}
            {step === 2 && (
              <div className="fadeUp">
                <div style={S.card}>
                  <p style={S.cardTitle}>Generation Mode</p>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                    <button onClick={() => setAutoMode(true)} style={{ ...S.btn, ...(autoMode ? S.btnPrimary : S.btnGhost), flex: 1, justifyContent: "center" }}>🤖 Auto (AI Picks Best)</button>
                    <button onClick={() => setAutoMode(false)} style={{ ...S.btn, ...(!autoMode ? S.btnPrimary : S.btnGhost), flex: 1, justifyContent: "center" }}>🎯 Manual Selection</button>
                  </div>
                  {!autoMode && (
                    <>
                      <p style={{ ...S.cardTitle, marginTop: "12px" }}>Chart Types</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {CHART_TYPES.map(ct => (
                          <div key={ct.id} onClick={() => toggleType(ct.id)} title={ct.desc}
                            style={{ ...S.tag, ...(selectedTypes.includes(ct.id) ? S.tagActive : {}) }}>
                            {ct.icon} {ct.name}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div style={S.card}>
                  <p style={S.cardTitle}>Color Palette</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {Object.entries(PALETTES).map(([key, p]) => (
                      <div key={key} onClick={() => setPalette(key)} style={{ padding: "8px 12px", borderRadius: "7px", cursor: "pointer", border: palette === key ? "2px solid #1B3A5C" : "1px solid #E8E6E0", background: palette === key ? "#F0F4FA" : "#fff" }}>
                        <div style={{ display: "flex", gap: "2px", marginBottom: "4px" }}>{p.series.slice(0, 6).map((c, i) => (<div key={i} style={{ width: "14px", height: "14px", borderRadius: "2px", background: c }} />))}</div>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "#555", textTransform: "capitalize" }}>{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={S.card}>
                  <p style={S.cardTitle}>Custom Instructions (Optional)</p>
                  <textarea value={customInstr} onChange={e => setCustomInstr(e.target.value)} rows={2}
                    placeholder="E.g., Focus on YoY growth, use waterfall for revenue bridge, highlight top 5..." style={{ ...S.input, resize: "vertical", lineHeight: 1.5 }} />
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button onClick={() => setStep(1)} style={{ ...S.btn, ...S.btnGhost }}>← Back</button>
                  <button onClick={generate} disabled={loading || (!autoMode && !selectedTypes.length)} style={{ ...S.btn, ...S.btnPrimary, opacity: loading ? 0.6 : 1 }}>
                    {loading ? (<><div style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />{loadMsg}</>) : "Generate Charts ✦"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Charts */}
            {step === 3 && charts.length > 0 && (
              <div className="fadeUp">
                <div style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: "2px" }}>{charts.length} Chart{charts.length > 1 ? "s" : ""} Generated</h2>
                    <p style={{ fontSize: "11px", color: "#888" }}>{insights?.title} · {palette} palette · D3.js rendered</p>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button onClick={() => exportToExcel(charts, fileContent?.data)} style={{ ...S.btn, ...S.btnSecondary, fontSize: "11px", padding: "7px 12px" }}>📊 Excel</button>
                    <button onClick={() => setStep(2)} style={{ ...S.btn, ...S.btnGhost, fontSize: "11px", padding: "7px 12px" }}>⚙ Reconfigure</button>
                    <button onClick={generate} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, fontSize: "11px", padding: "7px 12px" }}>✦ Regenerate</button>
                  </div>
                </div>
                {charts.map((chart, i) => (<ChartView key={i} chart={chart} index={i} paletteKey={palette} />))}
                {fileContent?.data?.length > 0 && (
                  <details style={{ marginTop: "8px" }}>
                    <summary style={{ fontSize: "12px", color: "#888", cursor: "pointer", fontFamily: MONO, padding: "6px 0" }}>Source data ({fileContent.data.length} rows)</summary>
                    <div style={{ marginTop: "6px", borderRadius: "8px", border: "1px solid #E8E6E0", overflow: "hidden", background: "#fff" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: MONO }}>
                          <thead><tr>{fileContent.columns?.map((c, j) => (<th key={j} style={{ padding: "8px 10px", textAlign: "left", borderBottom: "2px solid #E8E6E0", color: "#1B3A5C", fontWeight: 600, fontSize: "9px", background: "#FAFAF8", whiteSpace: "nowrap" }}>{c}</th>))}</tr></thead>
                          <tbody>{fileContent.data.slice(0, 8).map((row, i) => (<tr key={i}>{fileContent.columns?.map((c, j) => (<td key={j} style={{ padding: "6px 10px", borderBottom: "1px solid #F0EEE8", whiteSpace: "nowrap", color: "#555" }}>{row[c] != null ? String(row[c]) : "—"}</td>))}</tr>))}</tbody>
                        </table>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            )}

            {error && (
              <div style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "7px", background: "#FFF5F5", border: "1px solid #FDD", color: "#CC0000", fontSize: "12px" }}>
                <strong style={{ fontFamily: MONO, fontSize: "10px" }}>ERROR: </strong>{error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}