import { chartMeta } from "../theme.js";

const SHAPES = {
  items: () => ({
    items: [
      { label: "North", value: 42 },
      { label: "South", value: 31 },
      { label: "West", value: 18 },
      { label: "East", value: 12 },
    ],
  }),
  series: () => ({
    categories: ["Q1", "Q2", "Q3", "Q4"],
    series: [
      { name: "Actual", values: [22, 28, 31, 38] },
      { name: "Plan", values: [20, 26, 30, 34] },
    ],
  }),
  waterfall: () => ({
    items: [
      { label: "Start", value: 100, type: "total" },
      { label: "Uplift", value: 25, type: "increase" },
      { label: "Drag", value: -10, type: "decrease" },
      { label: "End", value: 115, type: "total" },
    ],
  }),
  stacked_waterfall: () => ({
    items: [
      { label: "Start", type: "total", segments: [{ name: "A", value: 60 }, { name: "B", value: 40 }] },
      { label: "Growth", type: "increase", segments: [{ name: "A", value: 10 }, { name: "B", value: 5 }] },
      { label: "End", type: "total", segments: [{ name: "A", value: 70 }, { name: "B", value: 45 }] },
    ],
  }),
  dumbbell: () => ({
    categories: ["Price", "Volume", "Mix"],
    start: [12, 20, 8],
    end: [18, 17, 14],
  }),
  bullet: () => ({
    items: [
      { label: "Revenue", value: 82, target: 100 },
      { label: "Pipeline", value: 64, target: 80 },
      { label: "NPS", value: 44, target: 50 },
    ],
  }),
  line: () => ({
    xLabels: ["FY20", "FY21", "FY22", "FY23", "FY24"],
    series: [
      { name: "Digital", values: [12, 16, 21, 28, 36] },
      { name: "Core", values: [40, 41, 39, 38, 37] },
    ],
    annotations: [{ type: "cagr", from: 0, to: 4, value: "32%" }],
  }),
  combo: () => ({
    categories: ["Q1", "Q2", "Q3", "Q4"],
    bars: { name: "Revenue", values: [100, 110, 125, 140] },
    line: { name: "Margin %", values: [12, 13, 14, 15] },
  }),
  scatter: () => ({
    xLabel: "Share",
    yLabel: "Growth %",
    quadrants: true,
    points: [
      { label: "A", x: 1.4, y: 8, size: 60 },
      { label: "B", x: 0.6, y: 2, size: 30 },
      { label: "C", x: 1.8, y: 1, size: 80 },
      { label: "D", x: 0.9, y: 5, size: 40 },
    ],
  }),
  mekko: () => ({
    categories: [
      { label: "NA", width: 45, segments: [{ name: "Prem", value: 60 }, { name: "Core", value: 40 }] },
      { label: "EU", width: 35, segments: [{ name: "Prem", value: 40 }, { name: "Core", value: 60 }] },
      { label: "APAC", width: 20, segments: [{ name: "Prem", value: 25 }, { name: "Core", value: 75 }] },
    ],
  }),
  funnel: () => ({
    stages: [
      { label: "Leads", value: 10000 },
      { label: "SQL", value: 2400 },
      { label: "Won", value: 480 },
    ],
  }),
  gantt: () => ({
    axis: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    items: [
      { label: "Diagnose", start: 0, end: 2, group: "P1" },
      { label: "Design", start: 2, end: 5, group: "P2" },
      { label: "Build", start: 4, end: 8, group: "P3" },
    ],
    milestones: [{ label: "SteerCo", at: 2 }],
  }),
  tornado: () => ({
    categories: ["Price", "Volume", "Cost"],
    left: { name: "Downside", values: [12, 8, 6] },
    right: { name: "Upside", values: [9, 5, 4] },
  }),
  heatmap: () => ({
    rows: ["Enterprise", "Mid-market", "SMB"],
    cols: ["Q1", "Q2", "Q3", "Q4"],
    values: [
      [12, 18, 22, 30],
      [8, 9, 11, 14],
      [20, 18, 16, 15],
    ],
  }),
  sankey: () => ({
    links: [
      { source: "Inbound", target: "SQL", value: 40 },
      { source: "Outbound", target: "SQL", value: 22 },
      { source: "SQL", target: "Won", value: 18 },
      { source: "SQL", target: "Lost", value: 44 },
    ],
  }),
  hierarchy: () => ({
    items: [
      { label: "Product", value: 40 },
      { label: "Services", value: 25 },
      { label: "Other", value: 15 },
    ],
  }),
  gauge: () => ({ value: 72, max: 100, target: 80 }),
  kpis: () => ({
    items: [
      { label: "ARR", value: "$48M", delta: "+18%" },
      { label: "NDR", value: "114%", delta: "+3pp" },
      { label: "Gross margin", value: "79%", delta: "+1pp" },
    ],
  }),
  box: () => ({
    items: [
      { label: "A", min: 4, q1: 8, med: 12, q3: 16, max: 22 },
      { label: "B", min: 6, q1: 10, med: 14, q3: 18, max: 24 },
      { label: "C", min: 2, q1: 5, med: 9, q3: 13, max: 20 },
    ],
  }),
  slope: () => ({
    categories: ["FY23", "FY24"],
    series: [
      { name: "Enterprise", values: [40, 55] },
      { name: "SMB", values: [28, 22] },
      { name: "Consumer", values: [18, 16] },
    ],
  }),
};

export function blankChart(type) {
  const meta = chartMeta(type);
  const make = SHAPES[meta.shape] || SHAPES.items;
  return {
    id: `chart_${Date.now()}`,
    chartType: meta.id,
    title: meta.name,
    subtitle: meta.desc,
    source: "Source: ",
    unit: "",
    insight: "",
    data: JSON.parse(JSON.stringify(make())),
  };
}
