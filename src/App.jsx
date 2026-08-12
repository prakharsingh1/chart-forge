import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PALETTES, CHART_TYPES } from "./theme.js";
import { extractTextFromFile } from "./lib/files.js";
import { extractInsights, generateChartData, generateFromBrief } from "./lib/ai.js";
import { chartToTable, tableToChartData } from "./lib/table.js";
import { renderChart } from "./charts/render.js";
import { DEMOS } from "./data/demos.js";
import { downloadDataUrl, downloadSvg, exportExcel, exportPptx, svgToPngDataUrl } from "./lib/export.js";
import { slug } from "./lib/format.js";

function ChartCanvas({ chart, paletteKey }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pal = PALETTES[paletteKey];
    const draw = () => renderChart(el, chart, pal);
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [chart, paletteKey]);
  return <div className="slide-chart" ref={ref} />;
}

function Slide({ chart, paletteKey }) {
  return (
    <div className="slide">
      <div className="slide-rule" style={{ background: PALETTES[paletteKey].primary }} />
      <div className="slide-copy">
        <h3>{chart.title}</h3>
        {chart.subtitle && <p>{chart.subtitle}</p>}
      </div>
      <ChartCanvas chart={chart} paletteKey={paletteKey} />
      <div className="slide-foot">
        <span>{chart.source || "Source: ChartForge analysis"}</span>
        <span>{CHART_TYPES.find((t) => t.id === chart.chartType)?.name}</span>
      </div>
    </div>
  );
}

function DataSheet({ chart, onChange }) {
  const table = useMemo(() => chartToTable(chart), [chart]);
  const [rows, setRows] = useState(() => table.rows.map((r) => [...r]));

  const setCell = (ri, ci, val) => {
    const next = rows.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? val : c)) : r));
    setRows(next);
    onChange({ ...chart, data: tableToChartData(chart, table.columns, next) });
  };

  return (
    <div className="sheet">
      <table>
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>
                  <input value={cell ?? ""} onChange={(e) => setCell(ri, ci, e.target.value)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gk") || "");
  const [keySet, setKeySet] = useState(() => !!localStorage.getItem("gk"));
  const [palette, setPalette] = useState("mckinsey");
  const [brief, setBrief] = useState("");
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [insights, setInsights] = useState(null);
  const [charts, setCharts] = useState([]);
  const [selected, setSelected] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState(["waterfall", "stacked_bar", "line_trend"]);
  const [autoMode, setAutoMode] = useState(true);
  const [customInstr, setCustomInstr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const stageRef = useRef(null);

  const saveKey = () => {
    localStorage.setItem("gk", apiKey.trim());
    setKeySet(true);
  };
  const clearKey = () => {
    localStorage.removeItem("gk");
    setApiKey("");
    setKeySet(false);
  };

  const toggleType = (id) =>
    setSelectedTypes((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const openDemo = (demo) => {
    setInsights(demo.insights);
    setCharts(demo.charts.map((c) => ({ ...c })));
    setSelected(0);
    setFile(null);
    setFileContent(null);
    setBrief("");
    setError("");
    setView("studio");
    const pal = demo.firm === "BCG" ? "bcg" : demo.firm === "Bain" ? "bain" : "mckinsey";
    setPalette(pal);
  };

  const handleFile = useCallback(async (f) => {
    setFile(f);
    setError("");
    setLoadMsg("Reading file…");
    setLoading(true);
    try {
      const content = await extractTextFromFile(f, apiKey);
      if (!content.text && !content.data?.length) throw new Error("Nothing extractable in that file.");
      setFileContent(content);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadMsg("");
    }
  }, [apiKey]);

  const generate = async () => {
    setError("");
    if (!brief.trim() && !fileContent) {
      setError("Drop a file or write a brief — the same way you’d brief a Think-Cell operator.");
      return;
    }
    if (!keySet || !apiKey.trim()) {
      setError("Add a Gemini API key to generate. Gallery charts work without one.");
      return;
    }
    setLoading(true);
    setView("studio");
    try {
      let ins = insights;
      let types = autoMode ? [] : selectedTypes;
      if (brief.trim() && !fileContent) {
        setLoadMsg("Designing the deck from your brief…");
        const out = await generateFromBrief(apiKey, brief, types, customInstr);
        ins = out.insights;
        setInsights(ins);
        setCharts(out.charts);
        setSelected(0);
        return;
      }
      setLoadMsg("Extracting the so-what…");
      ins = await extractInsights(apiKey, fileContent, brief);
      setInsights(ins);
      types = autoMode
        ? (ins.recommended_charts || []).map((c) => c.type).filter(Boolean).slice(0, 5)
        : selectedTypes;
      if (!types.length) types = ["waterfall", "horizontal_bar"];
      setLoadMsg("Building Think-Cell charts…");
      const configs = await generateChartData(apiKey, fileContent, ins, types, customInstr, brief);
      setCharts(configs);
      setSelected(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadMsg("");
    }
  };

  const reset = () => {
    setView("home");
    setCharts([]);
    setInsights(null);
    setFile(null);
    setFileContent(null);
    setBrief("");
    setError("");
    setSelected(0);
  };

  const updateChart = (next) => {
    setCharts((cs) => cs.map((c, i) => (i === selected ? next : c)));
  };

  const exportDeck = async () => {
    const nodes = stageRef.current?.querySelectorAll(".slide");
    if (!nodes?.length) return;
    const slides = [];
    for (let i = 0; i < nodes.length; i++) {
      const svg = nodes[i].querySelector("svg");
      const png = svg ? await svgToPngDataUrl(svg) : null;
      slides.push({ chart: charts[i], png });
    }
    await exportPptx(slides, PALETTES[palette].name);
  };

  const exportOnePng = async () => {
    const svg = stageRef.current?.querySelectorAll(".slide")[selected]?.querySelector("svg");
    if (!svg) return;
    const png = await svgToPngDataUrl(svg, charts[selected].title);
    downloadDataUrl(png, `${slug(charts[selected].title)}.png`);
  };

  const exportOneSvg = () => {
    const svg = stageRef.current?.querySelectorAll(".slide")[selected]?.querySelector("svg");
    if (svg) downloadSvg(svg, charts[selected].title);
  };

  const active = charts[selected];

  return (
    <div className="app">
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=Source+Serif+4:wght@600;700&display=swap" rel="stylesheet" />
      <header className="topbar">
        <div className="brand">
          <div className="mark">C</div>
          <h1>ChartForge</h1>
          <span className="tag">Think-Cell AI</span>
        </div>
        <div className="top-actions">
          {keySet && <span className="mono">key ···{apiKey.slice(-4)}</span>}
          {keySet && (
            <button className="btn btn-sm btn-ghost" onClick={clearKey}>
              Change key
            </button>
          )}
          {view !== "home" && (
            <button className="btn btn-sm" onClick={reset}>
              New deck
            </button>
          )}
        </div>
      </header>

      {view === "home" && (
        <>
          <section className="hero">
            <h2>McKinsey-grade charts, filled by AI — the way Think-Cell would, if it designed the slide.</h2>
            <p>
              Brief it like an EM. Drop the Excel. ChartForge picks the chart, writes the action title, reconciles the
              bridge, and puts numbers on every bar.
            </p>
          </section>
          <div className="paths">
            <button className="path" onClick={() => setView("studio")}>
              <kbd>01 — Brief</kbd>
              <h3>Describe the slide</h3>
              <p>Paste the so-what and the numbers. AI builds a waterfall, Mekko, Gantt, or CAGR line to partner standard.</p>
            </button>
            <button
              className="path"
              onClick={() => {
                setView("studio");
                setTimeout(() => fileRef.current?.click(), 50);
              }}
            >
              <kbd>02 — Data</kbd>
              <h3>Upload Excel, CSV, or PDF</h3>
              <p>Extract tables and exhibits, then auto-select Think-Cell chart types from the evidence.</p>
            </button>
            <button className="path" onClick={() => openDemo(DEMOS[0])}>
              <kbd>03 — Gallery</kbd>
              <h3>Open a finished exhibit</h3>
              <p>EBIT bridges, Mekkos, dual-axis combos — edit the data sheet and the slide updates live.</p>
            </button>
          </div>
          <section className="gallery">
            <h3>Signature exhibits</h3>
            <div className="gallery-grid">
              {DEMOS.map((d) => (
                <button key={d.id} className="demo-card" onClick={() => openDemo(d)}>
                  <div className="firm">{d.firm}</div>
                  <h4>{d.name}</h4>
                  <p>{d.blurb}</p>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {view === "studio" && (
        <div className="studio">
          <aside className="rail">
            {!keySet && (
              <>
                <h4>Gemini API key</h4>
                <div className="key-row">
                  <input
                    className="field"
                    type="password"
                    placeholder="AIza…"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && apiKey.trim() && saveKey()}
                  />
                  <button className="btn btn-primary" onClick={saveKey} disabled={!apiKey.trim()}>
                    Save
                  </button>
                </div>
                <p className="muted" style={{ marginTop: 8 }}>
                  Gallery works without a key. Generation needs{" "}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                    Gemini
                  </a>
                  .
                </p>
              </>
            )}

            <h4>Brief</h4>
            <textarea
              className="field"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="E.g. Build an EBIT bridge FY23–FY24: start 370, volume +14, price +31, mix +17, COGS −28, OpEx +8, end 412. $M. Action title on price/mix."
            />

            <h4>Data file</h4>
            <div
              className={`drop ${dragOver ? "over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.xlsx,.xls,.pdf,.txt,.md"
                hidden
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
              {file ? file.name : "Drop Excel, CSV, or PDF"}
            </div>

            <h4>Palette</h4>
            <div className="palettes">
              {Object.entries(PALETTES).map(([key, p]) => (
                <button key={key} className={`pal ${palette === key ? "on" : ""}`} onClick={() => setPalette(key)}>
                  <span className="swatch">
                    {p.series.slice(0, 5).map((c) => (
                      <i key={c} style={{ background: c }} />
                    ))}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>

            <h4>Chart types</h4>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button className={`chip ${autoMode ? "on" : ""}`} onClick={() => setAutoMode(true)}>
                Auto
              </button>
              <button className={`chip ${!autoMode ? "on" : ""}`} onClick={() => setAutoMode(false)}>
                Manual
              </button>
            </div>
            {!autoMode && (
              <div className="chips">
                {CHART_TYPES.map((t) => (
                  <button
                    key={t.id}
                    className={`chip ${selectedTypes.includes(t.id) ? "on" : ""}`}
                    title={t.desc}
                    onClick={() => toggleType(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            <h4>Direction (optional)</h4>
            <input
              className="field"
              value={customInstr}
              onChange={(e) => setCustomInstr(e.target.value)}
              placeholder="Force a Mekko; highlight top 5…"
            />

            <button className="btn btn-primary" style={{ width: "100%", marginTop: 16, justifyContent: "center" }} onClick={generate} disabled={loading}>
              {loading ? (
                <>
                  <span className="spin" /> {loadMsg || "Working…"}
                </>
              ) : (
                "Generate charts"
              )}
            </button>
            {error && <div className="error">{error}</div>}
          </aside>

          <main className="stage" ref={stageRef}>
            {!charts.length && !loading && (
              <div className="stage-head">
                <div>
                  <h2>Empty board</h2>
                  <p>Write a brief, drop data, or open a signature exhibit from the home gallery.</p>
                </div>
              </div>
            )}

            {insights && (
              <div className="stage-head">
                <div>
                  <h2>{insights.title}</h2>
                  <p>{insights.executive_summary}</p>
                </div>
                {charts.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button className="btn btn-sm" onClick={exportOnePng}>
                      PNG
                    </button>
                    <button className="btn btn-sm" onClick={exportOneSvg}>
                      SVG
                    </button>
                    <button className="btn btn-sm" onClick={() => exportExcel(charts, fileContent?.data)}>
                      Excel
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={exportDeck}>
                      PowerPoint
                    </button>
                  </div>
                )}
              </div>
            )}

            {insights?.key_metrics?.length > 0 && (
              <div className="metrics">
                {insights.key_metrics.map((m) => (
                  <div className="metric" key={m.name}>
                    <div className="k">{m.name}</div>
                    <div className="v">{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {insights?.insights?.length > 0 && (
              <div className="insights">
                {insights.insights.map((t, i) => (
                  <div className="insight" key={i}>
                    <strong>{i + 1}. </strong>
                    {t}
                  </div>
                ))}
              </div>
            )}

            {charts.map((chart, i) => (
              <div key={chart.id || i} onClick={() => setSelected(i)} style={{ outline: i === selected ? "2px solid #2251ff" : "none", borderRadius: 4, marginBottom: 8 }}>
                <Slide chart={chart} paletteKey={palette} />
              </div>
            ))}

            {active && (
              <>
                <h4 className="muted" style={{ letterSpacing: "0.08em", textTransform: "uppercase", margin: "8px 0" }}>
                  Data sheet — edit like Think-Cell; the slide redraws
                </h4>
                <DataSheet key={`${active.id}-${active.chartType}-${selected}`} chart={active} onChange={updateChart} />
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
