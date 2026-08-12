import { parseJsonLoose } from "./format.js";
import { CHART_TYPES } from "../theme.js";

const MODEL = "gemini-2.5-pro";

export async function geminiCall(apiKey, prompt, temperature = 0.15) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: 16384 },
      }),
    }
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `Gemini error ${res.status}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!text) throw new Error("Empty model response");
  return text;
}

const DESIGN_RULES = `You are a former McKinsey EM / BCG principal who builds Think-Cell charts for partner-ready decks.

CHART DESIGN LAW (never break):
- Action title: the insight, not the chart type. "Price mix, not volume, drove 80% of EBIT growth" — not "EBIT waterfall".
- Subtitle: units, time period, scope. "EBIT, $M, FY2019–FY2024, Group"
- Source: "Source: Company filings; ChartForge analysis" or the real source.
- Use ONLY numbers present in the brief/data. Never invent figures. If a total is implied, compute it from given parts.
- Every bar/point must have a label. Consulting charts are read without a legend if possible.
- Waterfalls: first and last items type=total. Middle items increase/decrease. Totals must reconcile (start + steps = end).
- Horizontal bars: sort descending.
- 100% stacked: each category sums to 100.
- Pie: max 6 slices + Other.
- Line: include CAGR annotation when ≥3 periods.
- Gantt: start/end are integer period indices matching axis labels.
- Titles ≤ 90 characters. Insight is one sentence.

Valid chartType values: ${CHART_TYPES.map((t) => t.id).join(", ")}`;

export async function extractInsights(apiKey, fc, brief = "") {
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
  "executive_summary": "2-3 sentences a partner would read",
  "key_metrics": [{"name":"","value":"with unit","trend":"up|down|stable"}],
  "insights": ["so-what 1","so-what 2","so-what 3","so-what 4"],
  "source": "Source line",
  "extracted_data": [{"category":"","values":{}}],
  "recommended_charts": [
    {"type":"waterfall","title":"action title","why":"why this chart","priority":1}
  ]
}`;
  return parseJsonLoose(await geminiCall(apiKey, prompt, 0.1));
}

export async function generateChartData(apiKey, fc, insights, selectedTypes, customInstr, brief = "") {
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

DATA SHAPES:
waterfall: {"items":[{"label":"FY23","value":120,"type":"total"},{"label":"Volume","value":18,"type":"increase"},{"label":"Cost","value":-9,"type":"decrease"},{"label":"FY24","value":129,"type":"total"}]}
stacked_waterfall: {"items":[{"label":"FY23","type":"total","segments":[{"name":"A","value":80},{"name":"B","value":40}]},{"label":"Growth","type":"increase","segments":[{"name":"A","value":10},{"name":"B","value":5}]},{"label":"FY24","type":"total","segments":[{"name":"A","value":90},{"name":"B","value":45}]}]}
stacked_bar / 100_stacked / grouped_bar: {"categories":["A","B"],"series":[{"name":"S1","values":[10,20]},{"name":"S2","values":[15,25]}]}
horizontal_bar: {"items":[{"label":"A","value":100},{"label":"B","value":80}]}
tornado: {"categories":["Price","Volume"],"left":{"name":"Downside","values":[12,8]},"right":{"name":"Upside","values":[9,6]}}
marimekko: {"categories":[{"label":"NA","width":45,"segments":[{"name":"Prem","value":60},{"name":"Core","value":40}]},{"label":"EU","width":35,"segments":[{"name":"Prem","value":40},{"name":"Core","value":60}]}]}
line_trend: {"xLabels":["2019","2020","2021","2022"],"series":[{"name":"Revenue","values":[100,110,125,148],"showCAGR":true}],"annotations":[{"type":"cagr","from":0,"to":3,"value":"14%"}]}
area_stacked: {"xLabels":["2019","2020"],"series":[{"name":"A","values":[50,55]},{"name":"B","values":[30,40]}]}
pie_donut: {"items":[{"label":"A","value":42},{"label":"B","value":33},{"label":"C","value":25}],"donut":true}
scatter_bubble: {"points":[{"label":"A","x":12,"y":8,"size":40}],"xLabel":"Share %","yLabel":"Growth %","quadrants":true}
combo: {"categories":["Q1","Q2"],"bars":{"name":"Revenue","values":[100,120]},"line":{"name":"Margin %","values":[14,16]}}
funnel: {"stages":[{"label":"Leads","value":10000},{"label":"SQL","value":2400},{"label":"Won","value":480}]}
gantt: {"axis":["W1","W2","W3","W4","W5","W6"],"items":[{"label":"Diagnose","start":0,"end":2,"group":"Phase 1"},{"label":"Design","start":2,"end":5,"group":"Phase 2"}],"milestones":[{"label":"SteerCo","at":3}]}

Generate exactly ${selectedTypes.length} charts. Numbers must reconcile.`;

  const parsed = parseJsonLoose(await geminiCall(apiKey, prompt, 0.12));
  return Array.isArray(parsed) ? parsed : parsed.charts || [parsed];
}

export async function generateFromBrief(apiKey, brief, selectedTypes, customInstr) {
  const insights = await extractInsights(apiKey, { text: brief, data: [], columns: [], type: "document" }, brief);
  const types =
    selectedTypes?.length
      ? selectedTypes
      : (insights.recommended_charts || []).map((c) => c.type).slice(0, 4);
  const charts = await generateChartData(
    apiKey,
    { text: brief, data: [], columns: [], type: "document" },
    insights,
    types.length ? types : ["waterfall", "stacked_bar"],
    customInstr,
    brief
  );
  return { insights, charts };
}
