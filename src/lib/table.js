import { chartMeta } from "../theme.js";

function num(v) {
  if (v === "" || v == null) return 0;
  const n = Number(String(v).replace(/[,%$€£₹+\s]/g, "").replace("−", "-"));
  return Number.isNaN(n) ? 0 : n;
}

export function chartToTable(chart) {
  const d = chart?.data || {};
  const shape = chartMeta(chart.chartType).shape;

  if (shape === "waterfall" || (d.items && (shape === "items" || shape === "hierarchy"))) {
    return {
      columns: ["Label", "Value", ...(shape === "waterfall" ? ["Type"] : [])],
      rows: (d.items || []).map((it) => (shape === "waterfall" ? [it.label, it.value, it.type || ""] : [it.label, it.value])),
    };
  }
  if (shape === "stacked_waterfall") {
    const names = [...new Set((d.items || []).flatMap((it) => (it.segments || []).map((s) => s.name)))];
    return {
      columns: ["Label", "Type", ...names],
      rows: (d.items || []).map((it) => {
        const map = Object.fromEntries((it.segments || []).map((s) => [s.name, s.value]));
        return [it.label, it.type || "increase", ...names.map((n) => map[n] ?? "")];
      }),
    };
  }
  if (shape === "series" || shape === "line") {
    const cats = d.categories || d.xLabels || [];
    const series = d.series || [];
    return {
      columns: [shape === "line" ? "Period" : "Category", ...series.map((s) => s.name)],
      rows: cats.map((cat, i) => [typeof cat === "string" ? cat : cat.label, ...series.map((s) => s.values?.[i] ?? "")]),
    };
  }
  if (shape === "tornado" || shape === "dumbbell") {
    const cats = d.categories || [];
    const left = d.left?.values || d.start || [];
    const right = d.right?.values || d.end || [];
    return {
      columns: ["Category", d.left?.name || "Start", d.right?.name || "End"],
      rows: cats.map((c, i) => [c, left[i] ?? "", right[i] ?? ""]),
    };
  }
  if (shape === "mekko") {
    const names = [...new Set((d.categories || []).flatMap((c) => (c.segments || []).map((s) => s.name)))];
    return {
      columns: ["Category", "Width", ...names],
      rows: (d.categories || []).map((c) => {
        const map = Object.fromEntries((c.segments || []).map((s) => [s.name, s.value]));
        return [c.label, c.width, ...names.map((n) => map[n] ?? "")];
      }),
    };
  }
  if (shape === "scatter") {
    return { columns: ["Label", "X", "Y", "Size"], rows: (d.points || []).map((p) => [p.label, p.x, p.y, p.size ?? ""]) };
  }
  if (shape === "combo") {
    return {
      columns: ["Category", d.bars?.name || "Bars", d.line?.name || "Line"],
      rows: (d.categories || []).map((c, i) => [c, d.bars?.values?.[i] ?? "", d.line?.values?.[i] ?? ""]),
    };
  }
  if (shape === "funnel") return { columns: ["Stage", "Value"], rows: (d.stages || []).map((s) => [s.label, s.value]) };
  if (shape === "gantt") {
    return { columns: ["Workstream", "Start", "End", "Group"], rows: (d.items || []).map((it) => [it.label, it.start, it.end, it.group || ""]) };
  }
  if (shape === "heatmap") {
    const cols = d.cols || [];
    return {
      columns: ["Row", ...cols],
      rows: (d.rows || []).map((r, i) => [r, ...(d.values?.[i] || [])]),
    };
  }
  if (shape === "sankey") {
    return { columns: ["Source", "Target", "Value"], rows: (d.links || []).map((l) => [l.source, l.target, l.value]) };
  }
  if (shape === "bubble_matrix") {
    return {
      columns: ["Row", "Col", "Size", "Value"],
      rows: (d.cells || []).map((c) => [c.row, c.col, c.size, c.value]),
    };
  }
  if (shape === "gauge") {
    return { columns: ["Metric", "Value"], rows: [["Value", d.value], ["Max", d.max], ["Target", d.target ?? ""]] };
  }
  if (shape === "kpis") {
    return { columns: ["Label", "Value", "Delta"], rows: (d.items || []).map((it) => [it.label, it.value, it.delta || ""]) };
  }
  if (shape === "box") {
    return { columns: ["Label", "Min", "Q1", "Med", "Q3", "Max"], rows: (d.items || []).map((it) => [it.label, it.min, it.q1, it.med, it.q3, it.max]) };
  }
  if (shape === "slope") {
    const series = d.series || [];
    return {
      columns: ["Series", ...(d.categories || ["A", "B"])],
      rows: series.map((s) => [s.name, ...(s.values || [])]),
    };
  }
  if (shape === "bullet") {
    return { columns: ["Label", "Value", "Target"], rows: (d.items || []).map((it) => [it.label, it.value, it.target]) };
  }
  if (shape === "fan") {
    const labs = d.xLabels || [];
    return {
      columns: ["Period", "P10", "P50", "P90", "Actual"],
      rows: labs.map((lab, i) => [lab, d.p10?.[i] ?? "", d.p50?.[i] ?? "", d.p90?.[i] ?? "", d.actual?.[i] ?? ""]),
    };
  }
  if (shape === "underwater") {
    const labs = d.xLabels || [];
    const dd = d.drawdown || d.nav || d.values || [];
    return { columns: ["Period", "Drawdown"], rows: labs.map((lab, i) => [lab, dd[i] ?? ""]) };
  }
  if (shape === "cum_bench") {
    const labs = d.xLabels || [];
    const fund = d.fund || d.series?.[0]?.values || [];
    const bench = d.bench || d.series?.[1]?.values || [];
    return { columns: ["Period", d.fundName || "Fund", d.benchName || "Benchmark"], rows: labs.map((lab, i) => [lab, fund[i] ?? "", bench[i] ?? ""]) };
  }
  if (shape === "brinson") {
    return {
      columns: ["Bucket", "Allocation", "Selection", "Interaction"],
      rows: (d.categories || []).map((c, i) => [c, d.allocation?.[i] ?? "", d.selection?.[i] ?? "", d.interaction?.[i] ?? ""]),
    };
  }
  if (shape === "long_short") {
    return {
      columns: ["Name", "Long", "Short"],
      rows: (d.categories || []).map((c, i) => [c, d.long?.[i] ?? "", d.short?.[i] ?? ""]),
    };
  }
  if (shape === "ohlc") {
    return { columns: ["Bar", "Open", "High", "Low", "Close"], rows: (d.items || []).map((it) => [it.label, it.o, it.h, it.l, it.c]) };
  }
  if (shape === "ridgeline") {
    const groups = d.groups || [];
    const n = Math.max(1, ...groups.map((g) => (g.values || []).length));
    return {
      columns: ["Group", ...Array.from({ length: n }, (_, i) => `s${i + 1}`)],
      rows: groups.map((g) => [g.label, ...(g.values || [])]),
    };
  }
  if (shape === "corr") {
    const rows = d.rows || d.labels || [];
    return { columns: ["", ...rows], rows: rows.map((r, i) => [r, ...(d.values?.[i] || [])]) };
  }
  if (shape === "yield") {
    const tenors = d.tenors || d.xLabels || [];
    const series = d.series || [];
    return { columns: ["Tenor", ...series.map((s) => s.name)], rows: tenors.map((t, i) => [t, ...series.map((s) => s.values?.[i] ?? "")]) };
  }
  if (shape === "forest") {
    return { columns: ["Factor", "Estimate", "Low", "High"], rows: (d.items || []).map((it) => [it.label, it.value, it.low, it.high]) };
  }
  if (shape === "qq") {
    return { columns: ["Sample"], rows: (d.sample || d.values || []).map((v) => [v]) };
  }
  if (shape === "horizon") {
    const labs = d.xLabels || [];
    const vals = d.values || [];
    return { columns: ["Period", "Value"], rows: labs.map((lab, i) => [lab, vals[i] ?? ""]) };
  }
  if (shape === "order_book") {
    const n = Math.max((d.bids || []).length, (d.asks || []).length);
    return {
      columns: ["Bid px", "Bid sz", "Ask px", "Ask sz"],
      rows: Array.from({ length: n }, (_, i) => [d.bids?.[i]?.price ?? "", d.bids?.[i]?.size ?? "", d.asks?.[i]?.price ?? "", d.asks?.[i]?.size ?? ""]),
    };
  }
  if (shape === "parallel") {
    const axes = d.axes || [];
    return { columns: ["Name", ...axes], rows: (d.rows || []).map((r) => [r.label || "", ...axes.map((ax) => r[ax] ?? "")]) };
  }
  if (shape === "style_box") {
    return { columns: ["Label", "Value/Growth", "Size bucket", "Weight"], rows: (d.points || []).map((p) => [p.label, p.xLabel, p.yLabel, p.size]) };
  }
  if (shape === "calendar_days") {
    return { columns: ["Day", "P&L"], rows: (d.days || d.items || []).map((it) => [it.label, it.value]) };
  }
  return { columns: ["Key", "Value"], rows: Object.entries(d).map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : v]) };
}

export function tableToChartData(chart, columns, rows) {
  const shape = chartMeta(chart.chartType).shape;
  const next = { ...chart.data };

  if (shape === "waterfall") {
    next.items = rows.map((r) => ({ label: String(r[0] ?? ""), value: num(r[1]), type: String(r[2] || "increase").toLowerCase() }));
  } else if (shape === "items" || shape === "hierarchy") {
    next.items = rows.map((r) => ({ label: String(r[0] ?? ""), value: num(r[1]) }));
  } else if (shape === "stacked_waterfall") {
    const names = columns.slice(2);
    next.items = rows.map((r) => ({
      label: String(r[0] ?? ""),
      type: String(r[1] || "increase").toLowerCase(),
      segments: names.map((name, i) => ({ name, value: num(r[i + 2]) })),
    }));
  } else if (shape === "series" || shape === "line") {
    const cats = rows.map((r) => String(r[0] ?? ""));
    const series = columns.slice(1).map((name, i) => ({ name, values: rows.map((r) => num(r[i + 1])), showCAGR: true }));
    if (shape === "line") {
      next.xLabels = cats;
      next.series = series;
    } else {
      next.categories = cats;
      next.series = series;
    }
  } else if (shape === "tornado") {
    next.categories = rows.map((r) => String(r[0] ?? ""));
    next.left = { name: columns[1] || "Left", values: rows.map((r) => num(r[1])) };
    next.right = { name: columns[2] || "Right", values: rows.map((r) => num(r[2])) };
  } else if (shape === "dumbbell") {
    next.categories = rows.map((r) => String(r[0] ?? ""));
    next.start = rows.map((r) => num(r[1]));
    next.end = rows.map((r) => num(r[2]));
  } else if (shape === "mekko") {
    const names = columns.slice(2);
    next.categories = rows.map((r) => ({
      label: String(r[0] ?? ""),
      width: num(r[1]),
      segments: names.map((name, i) => ({ name, value: num(r[i + 2]) })),
    }));
  } else if (shape === "scatter") {
    next.points = rows.map((r) => ({ label: String(r[0] ?? ""), x: num(r[1]), y: num(r[2]), size: num(r[3]) || 20 }));
  } else if (shape === "combo") {
    next.categories = rows.map((r) => String(r[0] ?? ""));
    next.bars = { name: columns[1] || "Bars", values: rows.map((r) => num(r[1])) };
    next.line = { name: columns[2] || "Line", values: rows.map((r) => num(r[2])) };
  } else if (shape === "funnel") {
    next.stages = rows.map((r) => ({ label: String(r[0] ?? ""), value: num(r[1]) }));
  } else if (shape === "gantt") {
    next.items = rows.map((r) => ({ label: String(r[0] ?? ""), start: num(r[1]), end: num(r[2]), group: String(r[3] ?? "") }));
  } else if (shape === "heatmap") {
    next.rows = rows.map((r) => String(r[0] ?? ""));
    next.cols = columns.slice(1);
    next.values = rows.map((r) => r.slice(1).map(num));
  } else if (shape === "sankey") {
    next.links = rows.map((r) => ({ source: String(r[0] ?? ""), target: String(r[1] ?? ""), value: num(r[2]) }));
  } else if (shape === "bubble_matrix") {
    next.cells = rows.map((r) => ({ row: String(r[0] ?? ""), col: String(r[1] ?? ""), size: num(r[2]), value: num(r[3]) }));
    next.rows = [...new Set(next.cells.map((c) => c.row))];
    next.cols = [...new Set(next.cells.map((c) => c.col))];
  } else if (shape === "gauge") {
    const map = Object.fromEntries(rows.map((r) => [String(r[0]).toLowerCase(), r[1]]));
    next.value = num(map.value);
    next.max = num(map.max) || 100;
    next.target = num(map.target);
  } else if (shape === "kpis") {
    next.items = rows.map((r) => ({ label: String(r[0] ?? ""), value: r[1], delta: r[2] }));
  } else if (shape === "box") {
    next.items = rows.map((r) => ({ label: String(r[0] ?? ""), min: num(r[1]), q1: num(r[2]), med: num(r[3]), q3: num(r[4]), max: num(r[5]) }));
  } else if (shape === "slope") {
    next.series = rows.map((r) => ({ name: String(r[0] ?? ""), values: r.slice(1).map(num) }));
  } else if (shape === "bullet") {
    next.items = rows.map((r) => ({ label: String(r[0] ?? ""), value: num(r[1]), target: num(r[2]) }));
  } else if (shape === "fan") {
    next.xLabels = rows.map((r) => String(r[0] ?? ""));
    next.p10 = rows.map((r) => num(r[1]));
    next.p50 = rows.map((r) => num(r[2]));
    next.p90 = rows.map((r) => num(r[3]));
    next.actual = rows.map((r) => (r[4] === "" || r[4] == null ? NaN : num(r[4])));
  } else if (shape === "underwater") {
    next.xLabels = rows.map((r) => String(r[0] ?? ""));
    next.drawdown = rows.map((r) => num(r[1]));
  } else if (shape === "cum_bench") {
    next.xLabels = rows.map((r) => String(r[0] ?? ""));
    next.fundName = columns[1] || "Fund";
    next.benchName = columns[2] || "Benchmark";
    next.fund = rows.map((r) => num(r[1]));
    next.bench = rows.map((r) => num(r[2]));
  } else if (shape === "brinson") {
    next.categories = rows.map((r) => String(r[0] ?? ""));
    next.allocation = rows.map((r) => num(r[1]));
    next.selection = rows.map((r) => num(r[2]));
    next.interaction = rows.map((r) => num(r[3]));
  } else if (shape === "long_short") {
    next.categories = rows.map((r) => String(r[0] ?? ""));
    next.long = rows.map((r) => num(r[1]));
    next.short = rows.map((r) => num(r[2]));
  } else if (shape === "ohlc") {
    next.items = rows.map((r) => ({ label: String(r[0] ?? ""), o: num(r[1]), h: num(r[2]), l: num(r[3]), c: num(r[4]) }));
  } else if (shape === "ridgeline") {
    next.groups = rows.map((r) => ({ label: String(r[0] ?? ""), values: r.slice(1).map(num) }));
  } else if (shape === "corr") {
    next.rows = rows.map((r) => String(r[0] ?? ""));
    next.labels = next.rows;
    next.values = rows.map((r) => r.slice(1).map(num));
  } else if (shape === "yield") {
    next.tenors = rows.map((r) => String(r[0] ?? ""));
    next.series = columns.slice(1).map((name, i) => ({ name, values: rows.map((r) => num(r[i + 1])) }));
  } else if (shape === "forest") {
    next.items = rows.map((r) => ({ label: String(r[0] ?? ""), value: num(r[1]), low: num(r[2]), high: num(r[3]) }));
  } else if (shape === "qq") {
    next.sample = rows.map((r) => num(r[0]));
  } else if (shape === "horizon") {
    next.xLabels = rows.map((r) => String(r[0] ?? ""));
    next.values = rows.map((r) => num(r[1]));
  } else if (shape === "order_book") {
    next.bids = rows.filter((r) => r[0] !== "").map((r) => ({ price: num(r[0]), size: num(r[1]) }));
    next.asks = rows.filter((r) => r[2] !== "").map((r) => ({ price: num(r[2]), size: num(r[3]) }));
  } else if (shape === "parallel") {
    const axes = columns.slice(1);
    next.axes = axes;
    next.rows = rows.map((r) => ({ label: String(r[0] ?? ""), ...Object.fromEntries(axes.map((ax, i) => [ax, num(r[i + 1])])) }));
  } else if (shape === "style_box") {
    next.points = rows.map((r) => ({ label: String(r[0] ?? ""), xLabel: String(r[1] ?? ""), yLabel: String(r[2] ?? ""), size: num(r[3]) || 40 }));
  } else if (shape === "calendar_days") {
    next.days = rows.map((r) => ({ label: String(r[0] ?? ""), value: num(r[1]) }));
  }
  return next;
}

export function addTableRow(columns, rows) {
  return [...rows, columns.map((_, i) => (i === 0 ? "New" : "0"))];
}

export function addTableColumn(columns, rows, name) {
  const label = name || `Series ${columns.length}`;
  return { columns: [...columns, label], rows: rows.map((r) => [...r, "0"]) };
}

export function deleteTableRow(rows, index) {
  if (rows.length <= 1) return rows;
  return rows.filter((_, i) => i !== index);
}

export function renameColumn(columns, index, name) {
  return columns.map((c, i) => (i === index ? name : c));
}
