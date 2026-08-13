import { useRef } from "react";
import { chartMeta } from "../theme.js";
import { renderChart } from "../charts/render.js";
import { useEffect } from "react";
import ChartThumb from "./ChartThumb.jsx";

function MiniChart({ chart, pal }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !chart) return;
    const draw = () => {
      try {
        renderChart(el, chart, pal);
      } catch {
        el.innerHTML = "";
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [chart, pal]);
  return <div className="suggest-mini" ref={ref} />;
}

export default function SuggestView({
  deck,
  pack,
  pal,
  loading,
  loadMsg,
  error,
  keySet,
  onSaveKey,
  apiKey,
  setApiKey,
  onOpenStudio,
  onAddAll,
  onOpenChart,
  onPng,
  onPptxOne,
  onRetry,
}) {
  const suggestions = pack?.suggestions || [];
  return (
    <div className="suggest">
      <section className="suggest-hero">
        <div className="eyebrow">Ready to paste · fonts & colors from your deck</div>
        <h2>
          {pack?.industry ? `${pack.industry}. ` : ""}
          {suggestions.length ? `${suggestions.length} exhibits, prefilled.` : loading ? "Reading the deck…" : "Drop-in charts from this PowerPoint."}
        </h2>
        <p>
          {pack?.executive_summary ||
            pack?.industry_why ||
            "We pull numbers from your slides, match the theme, and add industry-depth exhibits so nobody has to type a data sheet."}
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary" onClick={onAddAll} disabled={!suggestions.length}>
            Open all in studio
          </button>
          <button className="btn" onClick={onOpenStudio}>
            Edit original slides
          </button>
          {keySet && (
            <button className="btn btn-ghost" onClick={onRetry} disabled={loading}>
              Re-run AI
            </button>
          )}
        </div>
        {pack?.key_metrics?.length > 0 && (
          <div className="metrics" style={{ justifyContent: "center" }}>
            {pack.key_metrics.map((m) => (
              <div className="metric" key={m.name}>
                <div className="k">{m.name}</div>
                <div className="v">{m.value}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {!keySet && (
        <div className="key-banner">
          <div>
            <strong>Add a Gemini key</strong>
            <p className="muted">Needed to prefill from the PPTX and pull industry stats from the web. Gallery still works offline.</p>
          </div>
          <div className="key-row">
            <input className="field" type="password" placeholder="AIza…" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            <button className="btn btn-primary" onClick={onSaveKey} disabled={!apiKey.trim()}>
              Save
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="suggest-load">
          <span className="spin" /> {loadMsg || "Designing exhibits…"}
        </div>
      )}
      {error && <div className="error" style={{ maxWidth: 960, margin: "0 auto 20px" }}>{error}</div>}

      <div className="suggest-grid">
        {suggestions.map((s) => {
          const meta = chartMeta(s.chartType);
          return (
            <article key={s.id} className="suggest-card">
              <div className="suggest-card-viz">
                {s.data ? <MiniChart chart={s} pal={pal} /> : <ChartThumb type={meta} />}
              </div>
              <div className="suggest-card-body">
                <div className="suggest-badges">
                  <span className={`origin ${s.origin}`}>{s.origin === "web" ? "Industry · web" : "From your PPTX"}</span>
                  <span className="cat">{meta.name}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.subtitle || s.why}</p>
                <div className="suggest-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => onOpenChart(s)}>
                    Open
                  </button>
                  <button className="btn btn-sm" onClick={() => onPptxOne(s)}>
                    PPTX
                  </button>
                  <button className="btn btn-sm" onClick={() => onPng(s)}>
                    PNG
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!!deck?.slides?.length && (
        <section className="suggest-slides">
          <h3>Slides we read</h3>
          <div className="suggest-slide-row">
            {deck.slides.slice(0, 12).map((s, i) => (
              <button key={s.id} className="slide-chip" onClick={onOpenStudio}>
                <span>{i + 1}</span>
                <em>{s.title}</em>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
