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
      { label: "EBIT FY20", value: 120, type: "total" },
      { label: "Price", value: 18, type: "increase" },
      { label: "Volume", value: -9, type: "decrease" },
      { label: "Measures", type: "increase", segments: [{ name: "M2", value: 8 }, { name: "M3", value: 6 }, { name: "M4", value: 4 }] },
      { label: "Delta to target", value: 22, type: "hatch" },
      { label: "EBIT FY21", value: 169, type: "total" },
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
    xLabel: "Word count",
    yLabel: "Open rate",
    xMeanLabel: "Average word count",
    yMeanLabel: "Average open rate",
    band: { x0: 4, x1: 9 },
    points: Array.from({ length: 36 }, (_, i) => ({
      label: "",
      x: 2 + (i % 14) + (i % 5) * 0.3,
      y: 0.38 - i * 0.006 + ((i * 7) % 9) * 0.012,
      size: 12,
    })),
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
      { source: "Mexico", target: "US Exports", value: 322 },
      { source: "Mexico", target: "US Imports", value: 518 },
      { source: "Canada", target: "US Exports", value: 351 },
      { source: "Canada", target: "US Imports", value: 411 },
      { source: "China", target: "US Exports", value: 148 },
      { source: "China", target: "US Imports", value: 434 },
      { source: "Germany", target: "US Exports", value: 76 },
      { source: "Germany", target: "US Imports", value: 162 },
      { source: "Other", target: "US Exports", value: 410 },
      { source: "Other", target: "US Imports", value: 412 },
    ],
  }),
  bubble_matrix: () => ({
    rows: ["Rackets", "Bats", "Gloves", "Helmets", "Shoes"],
    cols: ["West", "Central", "Coast", "Metro", "East", "South"],
    colorLabel: "SC cost % of revenue",
    sizeLabel: "Bubble = order volume",
    breaks: [9, 11, 15],
    cells: [
      { row: "Rackets", col: "West", size: 90, value: 16 },
      { row: "Rackets", col: "Central", size: 70, value: 12 },
      { row: "Rackets", col: "Coast", size: 55, value: 10 },
      { row: "Rackets", col: "Metro", size: 40, value: 8 },
      { row: "Rackets", col: "East", size: 60, value: 11 },
      { row: "Rackets", col: "South", size: 35, value: 7 },
      { row: "Bats", col: "West", size: 50, value: 13 },
      { row: "Bats", col: "Central", size: 80, value: 15 },
      { row: "Bats", col: "Coast", size: 45, value: 9 },
      { row: "Bats", col: "Metro", size: 30, value: 8 },
      { row: "Bats", col: "East", size: 55, value: 12 },
      { row: "Bats", col: "South", size: 25, value: 6 },
      { row: "Gloves", col: "West", size: 40, value: 10 },
      { row: "Gloves", col: "Central", size: 35, value: 9 },
      { row: "Gloves", col: "Coast", size: 70, value: 14 },
      { row: "Gloves", col: "Metro", size: 50, value: 11 },
      { row: "Gloves", col: "East", size: 20, value: 7 },
      { row: "Gloves", col: "South", size: 15, value: 8 },
      { row: "Helmets", col: "West", size: 22, value: 8 },
      { row: "Helmets", col: "Central", size: 28, value: 9 },
      { row: "Helmets", col: "Coast", size: 18, value: 7 },
      { row: "Helmets", col: "Metro", size: 65, value: 13 },
      { row: "Helmets", col: "East", size: 40, value: 10 },
      { row: "Helmets", col: "South", size: 30, value: 9 },
      { row: "Shoes", col: "West", size: 75, value: 12 },
      { row: "Shoes", col: "Central", size: 48, value: 10 },
      { row: "Shoes", col: "Coast", size: 52, value: 11 },
      { row: "Shoes", col: "Metro", size: 88, value: 16 },
      { row: "Shoes", col: "East", size: 42, value: 9 },
      { row: "Shoes", col: "South", size: 60, value: 14 },
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
  fan: () => ({
    xLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
    p10: [98, 96, 94, 91, 89, 86, 84, 81],
    p50: [100, 102, 105, 107, 110, 112, 116, 119],
    p90: [103, 108, 114, 121, 128, 136, 144, 152],
    actual: [100, 101, 104, 106, 108],
  }),
  underwater: () => ({
    xLabels: ["2019", "2020", "2021", "2022", "2023", "2024"],
    nav: [100, 112, 108, 94, 101, 118],
    drawdown: [0, 0, -3.6, -16.1, -9.8, 0],
  }),
  cum_bench: () => ({
    xLabels: ["Y1", "Y2", "Y3", "Y4", "Y5", "Y6"],
    fundName: "Fund",
    benchName: "HFRI",
    fund: [100, 112, 128, 119, 141, 158],
    bench: [100, 108, 118, 109, 124, 132],
  }),
  brinson: () => ({
    categories: ["Tech", "Health", "Energy", "Financials", "Staples"],
    allocation: [42, -18, 12, 8, -6],
    selection: [31, 22, -14, 9, 4],
    interaction: [6, -4, 3, -2, 1],
  }),
  long_short: () => ({
    categories: ["Software", "Biotech", "Banks", "Energy", "Retail"],
    long: [1.8, 1.1, 0.4, 0.7, 0.3],
    short: [-0.6, -0.9, -1.2, -0.2, -0.5],
  }),
  ohlc: () => ({
    items: [
      { label: "M", o: 102, h: 108, l: 101, c: 106, volume: 12 },
      { label: "T", o: 106, h: 107, l: 99, c: 100, volume: 18 },
      { label: "W", o: 100, h: 104, l: 98, c: 103, volume: 9 },
      { label: "T", o: 103, h: 110, l: 102, c: 109, volume: 14 },
      { label: "F", o: 109, h: 111, l: 105, c: 106, volume: 11 },
    ],
  }),
  ridgeline: () => ({
    groups: [
      { label: "2019", values: [-0.4, 0.2, 0.8, 1.1, 0.3, -0.1, 0.6] },
      { label: "2020", values: [-2.1, -0.8, 1.4, 2.2, 0.1, -1.1, 0.9] },
      { label: "2021", values: [0.4, 0.9, 1.2, 0.7, 0.5, 0.8, 1.0] },
      { label: "2022", values: [-1.6, -0.9, -0.2, 0.3, -1.1, 0.1, -0.4] },
    ],
  }),
  corr: () => ({
    rows: ["Eq", "Cr", "FX", "Cmd", "Rates"],
    labels: ["Eq", "Cr", "FX", "Cmd", "Rates"],
    values: [
      [1, 0.62, 0.21, 0.34, -0.18],
      [0.62, 1, 0.11, 0.28, 0.08],
      [0.21, 0.11, 1, 0.19, 0.44],
      [0.34, 0.28, 0.19, 1, 0.06],
      [-0.18, 0.08, 0.44, 0.06, 1],
    ],
  }),
  yield: () => ({
    tenors: ["2Y", "5Y", "7Y", "10Y", "20Y", "30Y"],
    series: [
      { name: "Spot", values: [4.2, 4.0, 4.1, 4.25, 4.5, 4.55] },
      { name: "1Y ago", values: [4.8, 4.4, 4.3, 4.2, 4.35, 4.4] },
    ],
  }),
  forest: () => ({
    items: [
      { label: "Mkt", value: 0.92, low: 0.81, high: 1.04 },
      { label: "SMB", value: 0.18, low: 0.02, high: 0.31 },
      { label: "HML", value: -0.22, low: -0.38, high: -0.06 },
      { label: "Mom", value: 0.11, low: -0.04, high: 0.27 },
      { label: "Qual", value: 0.34, low: 0.19, high: 0.48 },
    ],
  }),
  qq: () => ({ sample: [-1.4, -0.8, -0.3, 0.1, 0.4, 0.6, 0.9, 1.2, 1.8, 2.1] }),
  horizon: () => ({
    xLabels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"],
    values: [0.4, -0.8, 1.2, 0.3, -1.6, -0.4, 0.9, 1.5, -0.2, 0.6, -1.1, 0.3],
    bands: 4,
  }),
  order_book: () => ({
    bids: [
      { price: 101.2, size: 40 },
      { price: 101.1, size: 62 },
      { price: 101.0, size: 88 },
      { price: 100.8, size: 120 },
    ],
    asks: [
      { price: 101.3, size: 36 },
      { price: 101.4, size: 54 },
      { price: 101.6, size: 90 },
      { price: 101.9, size: 110 },
    ],
  }),
  parallel: () => ({
    axes: ["Vol", "Beta", "P/E", "Mom", "Quality"],
    rows: [
      { label: "AAPL", Vol: 22, Beta: 1.1, "P/E": 28, Mom: 8, Quality: 82 },
      { label: "XOM", Vol: 18, Beta: 0.9, "P/E": 12, Mom: -2, Quality: 61 },
      { label: "NVDA", Vol: 38, Beta: 1.6, "P/E": 45, Mom: 24, Quality: 77 },
    ],
  }),
  style_box: () => ({
    points: [
      { label: "Fund", xLabel: "Growth", yLabel: "Large", size: 90 },
      { label: "Bench", xLabel: "Blend", yLabel: "Large", size: 50 },
    ],
  }),
  calendar_days: () => ({
    days: Array.from({ length: 21 }, (_, i) => ({ label: String(i + 1), value: Math.round((Math.sin(i) * 12 + (i % 5) - 2) * 10) / 10 })),
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
