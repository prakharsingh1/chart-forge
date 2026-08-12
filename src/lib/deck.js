export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function slideFromChart(chart, extra = {}) {
  return {
    id: extra.id || uid("slide"),
    title: chart.title || extra.title || "",
    subtitle: chart.subtitle || extra.subtitle || "",
    source: chart.source || extra.source || "",
    insight: chart.insight || "",
    body: extra.body || "",
    notes: extra.notes || "",
    originalTexts: extra.originalTexts || [],
    chart: chart
      ? { ...chart, id: chart.id || uid("chart") }
      : null,
  };
}

export function deckFromCharts(name, charts, insights = null) {
  return {
    name: name || "ChartForge deck",
    insights,
    roundTrip: false,
    slides: (charts || []).map((c) => slideFromChart(c)),
  };
}

export function emptySlide(title = "New slide") {
  return {
    id: uid("slide"),
    title,
    subtitle: "",
    source: "",
    insight: "",
    body: "",
    notes: "",
    originalTexts: [],
    chart: null,
  };
}
