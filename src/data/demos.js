export const DEMOS = [
  {
    id: "ebit-bridge",
    firm: "McKinsey",
    name: "EBIT bridge",
    blurb: "Classic Think-Cell waterfall — volume, price, mix, cost.",
    insights: {
      title: "NorthCo EBIT walk, FY23–FY24",
      executive_summary:
        "EBIT rose $42M despite inflation. Price/mix more than offset cost inflation; volume was a modest tailwind.",
      key_metrics: [
        { name: "FY24 EBIT", value: "$412M", trend: "up" },
        { name: "Δ EBIT", value: "+$42M", trend: "up" },
        { name: "Price/mix share of lift", value: "81%", trend: "up" },
      ],
      insights: [
        "Price and mix delivered +$48M — the primary lever, not volume.",
        "COGS inflation (−$28M) was more than recovered in price.",
        "OpEx discipline added +$8M; one-offs were immaterial.",
      ],
      source: "Source: Company filings; ChartForge analysis",
    },
    charts: [
      {
        id: "w1",
        chartType: "waterfall",
        title: "Price/mix, not volume, drove 81% of the EBIT lift",
        subtitle: "EBIT, $M, FY23–FY24, NorthCo Group",
        insight: "A $42M walk: +48 price/mix, +14 volume, −28 COGS, +8 OpEx.",
        source: "Source: Company P&L; ChartForge analysis",
        unit: "$M",
        data: {
          items: [
            { label: "FY23 EBIT", value: 370, type: "total" },
            { label: "Volume", value: 14, type: "increase" },
            { label: "Price", value: 31, type: "increase" },
            { label: "Mix", value: 17, type: "increase" },
            { label: "COGS inflation", value: -28, type: "decrease" },
            { label: "OpEx", value: 8, type: "increase" },
            { label: "FY24 EBIT", value: 412, type: "total" },
          ],
        },
      },
    ],
  },
  {
    id: "mekko-share",
    firm: "BCG",
    name: "Market Mekko",
    blurb: "Where value sits: region width × premium mix.",
    insights: {
      title: "Global snacks value pool",
      executive_summary: "North America is 42% of category value and still the most premium mix.",
      key_metrics: [
        { name: "Category value", value: "$48B", trend: "stable" },
        { name: "NA share of value", value: "42%", trend: "stable" },
      ],
      insights: [
        "NA + Europe = 73% of value; APAC is volume-heavy and less premium.",
        "Premium is 58% of NA value vs 31% in APAC — the pricing opportunity.",
      ],
      source: "Source: NielsenIQ; Euromonitor; ChartForge analysis",
    },
    charts: [
      {
        id: "m1",
        chartType: "marimekko",
        title: "Premium mix is a North America game; APAC is still core",
        subtitle: "Share of global snacks value, %, 2024",
        insight: "Width = region value share; height = tier mix within region.",
        source: "Source: NielsenIQ; Euromonitor 2024",
        unit: "%",
        data: {
          categories: [
            {
              label: "N. America",
              width: 42,
              segments: [
                { name: "Premium", value: 58 },
                { name: "Core", value: 30 },
                { name: "Value", value: 12 },
              ],
            },
            {
              label: "Europe",
              width: 31,
              segments: [
                { name: "Premium", value: 44 },
                { name: "Core", value: 38 },
                { name: "Value", value: 18 },
              ],
            },
            {
              label: "APAC",
              width: 19,
              segments: [
                { name: "Premium", value: 31 },
                { name: "Core", value: 41 },
                { name: "Value", value: 28 },
              ],
            },
            {
              label: "RoW",
              width: 8,
              segments: [
                { name: "Premium", value: 22 },
                { name: "Core", value: 48 },
                { name: "Value", value: 30 },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: "cagr-line",
    firm: "Bain",
    name: "Growth trajectory",
    blurb: "Multi-series line with CAGR callout.",
    insights: {
      title: "Digital vs store revenue",
      executive_summary: "Digital CAGR of 18% is 3× stores; mix will flip by FY27 if run-rate holds.",
      key_metrics: [
        { name: "Digital CAGR", value: "18%", trend: "up" },
        { name: "Store CAGR", value: "6%", trend: "stable" },
      ],
      insights: ["Digital crossed 40% of sales in FY24.", "Stores still grow, but are no longer the growth engine."],
      source: "Source: Company reports",
    },
    charts: [
      {
        id: "l1",
        chartType: "line_trend",
        title: "Digital is compounding at 18% — three times store growth",
        subtitle: "Net sales, $B, FY19–FY24",
        insight: "Digital $4.1B → $9.4B; stores $8.8B → $11.7B.",
        source: "Source: Company annual reports",
        unit: "$B",
        data: {
          xLabels: ["FY19", "FY20", "FY21", "FY22", "FY23", "FY24"],
          series: [
            { name: "Digital", values: [4.1, 5.2, 6.4, 7.3, 8.4, 9.4], showCAGR: true },
            { name: "Stores", values: [8.8, 8.1, 9.0, 9.8, 10.7, 11.7], showCAGR: true },
          ],
          annotations: [{ type: "cagr", from: 0, to: 5, value: "18% digital" }],
        },
      },
    ],
  },
  {
    id: "ranked",
    firm: "McKinsey",
    name: "Ranked markets",
    blurb: "Horizontal bars, sorted, labeled.",
    insights: {
      title: "Contribution by market",
      executive_summary: "Top 5 markets are 71% of incremental profit.",
      key_metrics: [{ name: "Top 5 share", value: "71%", trend: "stable" }],
      insights: ["Germany and UK punch above revenue weight on profit."],
      source: "Source: Internal finance",
    },
    charts: [
      {
        id: "h1",
        chartType: "horizontal_bar",
        title: "Five markets deliver 71% of incremental profit",
        subtitle: "Incremental EBIT, $M, FY24",
        insight: "Concentrate coverage on DE, UK, US, FR, NL.",
        source: "Source: Internal finance pack",
        unit: "$M",
        data: {
          items: [
            { label: "Germany", value: 86 },
            { label: "United Kingdom", value: 71 },
            { label: "United States", value: 64 },
            { label: "France", value: 41 },
            { label: "Netherlands", value: 33 },
            { label: "Italy", value: 22 },
            { label: "Spain", value: 18 },
            { label: "Nordics", value: 15 },
          ],
        },
      },
    ],
  },
  {
    id: "mix-100",
    firm: "BCG",
    name: "Channel mix",
    blurb: "100% stacked columns with in-segment labels.",
    insights: {
      title: "Route-to-market shift",
      executive_summary: "DTC doubled in four years; wholesale is still half of sales.",
      key_metrics: [{ name: "DTC FY24", value: "28%", trend: "up" }],
      insights: ["Wholesale declined 14pp; retail held."],
      source: "Source: Internal sales cube",
    },
    charts: [
      {
        id: "s1",
        chartType: "100_stacked",
        title: "DTC doubled to 28% of sales; wholesale is no longer dominant",
        subtitle: "Net sales mix, %, FY20–FY24",
        insight: "A structural channel shift, not a one-year spike.",
        source: "Source: Internal sales cube",
        unit: "%",
        data: {
          categories: ["FY20", "FY21", "FY22", "FY23", "FY24"],
          series: [
            { name: "Wholesale", values: [62, 57, 52, 49, 48] },
            { name: "Retail", values: [24, 25, 25, 24, 24] },
            { name: "DTC", values: [14, 18, 23, 27, 28] },
          ],
        },
      },
    ],
  },
  {
    id: "gantt",
    firm: "McKinsey",
    name: "Implementation Gantt",
    blurb: "Think-Cell style workplan with milestones.",
    insights: {
      title: "Value capture roadmap",
      executive_summary: "12-week program: diagnose, design, mobilize. First dollar in week 8.",
      key_metrics: [{ name: "Time to first $", value: "W8", trend: "stable" }],
      insights: ["SteerCo at W4 and W8 are the only decision gates."],
      source: "Source: Engagement workplan",
    },
    charts: [
      {
        id: "g1",
        chartType: "gantt",
        title: "First value in week 8 — design must lock at the W4 steerco",
        subtitle: "Implementation workplan, weeks 1–12",
        insight: "Three workstreams in parallel after diagnose; IT is the long pole.",
        source: "Source: Engagement workplan",
        unit: "",
        data: {
          axis: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"],
          items: [
            { label: "Diagnostic", start: 0, end: 3, group: "Phase 1" },
            { label: "Pricing design", start: 3, end: 6, group: "Phase 2" },
            { label: "Ops design", start: 3, end: 7, group: "Phase 2" },
            { label: "IT build", start: 5, end: 11, group: "Phase 3" },
            { label: "Pilot", start: 7, end: 9, group: "Phase 3" },
            { label: "Scale-up", start: 9, end: 12, group: "Phase 3" },
          ],
          milestones: [
            { label: "SteerCo 1", at: 3 },
            { label: "SteerCo 2", at: 7 },
            { label: "Go-live", at: 9 },
          ],
        },
      },
    ],
  },
  {
    id: "bubble",
    firm: "BCG",
    name: "Growth–share map",
    blurb: "Bubble chart with quadrant lines.",
    insights: {
      title: "Portfolio positioning",
      executive_summary: "Two brands sit in high-share / high-growth; three need a fix-or-exit call.",
      key_metrics: [{ name: "Stars", value: "2 brands", trend: "up" }],
      insights: ["Aura and North are the reinvestment cases.", "Lite and Value are subscale and slow."],
      source: "Source: IRI; internal finance",
    },
    charts: [
      {
        id: "b1",
        chartType: "scatter_bubble",
        title: "Reinvest in Aura and North; Lite and Value are subscale",
        subtitle: "Relative share (x) vs category growth % (y); bubble = brand sales",
        insight: "Quadrants at median share and 4% market growth.",
        source: "Source: IRI 52 weeks; internal sales",
        unit: "%",
        data: {
          xLabel: "Relative market share",
          yLabel: "Category growth %",
          quadrants: true,
          points: [
            { label: "Aura", x: 1.8, y: 9.2, size: 90 },
            { label: "North", x: 1.4, y: 7.1, size: 70 },
            { label: "Heritage", x: 2.1, y: 1.2, size: 110 },
            { label: "Urban", x: 0.7, y: 8.4, size: 40 },
            { label: "Lite", x: 0.4, y: 1.5, size: 25 },
            { label: "Value", x: 0.5, y: 0.8, size: 30 },
            { label: "Kids", x: 0.9, y: 5.5, size: 45 },
          ],
        },
      },
    ],
  },
  {
    id: "combo",
    firm: "Bain",
    name: "Revenue vs margin",
    blurb: "Dual-axis combo — the partner favorite.",
    insights: {
      title: "Growth with margin expansion",
      executive_summary: "Revenue +11% with 180bp margin expansion — operating leverage is showing.",
      key_metrics: [
        { name: "FY24 revenue", value: "$1.42B", trend: "up" },
        { name: "EBIT margin", value: "16.4%", trend: "up" },
      ],
      insights: ["Margin inflected in H2 as mix and price landed."],
      source: "Source: Quarterly filings",
    },
    charts: [
      {
        id: "c1",
        chartType: "combo",
        title: "Revenue compounded while margin expanded 180bp",
        subtitle: "Net sales $M (columns) and EBIT margin % (line), quarterly",
        insight: "Operating leverage kicked in from Q3 FY23.",
        source: "Source: Quarterly filings",
        unit: "$M",
        data: {
          categories: ["Q1'23", "Q2'23", "Q3'23", "Q4'23", "Q1'24", "Q2'24", "Q3'24", "Q4'24"],
          bars: { name: "Revenue", values: [298, 312, 331, 348, 355, 368, 382, 415] },
          line: { name: "EBIT %", values: [14.6, 14.8, 15.1, 15.4, 15.6, 15.9, 16.1, 16.4] },
        },
      },
    ],
  },
];
