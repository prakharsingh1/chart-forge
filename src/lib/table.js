function num(v) {
  if (v === "" || v == null) return 0;
  const n = Number(String(v).replace(/[,%$€£₹+\s]/g, "").replace("−", "-"));
  return Number.isNaN(n) ? 0 : n;
}

export function chartToTable(chart) {
  const d = chart?.data || {};
  const type = chart.chartType;
  if (d.items && (type === "waterfall" || type === "horizontal_bar" || type === "pie_donut")) {
    return {
      columns: ["Label", "Value", ...(type === "waterfall" ? ["Type"] : [])],
      rows: d.items.map((it) =>
        type === "waterfall" ? [it.label, it.value, it.type || ""] : [it.label, it.value]
      ),
    };
  }
  if (type === "stacked_waterfall" && d.items) {
    const names = [...new Set(d.items.flatMap((it) => (it.segments || []).map((s) => s.name)))];
    return {
      columns: ["Label", "Type", ...names],
      rows: d.items.map((it) => {
        const map = Object.fromEntries((it.segments || []).map((s) => [s.name, s.value]));
        return [it.label, it.type || "increase", ...names.map((n) => map[n] ?? "")];
      }),
    };
  }
  if ((d.categories && d.series) || type === "stacked_bar" || type === "100_stacked" || type === "grouped_bar") {
    const cats = d.categories || [];
    const series = d.series || [];
    return {
      columns: ["Category", ...series.map((s) => s.name)],
      rows: cats.map((cat, i) => [typeof cat === "string" ? cat : cat.label, ...series.map((s) => s.values?.[i] ?? "")]),
    };
  }
  if (type === "tornado") {
    return {
      columns: ["Category", d.left?.name || "Left", d.right?.name || "Right"],
      rows: (d.categories || []).map((c, i) => [c, d.left?.values?.[i] ?? "", d.right?.values?.[i] ?? ""]),
    };
  }
  if (type === "marimekko") {
    const names = [...new Set((d.categories || []).flatMap((c) => (c.segments || []).map((s) => s.name)))];
    return {
      columns: ["Category", "Width", ...names],
      rows: (d.categories || []).map((c) => {
        const map = Object.fromEntries((c.segments || []).map((s) => [s.name, s.value]));
        return [c.label, c.width, ...names.map((n) => map[n] ?? "")];
      }),
    };
  }
  if (type === "line_trend" || type === "area_stacked") {
    const series = d.series || [];
    return {
      columns: ["Period", ...series.map((s) => s.name)],
      rows: (d.xLabels || []).map((lab, i) => [lab, ...series.map((s) => s.values?.[i] ?? "")]),
    };
  }
  if (type === "scatter_bubble") {
    return {
      columns: ["Label", "X", "Y", "Size"],
      rows: (d.points || []).map((p) => [p.label, p.x, p.y, p.size ?? ""]),
    };
  }
  if (type === "combo") {
    return {
      columns: ["Category", d.bars?.name || "Bars", d.line?.name || "Line"],
      rows: (d.categories || []).map((c, i) => [c, d.bars?.values?.[i] ?? "", d.line?.values?.[i] ?? ""]),
    };
  }
  if (type === "funnel") {
    return { columns: ["Stage", "Value"], rows: (d.stages || []).map((s) => [s.label, s.value]) };
  }
  if (type === "gantt") {
    return {
      columns: ["Workstream", "Start", "End", "Group"],
      rows: (d.items || []).map((it) => [it.label, it.start, it.end, it.group || ""]),
    };
  }
  return { columns: ["Key", "Value"], rows: Object.entries(d).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : v]) };
}

export function tableToChartData(chart, columns, rows) {
  const type = chart.chartType;
  const next = { ...chart.data };
  if (type === "waterfall") {
    next.items = rows.map((r) => ({
      label: String(r[0] ?? ""),
      value: num(r[1]),
      type: String(r[2] || (num(r[1]) >= 0 ? "increase" : "decrease")).toLowerCase(),
    }));
  } else if (type === "horizontal_bar" || type === "pie_donut") {
    next.items = rows.map((r) => ({ label: String(r[0] ?? ""), value: num(r[1]) }));
  } else if (type === "stacked_waterfall") {
    const names = columns.slice(2);
    next.items = rows.map((r) => ({
      label: String(r[0] ?? ""),
      type: String(r[1] || "increase").toLowerCase(),
      segments: names.map((name, i) => ({ name, value: num(r[i + 2]) })).filter((s) => s.value !== 0 || true),
    }));
  } else if (type === "stacked_bar" || type === "100_stacked" || type === "grouped_bar") {
    next.categories = rows.map((r) => String(r[0] ?? ""));
    next.series = columns.slice(1).map((name, i) => ({
      name,
      values: rows.map((r) => num(r[i + 1])),
    }));
  } else if (type === "tornado") {
    next.categories = rows.map((r) => String(r[0] ?? ""));
    next.left = { name: columns[1] || "Left", values: rows.map((r) => num(r[1])) };
    next.right = { name: columns[2] || "Right", values: rows.map((r) => num(r[2])) };
  } else if (type === "marimekko") {
    const names = columns.slice(2);
    next.categories = rows.map((r) => ({
      label: String(r[0] ?? ""),
      width: num(r[1]),
      segments: names.map((name, i) => ({ name, value: num(r[i + 2]) })),
    }));
  } else if (type === "line_trend" || type === "area_stacked") {
    next.xLabels = rows.map((r) => String(r[0] ?? ""));
    next.series = columns.slice(1).map((name, i) => ({
      name,
      values: rows.map((r) => num(r[i + 1])),
      showCAGR: true,
    }));
  } else if (type === "scatter_bubble") {
    next.points = rows.map((r) => ({ label: String(r[0] ?? ""), x: num(r[1]), y: num(r[2]), size: num(r[3]) || 20 }));
  } else if (type === "combo") {
    next.categories = rows.map((r) => String(r[0] ?? ""));
    next.bars = { name: columns[1] || "Bars", values: rows.map((r) => num(r[1])) };
    next.line = { name: columns[2] || "Line", values: rows.map((r) => num(r[2])) };
  } else if (type === "funnel") {
    next.stages = rows.map((r) => ({ label: String(r[0] ?? ""), value: num(r[1]) }));
  } else if (type === "gantt") {
    next.items = rows.map((r) => ({
      label: String(r[0] ?? ""),
      start: num(r[1]),
      end: num(r[2]),
      group: String(r[3] ?? ""),
    }));
  }
  return next;
}
