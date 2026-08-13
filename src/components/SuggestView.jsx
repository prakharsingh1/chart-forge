import { useEffect, useRef, useState } from "react";
import { chartMeta } from "../theme.js";
import { renderChart } from "../charts/render.js";
import ChartThumb from "./ChartThumb.jsx";

function MiniChart({ chart, pal }) {
  const ref = useRef(null);
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !chart) return;
    const draw = () => {
      const ok = renderChart(el, chart, pal);
      setEmpty(!ok);
      if (!ok) el.innerHTML = "";
    };
    const id = requestAnimationFrame(draw);
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [chart, pal]);
  return (
    <div className="suggest-mini-wrap">
      <div className="suggest-mini" ref={ref} />
      {empty && (
        <div className="suggest-mini-fallback">
          <ChartThumb type={chartMeta(chart.chartType)} />
        </div>
      )}
    </div>
  );
}

function slideLabel(s, i) {
  const t = (s.title || "").trim();
  if (t && t.toLowerCase() !== `slide ${i + 1}` && t.length > 3) return t;
  const sub = (s.subtitle || "").trim();
  if (sub.length > 3) return sub;
  const body = (s.body || "").split("\n").find((l) => l.trim().length > 8);
  return (body || t || `Slide ${i + 1}`).slice(0, 72);
}

export default function SuggestView({
  deck,
  pack,
  pal,
  loading,
  loadMsg,
  error,
  aiOn,
  onOpenStudio,
  onAddAll,
  onOpenChart,
  onPng,
  onPptxOne,
  onRetry,
  moreLoading,
  onLoadMore,
}) {
  const suggestions = pack?.suggestions || [];
  return (
    <div className="suggest">
      <section className="suggest-hero">
        <div className="eyebrow">Step 2 of 3</div>
        <h2>
          {suggestions.length
            ? `Pick the charts to keep (${suggestions.length})`
            : loading
              ? "Reading your deck…"
              : "Charts from this PowerPoint"}
        </h2>
        <p>
          Click a card to open it in the editor, or send the whole set. You can still change types and numbers on the next screen.
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary" onClick={onAddAll} disabled={!suggestions.length}>
            Continue to editor
          </button>
          <button className="btn btn-ghost" onClick={onOpenStudio}>
            Skip — original slides
          </button>
          {aiOn && (
            <button className="btn btn-ghost" onClick={onRetry} disabled={loading}>
              Re-run AI
            </button>
          )}
        </div>
      </section>

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
            <article key={s.id} className="suggest-card" onClick={() => onOpenChart(s)}>
              <div className="suggest-card-viz">
                {s.data ? <MiniChart chart={s} pal={pal} /> : <ChartThumb type={meta} />}
                <span className="suggest-open-hint">Open in editor</span>
              </div>
              <div className="suggest-card-body">
                <div className="suggest-badges">
                  <span className={`origin ${s.origin}`}>{s.origin === "web" ? "Industry" : "From pack"}</span>
                  <span className="cat">{meta.name}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.subtitle || s.why}</p>
                <div className="suggest-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-sm btn-ghost" onClick={() => onPptxOne(s)}>
                    PPTX
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => onPng(s)}>
                    PNG
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {aiOn && (
        <div className="suggest-more">
          <button className="btn" onClick={onLoadMore} disabled={moreLoading || loading}>
            {moreLoading ? (
              <>
                <span className="spin" /> Designing more…
              </>
            ) : (
              "Load more charts"
            )}
          </button>
        </div>
      )}

      {!!deck?.slides?.length && (
        <details className="suggest-slides">
          <summary>
            Read {deck.slides.length} slide{deck.slides.length === 1 ? "" : "s"} from the file
          </summary>
          <div className="suggest-slide-row">
            {deck.slides.slice(0, 18).map((s, i) => (
              <button key={s.id} className="slide-chip" onClick={onOpenStudio}>
                <span>{i + 1}</span>
                <em>{slideLabel(s, i)}</em>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
