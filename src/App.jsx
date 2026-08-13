import { useCallback, useEffect, useRef, useState } from "react";
import { PALETTES, CHART_TYPES, CHART_CATS, chartMeta } from "./theme.js";
import { extractTextFromFile } from "./lib/files.js";
import { extractInsights, generateChartData, generateFromBrief, fillDeckSlides, fillOneSlide, suggestFromDeck } from "./lib/ai.js";
import { renderChart } from "./charts/render.js";
import { DEMOS } from "./data/demos.js";
import { downloadDataUrl, downloadSvg, exportExcel, svgToPngDataUrl } from "./lib/export.js";
import { slug } from "./lib/format.js";
import { importPptx, deckToFileContent } from "./lib/pptxImport.js";
import { extractPptxTheme, deckCorpus, guessIndustry } from "./lib/pptxTheme.js";
import { exportNativeDeck } from "./lib/nativePptx.js";
import { deckFromCharts, emptySlide, uid, slideFromChart } from "./lib/deck.js";
import { blankChart } from "./lib/blanks.js";
import DataSheet from "./components/DataSheet.jsx";
import ChartThumb from "./components/ChartThumb.jsx";
import SuggestView from "./components/SuggestView.jsx";
import MarketingHome from "./components/MarketingHome.jsx";
import { useAuth } from "./auth/useAuth.js";
import AuthScreen from "./auth/AuthScreen.jsx";
import { deleteDeck, listDecks, loadDeck, saveDeck } from "./lib/db.js";

function ChartCanvas({ chart, pal }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !chart) return;
    const draw = () => renderChart(el, chart, pal);
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [chart, pal]);
  return <div className="slide-chart" ref={ref} />;
}

function SlideView({ slide, pal, onPatch }) {
  const font = pal.font || pal.fontFace;
  return (
    <div className="slide" style={{ fontFamily: font }}>
      <div className="slide-rule" style={{ background: pal.primary }} />
      <div className="slide-copy">
        <input
          className="slide-title-edit"
          value={slide.title}
          onChange={(e) => onPatch({ title: e.target.value, chart: slide.chart ? { ...slide.chart, title: e.target.value } : slide.chart })}
          placeholder="Action title — the so-what"
        />
        <input
          className="slide-sub-edit"
          value={slide.subtitle}
          onChange={(e) => onPatch({ subtitle: e.target.value, chart: slide.chart ? { ...slide.chart, subtitle: e.target.value } : slide.chart })}
          placeholder="Metric, unit, period, scope"
        />
      </div>
      {slide.chart ? (
        <ChartCanvas chart={{ ...slide.chart, title: slide.title, subtitle: slide.subtitle }} pal={pal} />
      ) : (
        <div className="slide-empty">No chart on this slide yet. Insert one or let AI fill from the slide text.</div>
      )}
      <div className="slide-foot">
        <input
          className="slide-src-edit"
          value={slide.source}
          onChange={(e) => onPatch({ source: e.target.value, chart: slide.chart ? { ...slide.chart, source: e.target.value } : slide.chart })}
          placeholder="Source:"
        />
        <span>{slide.chart ? chartMeta(slide.chart.chartType).name : "Text slide"}</span>
      </div>
    </div>
  );
}

export default function App() {
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [savedDecks, setSavedDecks] = useState([]);
  const [saveState, setSaveState] = useState("");
  const [view, setView] = useState("home");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gk") || "");
  const [keySet, setKeySet] = useState(() => !!localStorage.getItem("gk"));
  const [palette, setPalette] = useState("forge");
  const [deckPal, setDeckPal] = useState(null);
  const [suggestPack, setSuggestPack] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libQuery, setLibQuery] = useState("");
  const [libCat, setLibCat] = useState("All");
  const [brief, setBrief] = useState("");
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [deck, setDeck] = useState(null);
  const [selected, setSelected] = useState(0);
  const [customInstr, setCustomInstr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const pptxRef = useRef(null);
  const stageRef = useRef(null);

  const slides = deck?.slides || [];
  const active = slides[selected];
  const insights = deck?.insights;
  const palettes = deckPal ? { ...PALETTES, deck: deckPal } : PALETTES;
  const activePal = palettes[palette] || PALETTES.forge;

  const saveKey = () => {
    localStorage.setItem("gk", apiKey.trim());
    setKeySet(true);
  };
  const clearKey = () => {
    localStorage.removeItem("gk");
    setApiKey("");
    setKeySet(false);
  };

  const patchSlide = (partial) => {
    setDeck((d) => {
      if (!d) return d;
      const next = d.slides.map((s, i) => (i === selected ? { ...s, ...partial } : s));
      return { ...d, slides: next };
    });
  };

  const patchChart = (chart) => {
    patchSlide({
      chart,
      title: chart.title ?? active?.title,
      subtitle: chart.subtitle ?? active?.subtitle,
      source: chart.source ?? active?.source,
    });
  };

  const openDemo = (demo) => {
    const pal = demo.firm === "BCG" ? "bcg" : demo.firm === "Bain" ? "bain" : "mckinsey";
    setPalette(pal);
    setDeck(deckFromCharts(`${demo.name}.pptx`, demo.charts, demo.insights));
    setSelected(0);
    setFile(null);
    setFileContent(null);
    setBrief("");
    setError("");
    setView("studio");
  };

  const runSuggestions = async (imported, key) => {
    const corpus = deckCorpus(imported);
    const industryHint = guessIndustry(corpus);
    setLoadMsg(`Detecting ${industryHint} exhibits…`);
    try {
      const pack = await suggestFromDeck(key, { corpus, industryHint, fileName: imported.name });
      setSuggestPack(pack);
      if (pack.executive_summary) {
        setDeck((d) => (d ? { ...d, insights: { ...pack, title: imported.name } } : d));
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePptx = async (f) => {
    setLoadMsg("Opening PowerPoint…");
    setLoading(true);
    setError("");
    try {
      const imported = await importPptx(f);
      let theme = null;
      try {
        theme = await extractPptxTheme(f);
      } catch {
        theme = null;
      }
      if (theme?.palette) {
        setDeckPal(theme.palette);
        setPalette("deck");
      }
      setDeck(imported);
      setFile(f);
      setFileContent(deckToFileContent(imported));
      setSelected(0);
      setSuggestPack(null);
      setView("suggest");
      const key = apiKey.trim() || localStorage.getItem("gk") || "";
      if (key) {
        setLoadMsg("Prefilling charts from the deck + industry data…");
        await runSuggestions(imported, key);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadMsg("");
    }
  };

  const handleFile = useCallback(
    async (f) => {
      const ext = f.name.split(".").pop().toLowerCase();
      if (ext === "pptx" || ext === "pptm") {
        await handlePptx(f);
        return;
      }
      setFile(f);
      setError("");
      setLoadMsg("Reading file…");
      setLoading(true);
      try {
        const content = await extractTextFromFile(f, apiKey);
        if (!content.text && !content.data?.length) throw new Error("Nothing extractable in that file.");
        setFileContent(content);
        setView("studio");
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
        setLoadMsg("");
      }
    },
    [apiKey]
  );

  const generate = async () => {
    setError("");
    if (deck?.slides?.length && (brief.trim() || deck.slides.some((s) => (s.originalTexts || []).length))) {
      if (!keySet || !apiKey.trim()) {
        setError("Add a Gemini key to fill the deck. You can still insert blank charts and type values.");
        return;
      }
      setLoading(true);
      setLoadMsg("Designing native exhibits onto your slides…");
      try {
        const filled = await fillDeckSlides(apiKey, deck, brief, customInstr);
        setDeck((d) => {
          const slidesNext = d.slides.map((s, i) => {
            const hit = (filled.slides || []).find((x) => x.index === i);
            if (!hit || hit.skip) return s;
            const chart = {
              id: uid("chart"),
              chartType: hit.chartType,
              title: hit.title,
              subtitle: hit.subtitle,
              insight: hit.insight,
              source: hit.source,
              unit: hit.unit,
              data: hit.data,
            };
            return { ...s, title: hit.title || s.title, subtitle: hit.subtitle || s.subtitle, source: hit.source || s.source, insight: hit.insight, chart };
          });
          return { ...d, insights: filled.insights || d.insights, slides: slidesNext };
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
        setLoadMsg("");
      }
      return;
    }

    if (!brief.trim() && !fileContent) {
      setError("Upload a PPTX, drop data, or write a brief.");
      return;
    }
    if (!keySet || !apiKey.trim()) {
      setError("Add a Gemini API key to generate. Gallery and blank charts work without one.");
      return;
    }
    setLoading(true);
    setView("studio");
    try {
      let types = [];
      if (brief.trim() && !fileContent) {
        setLoadMsg("Designing the deck from your brief…");
        const out = await generateFromBrief(apiKey, brief, types, customInstr);
        setDeck(deckFromCharts("ChartForge deck.pptx", out.charts, out.insights));
        setSelected(0);
        return;
      }
      setLoadMsg("Extracting the so-what…");
      const ins = await extractInsights(apiKey, fileContent, brief);
      types = (ins.recommended_charts || []).map((c) => c.type).filter(Boolean).slice(0, 5);
      if (!types.length) types = ["waterfall", "grouped_bar"];
      setLoadMsg("Building editable desk charts…");
      const configs = await generateChartData(apiKey, fileContent, ins, types, customInstr, brief);
      setDeck(deckFromCharts(file?.name || "ChartForge deck.pptx", configs, ins));
      setSelected(0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadMsg("");
    }
  };

  const fillActive = async () => {
    if (!active) return;
    if (!keySet) {
      setError("Add a Gemini key to AI-fill this slide, or insert a blank chart and type the values.");
      return;
    }
    setLoading(true);
    setLoadMsg("Filling this slide…");
    try {
      const chart = await fillOneSlide(apiKey, active, brief || customInstr, "");
      patchSlide({
        chart,
        title: chart.title,
        subtitle: chart.subtitle,
        source: chart.source,
        insight: chart.insight,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadMsg("");
    }
  };

  const insertChart = (type) => {
    const chart = blankChart(type);
    if (!deck) {
      setDeck(deckFromCharts("ChartForge deck.pptx", [chart], null));
      setSelected(0);
      setView("studio");
      return;
    }
    if (!active) return;
    patchSlide({ chart, title: chart.title, subtitle: chart.subtitle, source: chart.source });
  };

  const addSlide = () => {
    setDeck((d) => {
      const base = d || { name: "ChartForge deck.pptx", slides: [], insights: null };
      return { ...base, slides: [...base.slides, emptySlide(`Slide ${base.slides.length + 1}`)] };
    });
    setSelected(slides.length);
    setView("studio");
  };

  const reset = () => {
    setView("home");
    setDeck(null);
    setFile(null);
    setFileContent(null);
    setBrief("");
    setError("");
    setSelected(0);
    setSuggestPack(null);
  };

  const exportPpt = async () => {
    if (!deck?.slides?.length) return;
    await exportNativeDeck({ ...deck, name: deck.name || "ChartForge" }, palette, palette === "deck" ? deckPal : null);
  };

  const exportOnePng = async () => {
    const svg = stageRef.current?.querySelector(".slide svg");
    if (!svg || !active?.chart) return;
    const png = await svgToPngDataUrl(svg, active.title);
    downloadDataUrl(png, `${slug(active.title)}.png`);
  };

  const exportOneSvg = () => {
    const svg = stageRef.current?.querySelector(".slide svg");
    if (svg) downloadSvg(svg, active?.title);
  };

  const openSuggestion = (s) => {
    const slide = slideFromChart(s);
    setDeck((d) => {
      const base = d || { name: file?.name || "ChartForge deck.pptx", slides: [], insights: suggestPack };
      const exists = (base.slides || []).findIndex((x) => x.chart?.id === s.id);
      if (exists >= 0) {
        setSelected(exists);
        return base;
      }
      setSelected(base.slides.length);
      return { ...base, insights: suggestPack || base.insights, slides: [...base.slides, slide] };
    });
    setView("studio");
  };

  const addAllSuggestions = () => {
    const charts = (suggestPack?.suggestions || []).filter((s) => s.data);
    if (!charts.length) {
      setView("studio");
      return;
    }
    setDeck((d) => ({
      ...(d || { name: file?.name || "ChartForge.pptx", slides: [] }),
      insights: suggestPack,
      slides: charts.map((c) => slideFromChart(c)),
    }));
    setSelected(0);
    setView("studio");
  };

  const exportSuggestionPptx = async (s) => {
    await exportNativeDeck({ name: s.title, slides: [slideFromChart(s)] }, palette, palette === "deck" ? deckPal : null);
  };

  const exportSuggestionPng = async (s) => {
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-9999px;width:960px;height:540px;background:#fff";
    document.body.appendChild(host);
    try {
      renderChart(host, s, activePal);
      const svg = host.querySelector("svg");
      if (!svg) return;
      const png = await svgToPngDataUrl(svg, s.title);
      downloadDataUrl(png, `${slug(s.title)}.png`);
    } finally {
      host.remove();
    }
  };

  const pickType = (type) => {
    insertChart(type);
    setLibraryOpen(false);
  };

  const visibleTypes = CHART_TYPES.filter((t) => {
    const q = libQuery.trim().toLowerCase();
    const hit = !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q);
    return hit && (libCat === "All" || t.cat === libCat);
  });

  const charts = slides.map((s) => s.chart).filter(Boolean);

  const refreshDecks = useCallback(async () => {
    if (!user) {
      setSavedDecks([]);
      return;
    }
    try {
      setSavedDecks(await listDecks());
    } catch (e) {
      console.warn(e);
    }
  }, [user]);

  useEffect(() => {
    refreshDecks();
  }, [user, refreshDecks]);

  useEffect(() => {
    if (!user || !deck?.slides) return;
    const t = setTimeout(async () => {
      try {
        setSaveState("Saving…");
        const id = await saveDeck({
          remoteId: deck.remoteId,
          name: deck.name,
          insights: deck.insights,
          slides: deck.slides,
          palette,
        });
        if (id && id !== deck.remoteId) setDeck((d) => (d ? { ...d, remoteId: id } : d));
        setSaveState("Saved");
        refreshDecks();
      } catch (e) {
        const msg = e.message || "Save failed";
        setSaveState(
          /PGRST205|schema cache|does not exist/i.test(msg)
            ? "Run supabase/schema.sql in the Supabase SQL editor"
            : msg
        );
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [user, deck, palette, refreshDecks]);

  const openRemote = async (id) => {
    try {
      const loaded = await loadDeck(id);
      setDeck(loaded);
      if (loaded.palette) setPalette(loaded.palette);
      setSelected(0);
      setView("studio");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="app">
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <header className="topbar">
        <div className="brand" onClick={reset}>
          <div className="mark">C</div>
          <h1>ChartForge</h1>
          <span className="tag">{CHART_TYPES.length} charts</span>
        </div>
        <div className="top-actions">
          {view === "home" && (
            <>
              <button className="btn btn-sm btn-ghost" onClick={() => document.getElementById("solution")?.scrollIntoView({ behavior: "smooth" })}>
                Product
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => document.getElementById("use-cases")?.scrollIntoView({ behavior: "smooth" })}>
                Use cases
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
                Pricing
              </button>
            </>
          )}
          <button className="btn btn-sm btn-primary" onClick={() => setLibraryOpen(true)}>
            Chart library
          </button>
          <input ref={pptxRef} type="file" accept=".pptx,.pptm" hidden onChange={(e) => e.target.files[0] && handlePptx(e.target.files[0])} />
          <button className="btn btn-sm" onClick={() => pptxRef.current?.click()}>
            Drop PPTX
          </button>
          {deck && (
            <button className="btn btn-sm btn-primary" onClick={exportPpt} disabled={loading}>
              Download PPTX (native)
            </button>
          )}
          {user ? (
            <>
              <span className="mono">{user.email}</span>
              {saveState && <span className="mono">{saveState}</span>}
              <button className="btn btn-sm btn-ghost" onClick={() => signOut()}>
                Log out
              </button>
            </>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={() => setView("login")}>
              Log in
            </button>
          )}
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
        <MarketingHome
          dragOver={dragOver}
          setDragOver={setDragOver}
          onDropFile={(f) => handleFile(f)}
          onUpload={() => pptxRef.current?.click()}
          onLogin={() => setView("login")}
          onStudio={() => (user ? setView("studio") : setView("login"))}
          onLibrary={() => setLibraryOpen(true)}
          onDemo={openDemo}
          demos={DEMOS}
          onPlan={(name) => {
            if (name === "Firm") window.location.href = "mailto:snghprakhar@gmail.com?subject=ChartForge%20Firm";
            else setView("login");
          }}
        />
      )}

      {view === "login" && (
        <AuthScreen
          variant="page"
          onClose={() => setView("home")}
          onSuccess={() => setView("home")}
        />
      )}

      {view === "suggest" && (
        <SuggestView
          deck={deck}
          pack={suggestPack}
          pal={activePal}
          loading={loading}
          loadMsg={loadMsg}
          error={error}
          keySet={keySet}
          apiKey={apiKey}
          setApiKey={setApiKey}
          onSaveKey={() => {
            saveKey();
            if (deck) {
              setLoading(true);
              runSuggestions(deck, apiKey.trim()).finally(() => {
                setLoading(false);
                setLoadMsg("");
              });
            }
          }}
          onOpenStudio={() => setView("studio")}
          onAddAll={addAllSuggestions}
          onOpenChart={openSuggestion}
          onPng={exportSuggestionPng}
          onPptxOne={exportSuggestionPptx}
          onRetry={async () => {
            if (!deck) return;
            setLoading(true);
            setError("");
            try {
              await runSuggestions(deck, apiKey.trim() || localStorage.getItem("gk"));
            } catch (e) {
              setError(e.message);
            } finally {
              setLoading(false);
              setLoadMsg("");
            }
          }}
        />
      )}

      {view === "studio" && (
        <div className={`studio ${deck ? "deck-mode" : ""}`}>
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
                  Blank charts and the gallery work offline. AI fill needs{" "}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                    Gemini
                  </a>
                  .
                </p>
              </>
            )}

            <h4>Cloud decks</h4>
            {!user && (
              <p className="muted">
                <button className="linkish" type="button" onClick={() => setAuthOpen(true)}>
                  Log in
                </button>{" "}
                to save decks to Supabase.
              </p>
            )}
            {user && (
              <div className="filmstrip">
                {savedDecks.map((d) => (
                  <button key={d.id} className={`thumb ${deck?.remoteId === d.id ? "on" : ""}`} onClick={() => openRemote(d.id)}>
                    <span>•</span>
                    <em>{d.name}</em>
                    <small>{new Date(d.updated_at).toLocaleDateString()}</small>
                  </button>
                ))}
                {!savedDecks.length && <p className="muted">No saved decks yet — they appear after you edit.</p>}
              </div>
            )}
            {user && deck?.remoteId && (
              <button
                className="btn btn-sm btn-ghost"
                style={{ marginTop: 8 }}
                onClick={async () => {
                  await deleteDeck(deck.remoteId);
                  setDeck(null);
                  refreshDecks();
                }}
              >
                Delete cloud copy
              </button>
            )}

            <h4>This session</h4>
            <p className="muted">{deck?.name || "Untitled"} · {slides.length} slides</p>
            <div className="filmstrip">
              {slides.map((s, i) => (
                <button key={s.id} className={`thumb ${i === selected ? "on" : ""}`} onClick={() => setSelected(i)}>
                  <span>{i + 1}</span>
                  <em>{s.title || "Untitled"}</em>
                  <small>{s.chart ? s.chart.chartType.replace(/_/g, " ") : "no chart"}</small>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button className="btn btn-sm" onClick={addSlide}>
                + Slide
              </button>
              <button className="btn btn-sm" onClick={() => pptxRef.current?.click()}>
                Open PPTX
              </button>
            </div>

            <h4>Brief / direction</h4>
            <textarea
              className="field"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Brief the desk: NAV fan P10/P50/P90, underwater from 2019, Brinson by sector…"
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
                accept=".pptx,.pptm,.csv,.tsv,.xlsx,.xls,.pdf,.txt,.md"
                hidden
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
              {file ? file.name : "Drop PPTX, Excel, CSV, or PDF"}
            </div>

            <h4>Firm palette</h4>
            <div className="palettes">
              {Object.entries(palettes).map(([key, p]) => (
                <button key={key} className={`pal ${palette === key ? "on" : ""}`} onClick={() => setPalette(key)}>
                  <span className="swatch">
                    {p.series.slice(0, 5).map((c) => (
                      <i key={c + key} style={{ background: c }} />
                    ))}
                  </span>
                  {p.name}
                </button>
              ))}
            </div>

            <h4>Direction</h4>
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
              ) : deck?.slides?.length ? (
                "AI-fill this deck"
              ) : (
                "Generate charts"
              )}
            </button>
            {error && <div className="error">{error}</div>}
          </aside>

          <main className="stage" ref={stageRef}>
            {!slides.length && !loading && (
              <div className="stage-head">
                <div>
                  <h2>Blank canvas</h2>
                  <p>Open the library for fans, Brinson, and matrices — or drop an IC pack. Values stay editable.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setLibraryOpen(true)}>Chart library</button>
              </div>
            )}

            {insights && (
              <div className="stage-head">
                <div>
                  <h2>{insights.title}</h2>
                  <p>{insights.executive_summary}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="btn btn-sm" onClick={exportOnePng}>
                    PNG snapshot
                  </button>
                  <button className="btn btn-sm" onClick={exportOneSvg}>
                    SVG
                  </button>
                  <button className="btn btn-sm" onClick={() => exportExcel(charts, fileContent?.data)}>
                    Excel
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={exportPpt}>
                    PPTX · native objects
                  </button>
                </div>
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

            {active && <SlideView slide={active} pal={activePal} onPatch={patchSlide} />}
          </main>

          <aside className="inspector">
            <h4>This slide</h4>
            {!active && <p className="muted">Select or add a slide.</p>}
            {active && (
              <>
                <div className="chips" style={{ marginBottom: 10 }}>
                  <button className="btn btn-sm" onClick={exportOnePng}>PNG</button>
                  <button className="btn btn-sm" onClick={async () => active.chart && exportSuggestionPptx(active.chart)}>
                    This slide · PPTX
                  </button>
                </div>
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setLibraryOpen(true)}>
                  {CHART_TYPES.length} chart types
                </button>
                <label className="muted" style={{ marginTop: 12 }}>Or jump to</label>
                <select
                  className="field"
                  value={active.chart?.chartType || ""}
                  onChange={(e) => {
                    const t = e.target.value;
                    if (!t) return;
                    insertChart(t);
                  }}
                >
                  <option value="">Choose a chart…</option>
                  {CHART_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.cat} · {t.name}
                    </option>
                  ))}
                </select>
                <div className="chips" style={{ marginTop: 8 }}>
                  {["waterfall", "sankey", "treemap", "marimekko", "heatmap", "combo", "gantt"].map((id) => (
                    <button key={id} className="chip" onClick={() => insertChart(id)}>
                      {chartMeta(id).name}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button className="btn btn-sm" onClick={fillActive} disabled={loading}>
                    AI fill this slide
                  </button>
                </div>
                {active.chart && (
                  <>
                    <h4>Unit</h4>
                    <input
                      className="field"
                      value={active.chart.unit || ""}
                      onChange={(e) => patchChart({ ...active.chart, unit: e.target.value })}
                      placeholder="$M, %, pp"
                    />
                    <h4>Values — live data sheet</h4>
                    <DataSheet
                      key={`${active.id}-${active.chart.id}-${active.chart.chartType}`}
                      chart={active.chart}
                      onChange={patchChart}
                    />
                  </>
                )}
                {!!(active.originalTexts || []).length && (
                  <>
                    <h4>Original slide text</h4>
                    <pre className="orig">{active.originalTexts.join("\n")}</pre>
                  </>
                )}
              </>
            )}
          </aside>
        </div>
      )}

      {authOpen && <AuthScreen onClose={() => setAuthOpen(false)} />}
      {libraryOpen && (
        <div className="modal-bg" onClick={() => setLibraryOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{CHART_TYPES.length} charts for B2B stories</h3>
              <button className="btn btn-sm" onClick={() => setLibraryOpen(false)}>Close</button>
            </div>
            <input className="field" value={libQuery} onChange={(e) => setLibQuery(e.target.value)} placeholder="Search Sankey, waterfall, cohort…" />
            <div className="chips" style={{ margin: "12px 0" }}>
              <button className={`chip ${libCat === "All" ? "on" : ""}`} onClick={() => setLibCat("All")}>All</button>
              {CHART_CATS.map((c) => (
                <button key={c} className={`chip ${libCat === c ? "on" : ""}`} onClick={() => setLibCat(c)}>{c}</button>
              ))}
            </div>
            <div className="lib-grid">
              {visibleTypes.map((t) => (
                <button key={t.id} className="type-card" onClick={() => { setView("studio"); pickType(t.id); }}>
                  <ChartThumb type={t} />
                  <div className="cat">{t.cat}</div>
                  <h4>{t.name}</h4>
                  <p>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
