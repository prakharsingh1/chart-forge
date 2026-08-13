import { parseJsonLoose } from "./format.js";
import { CHART_TYPES } from "../theme.js";
import { normalizeChartData } from "./chartData.js";
import { upgradeSuggestion, dropEmpty } from "./quality.js";

export async function geminiCall(prompt, temperature = 0.15, { search = false } = {}) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, temperature, search }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `AI error ${res.status}`);
  if (!data.text) throw new Error("Empty model response");
  return data.text;
}

const DESIGN_RULES = `You are a McKinsey/BCG exhibit designer AND a buy-side research scientist. You never ship a toy chart. Every exhibit must look like it belongs in an IC memo or a partner pack — dense, labeled, reconciled.

CHART DESIGN LAW (never break):
- Action title = the so-what. "Primary + inter-WH transit is 61% of optimal cost — not last-mile" — not "Treemap".
- Subtitle = metric, unit, period, scope. "Network cost, ₹ Cr, FY24, Scenario 2 (17 WH)".
- Source line required. Deck numbers origin=deck. Web numbers origin=web. Never mix in one series.
- Use ONLY numbers in the deck TABLES/CHARTS or cited web sources. Compute implied totals. Never invent.
- BAN these types unless the user clicked Load more: pie_donut, nested_donut, kpi_cards, gauge, progress_ring, waffle, win_loss, grouped_bar (unless ≥2 series), horizontal_bar, line_trend with a single series.
- FIRST-PASS REQUIRED MIX (pick 10, cover the whole pack):
  1) stacked_waterfall or waterfall — cost/value bridge that reconciles
  2) marimekko or mosaic — size × mix
  3) tornado — sensitivity / scenario upside-downside
  4) sankey or alluvial — volume or cost flow
  5) combo — columns + line (cost vs service, demand vs capacity)
  6) 100_stacked or streamgraph — mix over time or scenarios
  7) dumbbell or slope — as-is vs optimal
  8) heatmap or parallel_coords — scenario × cost component or WH × metric
  9) icicle or treemap — hierarchy of cost / network
  10) pareto or lollipop or bullet — ranked drivers vs target
- Ops / CPG / logistics: the mix above. Markets / risk: fan_chart, brinson, corr_matrix, ridgeline, yield_curve, vol_surface, order_book, qq_plot, forest.
- series MUST be [{"name":"...","values":[numbers]}]. grouped_bar needs categories AND ≥2 series.
- Waterfalls: first and last type=total. Middle increase/decrease. start + steps = end.
- Horizontal / lollipop: sort descending. 100% stacked: each category sums to 100.
- Combo needs both bars.values and line.values, same length as categories.
- Titles ≤ 90 characters. Insight is one sentence.
- At least 8 data points or 3 series whenever the deck supports it. Thin 4-bar charts are not acceptable when a table has more.

Valid chartType values: ${CHART_TYPES.map((t) => t.id).join(", ")}`;

const DATA_SHAPES = `DATA SHAPES (use these keys exactly):
waterfall: {"items":[{"label":"FY23","value":120,"type":"total"},{"label":"Volume","value":18,"type":"increase"},{"label":"Cost","value":-9,"type":"decrease"},{"label":"FY24","value":129,"type":"total"}]}
stacked_waterfall: {"items":[{"label":"FY23","type":"total","segments":[{"name":"A","value":80},{"name":"B","value":40}]},{"label":"Growth","type":"increase","segments":[{"name":"A","value":10},{"name":"B","value":5}]},{"label":"FY24","type":"total","segments":[{"name":"A","value":90},{"name":"B","value":45}]}]}
stacked_bar / 100_stacked / grouped_bar: {"categories":["A","B"],"series":[{"name":"S1","values":[10,20]},{"name":"S2","values":[15,25]}]}
horizontal_bar / pie_donut / treemap / lollipop / pareto: {"items":[{"label":"A","value":100},{"label":"B","value":80}]}
tornado: {"categories":["Price","Volume"],"left":{"name":"Downside","values":[12,8]},"right":{"name":"Upside","values":[9,6]}}
marimekko: {"categories":[{"label":"NA","width":45,"segments":[{"name":"Prem","value":60},{"name":"Core","value":40}]},{"label":"EU","width":35,"segments":[{"name":"Prem","value":40},{"name":"Core","value":60}]}]}
line_trend / area_stacked / streamgraph: {"xLabels":["2019","2020","2021","2022"],"series":[{"name":"Revenue","values":[100,110,125,148]}]}
scatter_bubble: {"points":[{"label":"A","x":12,"y":8,"size":40}],"xLabel":"Share %","yLabel":"Growth %","quadrants":true}
combo: {"categories":["Q1","Q2"],"bars":{"name":"Revenue","values":[100,120]},"line":{"name":"Margin %","values":[14,16]}}
funnel: {"stages":[{"label":"Leads","value":10000},{"label":"SQL","value":2400},{"label":"Won","value":480}]}
gantt: {"axis":["W1","W2","W3","W4"],"items":[{"label":"Diagnose","start":0,"end":2,"group":"Phase 1"}]}
fan_chart / var_fan: {"xLabels":["Jan","Feb","Mar","Apr"],"p10":[98,96,94,91],"p50":[100,102,105,107],"p90":[104,110,118,126],"actual":[100,101,104]}
underwater: {"xLabels":["2019","2020","2021","2022"],"drawdown":[0,-2.1,-8.4,-16.2]}
cum_bench / rolling_metric: {"xLabels":["Y1","Y2","Y3"],"fundName":"Fund","benchName":"HFRI","fund":[100,112,128],"bench":[100,108,118]}
brinson: {"categories":["Tech","Health","Energy"],"allocation":[12,-4,6],"selection":[18,9,-7],"interaction":[2,-1,1]}
long_short: {"categories":["Software","Banks"],"long":[1.8,0.4],"short":[-0.6,-1.1]}
ohlc: {"items":[{"label":"M","o":102,"h":108,"l":101,"c":106}]}
ridgeline / violin_returns: {"groups":[{"label":"2019","values":[-0.4,0.2,0.8]},{"label":"2020","values":[-1.2,0.4,1.6]}]}
corr_matrix / factor_heatmap: {"rows":["Eq","Cr","FX"],"values":[[1,0.4,0.1],[0.4,1,0.2],[0.1,0.2,1]]}
yield_curve: {"tenors":["2Y","5Y","10Y","30Y"],"series":[{"name":"Spot","values":[4.2,4.0,4.25,4.55]}]}
forest: {"items":[{"label":"Mkt","value":0.92,"low":0.81,"high":1.04}]}
exposure_stack: {"xLabels":["Jan","Feb"],"series":[{"name":"Long","values":[80,90]},{"name":"Short","values":[-40,-50]}]}
qq_plot: {"sample":[-1.2,-0.4,0.1,0.6,1.1,1.8]}
horizon: {"xLabels":["W1","W2","W3","W4"],"values":[0.4,-0.8,1.2,-1.6],"bands":4}
vol_surface: {"rows":["1M","3M","1Y"],"cols":["90","100","110"],"values":[[18,16,22],[20,17,24],[22,19,26]]}
order_book: {"bids":[{"price":101.2,"size":40}],"asks":[{"price":101.4,"size":36}]}
parallel_coords: {"axes":["Vol","Beta","PE"],"rows":[{"label":"A","Vol":22,"Beta":1.1,"PE":28}]}
alpha_beta: {"points":[{"label":"A","x":1.2,"y":0.8,"size":40}]}
style_box: {"points":[{"label":"Fund","xLabel":"Growth","yLabel":"Large","size":80}]}
icicle / sunburst: {"items":[{"label":"Long","value":60,"children":[{"label":"Tech","value":40}]},{"label":"Short","value":40}]}
lorenz: {"items":[{"label":"Top","value":40},{"label":"Rest","value":12}]}
candles_volume: {"items":[{"label":"M","o":102,"h":108,"l":101,"c":106,"volume":12}]}
pnl_calendar: {"days":[{"label":"1","value":0.4},{"label":"2","value":-0.8}]}
liquidity_ladder: {"items":[{"label":"ON","value":40},{"label":"1W","value":22}]}
mosaic: {"categories":[{"label":"NA","width":45,"segments":[{"name":"A","value":60},{"name":"B","value":40}]}]}
hexbin: {"points":[{"x":1,"y":2},{"x":1.2,"y":2.1},{"x":0.8,"y":1.7}]}
chord: {"labels":["Eq","Cr","FX"],"matrix":[[0,12,4],[12,0,6],[4,6,0]]}
streamgraph: {"xLabels":["A","B","C"],"series":[{"name":"X","values":[10,12,9]},{"name":"Y","values":[8,6,11]}]}`;

export async function extractInsights(fc, brief = "") {
  const prompt = `${DESIGN_RULES}

${brief ? `USER BRIEF:\n${brief}\n` : ""}
${fc?.pdfExtracted ? "PDF EXTRACT:" : "CONTENT:"}
${(fc?.text || "").slice(0, 14000)}
${
  fc?.type === "tabular" && fc.data?.length
    ? `COLUMNS: ${JSON.stringify(fc.columns)}\nSAMPLE: ${JSON.stringify(fc.data.slice(0, 20), null, 2)}\nROWS: ${fc.data.length}`
    : ""
}

Return ONLY JSON:
{
  "title": "Engagement-style title",
  "executive_summary": "2-3 sentences a PM or CRO would read",
  "key_metrics": [{"name":"","value":"with unit","trend":"up|down|stable"}],
  "insights": ["so-what 1","so-what 2","so-what 3","so-what 4"],
  "source": "Source line",
  "extracted_data": [{"category":"","values":{}}],
  "recommended_charts": [
    {"type":"waterfall","title":"action title","why":"why this chart","priority":1}
  ]
}`;
  return parseJsonLoose(await geminiCall( prompt, 0.1));
}

export async function generateChartData(fc, insights, selectedTypes, customInstr, brief = "") {
  const prompt = `${DESIGN_RULES}

CONTEXT: ${insights?.executive_summary || ""}
SOURCE: ${insights?.source || ""}
INSIGHTS: ${JSON.stringify(insights?.insights || [])}
EXTRACTED: ${JSON.stringify(insights?.extracted_data || [])}
${brief ? `BRIEF:\n${brief}\n` : ""}
${
  fc?.type === "tabular" && fc.data?.length
    ? `TABLE columns=${JSON.stringify(fc.columns)}\n${JSON.stringify(fc.data.slice(0, 60), null, 2)}`
    : `TEXT:\n${(fc?.text || "").slice(0, 8000)}`
}
CHART TYPES: ${JSON.stringify(selectedTypes)}
${customInstr ? `EXTRA INSTRUCTIONS: ${customInstr}` : ""}

Return ONLY a JSON array. One object per requested type:

{
  "id": "c1",
  "chartType": "...",
  "title": "Action title (insight)",
  "subtitle": "Metric, unit, period, scope",
  "insight": "One-line takeaway",
  "source": "Source: ...",
  "unit": "$M|%|pp|units",
  "data": {}
}

${DATA_SHAPES}

Generate exactly ${selectedTypes.length} charts. Numbers must reconcile.`;

  const parsed = parseJsonLoose(await geminiCall( prompt, 0.12));
  const list = Array.isArray(parsed) ? parsed : parsed.charts || [parsed];
  return list.map((c, i) => ({
    ...c,
    id: c.id || `c${i + 1}`,
    chartType: c.chartType || selectedTypes[i] || "grouped_bar",
    data: normalizeChartData(c.chartType || selectedTypes[i], c.data || {}),
  }));
}

export async function generateFromBrief(brief, selectedTypes, customInstr) {
  const insights = await extractInsights({ text: brief, data: [], columns: [], type: "document" }, brief);
  const types =
    selectedTypes?.length
      ? selectedTypes
      : (insights.recommended_charts || []).map((c) => c.type).slice(0, 4);
  const charts = await generateChartData(
    { text: brief, data: [], columns: [], type: "document" },
    insights,
    types.length ? types : ["waterfall", "stacked_bar"],
    customInstr,
    brief
  );
  return { insights, charts };
}

export async function fillDeckSlides(deck, brief = "", customInstr = "") {
  const catalog = (deck.slides || []).map((s, i) => ({
    index: i,
    title: s.title,
    subtitle: s.subtitle,
    text: [s.title, s.subtitle, s.body].filter(Boolean).join("\n").slice(0, 2200),
  }));

  const prompt = `${DESIGN_RULES}

You are filling a live PowerPoint. Each slide must become an institutional exhibit with REAL numbers from that slide's text. Do not invent figures. If a slide has no quantitative content, skip it.

DECK SLIDES:
${JSON.stringify(catalog, null, 2)}

${brief ? `USER BRIEF:\n${brief}\n` : ""}
${customInstr ? `DIRECTION:\n${customInstr}\n` : ""}

Return ONLY JSON:
{
  "insights": {
    "title": "Deck title",
    "executive_summary": "2 sentences",
    "key_metrics": [{"name":"","value":"","trend":"up|down|stable"}],
    "insights": ["",""],
    "source": "Source: ..."
  },
  "slides": [
    {
      "index": 0,
      "skip": false,
      "title": "Action title",
      "subtitle": "Metric, unit, period",
      "source": "Source: ...",
      "insight": "One line",
      "chartType": "waterfall",
      "unit": "$M",
      "data": {}
    }
  ]
}

Use the same data shapes as generateChartData. Skip agenda/divider/backup slides (skip: true). Prefer fan_chart, underwater, brinson, corr_matrix, ridgeline, yield_curve, ohlc, long_short, forest, cum_bench, waterfall when the numbers fit.`;

  const parsed = parseJsonLoose(await geminiCall( prompt, 0.12));
  return parsed;
}

export async function fillOneSlide(slide, brief = "", chartType = "") {
  const text = [slide.title, slide.subtitle, slide.body, ...(slide.originalTexts || [])].join("\n");
  const types = chartType ? [chartType] : ["grouped_bar"];
  const insights = {
    executive_summary: brief || slide.title,
    source: slide.source,
    insights: [],
    extracted_data: [],
  };
  const charts = await generateChartData(
    { text, data: [], columns: [], type: "document" },
    insights,
    types,
    brief,
    `Fill this one PowerPoint slide with a desk-quality market exhibit.\n${text}`
  );
  return charts[0];
}

function hydrateSuggestion(s, i, prefix = "sug") {
  let data = s.data;
  if (typeof data === "string") {
    try {
      data = parseJsonLoose(data);
    } catch {
      data = {};
    }
  }
  const chartType = s.chartType || s.type || "waterfall";
  return upgradeSuggestion({
    ...s,
    id: s.id || `${prefix}_${i}_${Date.now().toString(36)}`,
    chartType,
    origin: s.origin === "web" ? "web" : "deck",
    data: normalizeChartData(chartType, data || {}),
  });
}

export async function suggestFromDeck({ corpus, industryHint, fileName }) {
  const prompt = `${DESIGN_RULES}

The user dropped a PowerPoint. They must NOT type data. You extract numbers from the deck AND enrich with current industry facts via web search.

FILE: ${fileName || "deck.pptx"}
INDUSTRY HINT: ${industryHint || "detect from text"}

DECK TEXT (titles, body, extracted tables, embedded Excel/PowerPoint chart caches):
${(corpus || "").slice(0, 18000)}

Use Google Search for the industry (market size, CAGR, share, recent year). Label those charts origin="web". Charts whose numbers come from the PPTX are origin="deck". Never mix invented deck figures with web figures in the same series without saying so in the source line.
Prefer numbers from TABLE and CHART blocks over decorative slide copy.

${DATA_SHAPES}

Return ONLY JSON:
{
  "industry": "short industry name",
  "industry_why": "one sentence why you classified it",
  "executive_summary": "2 sentences a PM would read",
  "key_metrics": [{"name":"","value":"","trend":"up|down|stable"}],
  "suggestions": [
    {
      "origin": "deck|web",
      "why": "why this exhibit for THIS deck",
      "id": "s1",
      "chartType": "waterfall",
      "title": "Action title",
      "subtitle": "Metric, unit, period, scope",
      "insight": "One-line takeaway",
      "source": "Source: ...",
      "unit": "$B|%|pp",
      "data": {}
    }
  ]
}

Produce exactly 10 partner-grade exhibits that COVER THE WHOLE DECK (cost bridge, scenarios, mix, flow, seasonality, sensitivity, ranked drivers, industry context):
- Follow the FIRST-PASS REQUIRED MIX in the design law. No pies. No KPI-card slides. No single-series clustered columns. No 4-item ranked bar when a richer type fits.
- At least 7 origin=deck from TABLE/CHART blocks
- At least 3 origin=web, still complex (heatmap, mekko, combo — not a skinny bar)
Every suggestion MUST include a complete "data" object in the shape above so the preview can draw.
Numbers must reconcile.`;

  const parsed = parseJsonLoose(await geminiCall( prompt, 0.22, { search: true }));
  const suggestions = parsed.suggestions || parsed.charts || [];
  return {
    industry: parsed.industry || industryHint || "",
    industry_why: parsed.industry_why || "",
    executive_summary: parsed.executive_summary || "",
    key_metrics: parsed.key_metrics || [],
    suggestions: suggestions.map((s, i) => hydrateSuggestion(s, i, "sug")).filter(dropEmpty),
  };
}

export async function suggestMoreFromDeck({ corpus, industryHint, fileName, existing = [] }) {
  const used = existing.map((s) => s.chartType).filter(Boolean);
  const titles = existing.map((s) => s.title).filter(Boolean).slice(0, 12);
  const prompt = `${DESIGN_RULES}

The user clicked Load more. They already have these chartTypes: ${used.join(", ") || "(none)"}
Titles already shown: ${JSON.stringify(titles)}

FILE: ${fileName || "deck.pptx"}
INDUSTRY: ${industryHint || ""}

DECK TEXT:
${(corpus || "").slice(0, 14000)}

Produce 8 NEW, HARDER exhibits they do not already have. Prefer unused types from:
stacked_waterfall, marimekko, mosaic, tornado, sankey, alluvial, combo, streamgraph, dumbbell, slope, heatmap, parallel_coords, icicle, pareto, bullet, forest, ridgeline, chord, hexbin, qq_plot, vol_surface, order_book, lorenz, pnl_calendar, fan_chart, brinson.

Do not repeat a chartType already listed. No pie, no kpi_cards, no gauge, no single-series bar. Use TABLE/CHART numbers (origin=deck). Add 2 origin=web industry exhibits that are still dense.

${DATA_SHAPES}

Return ONLY JSON: { "suggestions": [ { "origin":"deck|web", "why":"", "id":"m1", "chartType":"", "title":"", "subtitle":"", "insight":"", "source":"", "unit":"", "data":{} } ] }
Every item needs a complete data object.`;

  const parsed = parseJsonLoose(await geminiCall( prompt, 0.18, { search: true }));
  const suggestions = (parsed.suggestions || parsed.charts || [])
    .filter((s) => !used.includes(s.chartType || s.type))
    .map((s, i) => hydrateSuggestion(s, i, "more"))
    .filter(dropEmpty);
  return { suggestions };
}
