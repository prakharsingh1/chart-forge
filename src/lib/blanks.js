export const BLANKS = {
  waterfall: {
    chartType: "waterfall",
    title: "Bridge the change — edit the action title",
    subtitle: "Metric, $M, period",
    source: "Source: ",
    unit: "$M",
    insight: "",
    data: {
      items: [
        { label: "Start", value: 100, type: "total" },
        { label: "Uplift", value: 25, type: "increase" },
        { label: "Drag", value: -10, type: "decrease" },
        { label: "End", value: 115, type: "total" },
      ],
    },
  },
  stacked_bar: {
    chartType: "stacked_bar",
    title: "Mix shifted — edit the action title",
    subtitle: "Units, period",
    source: "Source: ",
    unit: "",
    data: {
      categories: ["FY22", "FY23", "FY24"],
      series: [
        { name: "Core", values: [40, 38, 35] },
        { name: "Growth", values: [20, 28, 36] },
        { name: "Other", values: [10, 9, 8] },
      ],
    },
  },
  "100_stacked": {
    chartType: "100_stacked",
    title: "Share of mix, FY22–FY24",
    subtitle: "Mix, %",
    source: "Source: ",
    unit: "%",
    data: {
      categories: ["FY22", "FY23", "FY24"],
      series: [
        { name: "A", values: [50, 45, 40] },
        { name: "B", values: [30, 32, 35] },
        { name: "C", values: [20, 23, 25] },
      ],
    },
  },
  grouped_bar: {
    chartType: "grouped_bar",
    title: "Clustered comparison — edit the action title",
    subtitle: "Units, period",
    source: "Source: ",
    unit: "",
    data: {
      categories: ["Q1", "Q2", "Q3", "Q4"],
      series: [
        { name: "Actual", values: [20, 24, 28, 33] },
        { name: "Plan", values: [22, 24, 26, 30] },
      ],
    },
  },
  horizontal_bar: {
    chartType: "horizontal_bar",
    title: "Ranked comparison — edit the action title",
    subtitle: "Units",
    source: "Source: ",
    unit: "",
    data: {
      items: [
        { label: "Item A", value: 42 },
        { label: "Item B", value: 31 },
        { label: "Item C", value: 18 },
      ],
    },
  },
  line_trend: {
    chartType: "line_trend",
    title: "Trajectory with CAGR — edit the action title",
    subtitle: "Units, FY19–FY24",
    source: "Source: ",
    unit: "",
    data: {
      xLabels: ["FY19", "FY20", "FY21", "FY22", "FY23", "FY24"],
      series: [{ name: "KPI", values: [10, 12, 14, 17, 20, 24], showCAGR: true }],
      annotations: [{ type: "cagr", from: 0, to: 5, value: "19%" }],
    },
  },
  marimekko: {
    chartType: "marimekko",
    title: "Where value sits — width × mix",
    subtitle: "Share of value, %",
    source: "Source: ",
    unit: "%",
    data: {
      categories: [
        { label: "Seg 1", width: 45, segments: [{ name: "Prem", value: 60 }, { name: "Core", value: 40 }] },
        { label: "Seg 2", width: 35, segments: [{ name: "Prem", value: 40 }, { name: "Core", value: 60 }] },
        { label: "Seg 3", width: 20, segments: [{ name: "Prem", value: 25 }, { name: "Core", value: 75 }] },
      ],
    },
  },
  combo: {
    chartType: "combo",
    title: "Growth with margin — edit the action title",
    subtitle: "Revenue (columns) and margin % (line)",
    source: "Source: ",
    unit: "$M",
    data: {
      categories: ["Q1", "Q2", "Q3", "Q4"],
      bars: { name: "Revenue", values: [100, 110, 125, 140] },
      line: { name: "Margin %", values: [12, 13, 14, 15] },
    },
  },
  gantt: {
    chartType: "gantt",
    title: "Workplan — first value on the critical path",
    subtitle: "Weeks",
    source: "Source: ",
    unit: "",
    data: {
      axis: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
      items: [
        { label: "Diagnose", start: 0, end: 2, group: "P1" },
        { label: "Design", start: 2, end: 5, group: "P2" },
        { label: "Build", start: 4, end: 8, group: "P3" },
      ],
      milestones: [{ label: "SteerCo", at: 2 }],
    },
  },
  pie_donut: {
    chartType: "pie_donut",
    title: "Share of total — edit the action title",
    subtitle: "Mix, %",
    source: "Source: ",
    unit: "%",
    data: {
      items: [
        { label: "A", value: 42 },
        { label: "B", value: 33 },
        { label: "C", value: 25 },
      ],
      donut: true,
    },
  },
  tornado: {
    chartType: "tornado",
    title: "Sensitivity — upside vs downside",
    subtitle: "Impact, $M",
    source: "Source: ",
    unit: "$M",
    data: {
      categories: ["Price", "Volume", "Cost"],
      left: { name: "Downside", values: [12, 8, 6] },
      right: { name: "Upside", values: [9, 5, 4] },
    },
  },
  funnel: {
    chartType: "funnel",
    title: "Conversion — where the drop-off sits",
    subtitle: "Count",
    source: "Source: ",
    unit: "",
    data: {
      stages: [
        { label: "Leads", value: 10000 },
        { label: "SQL", value: 2400 },
        { label: "Won", value: 480 },
      ],
    },
  },
  scatter_bubble: {
    chartType: "scatter_bubble",
    title: "Portfolio map — reinvest vs fix",
    subtitle: "Share (x) vs growth % (y); bubble = sales",
    source: "Source: ",
    unit: "",
    data: {
      xLabel: "Relative share",
      yLabel: "Growth %",
      quadrants: true,
      points: [
        { label: "A", x: 1.4, y: 8, size: 60 },
        { label: "B", x: 0.6, y: 2, size: 30 },
        { label: "C", x: 1.8, y: 1, size: 80 },
      ],
    },
  },
  stacked_waterfall: {
    chartType: "stacked_waterfall",
    title: "Composition inside the bridge",
    subtitle: "Units",
    source: "Source: ",
    unit: "",
    data: {
      items: [
        { label: "Start", type: "total", segments: [{ name: "A", value: 60 }, { name: "B", value: 40 }] },
        { label: "Growth", type: "increase", segments: [{ name: "A", value: 10 }, { name: "B", value: 5 }] },
        { label: "End", type: "total", segments: [{ name: "A", value: 70 }, { name: "B", value: 45 }] },
      ],
    },
  },
  area_stacked: {
    chartType: "area_stacked",
    title: "Mix over time",
    subtitle: "Units",
    source: "Source: ",
    unit: "",
    data: {
      xLabels: ["FY22", "FY23", "FY24"],
      series: [
        { name: "A", values: [40, 42, 48] },
        { name: "B", values: [20, 24, 22] },
      ],
    },
  },
};

export function blankChart(type) {
  const b = BLANKS[type] || BLANKS.grouped_bar;
  return { ...JSON.parse(JSON.stringify(b)), id: `chart_${Date.now()}` };
}
