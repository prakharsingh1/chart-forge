import { CHART_TYPES } from "../theme.js";
import ChartThumb from "./ChartThumb.jsx";

const FEATURED_IDS = [
  "fan_chart",
  "vol_surface",
  "order_book",
  "qq_plot",
  "parallel_coords",
  "brinson",
  "corr_matrix",
  "horizon",
  "icicle",
  "pnl_calendar",
  "candles_volume",
  "waterfall",
];

const USE_CASES = [
  {
    tag: "Hedge funds",
    title: "IC memo that used to take two analysts a week",
    body: "Drop last month’s risk pack. Get a P10–P90 NAV fan, an underwater drawdown, and a Brinson split already filled from the file — the charts PMs sketch on whiteboards and then lose a day building in Excel.",
  },
  {
    tag: "Quant / research",
    title: "Distributions, correlations, factor CIs — not bar charts",
    body: "Ridgelines of sleeve returns, labeled correlation matrices, forest plots with intervals. The stuff a research scientist can describe and nobody on the desk can draw cleanly before the meeting.",
  },
  {
    tag: "Risk & exposure",
    title: "Gross, net, beta, and the book that actually lost money",
    body: "Long/short contribution, stacked exposure, rolling Sharpe. Theme colors come from the existing PPTX so the risk committee deck does not look like a different firm.",
  },
  {
    tag: "Markets / rates / credit",
    title: "Curves, candles, and forecasts that stay editable",
    body: "Yield curves across dates, OHLC, VaR fans. Export native PowerPoint objects — values stay live, not a screenshot from Python.",
  },
];

const STEPS = [
  { n: "01", t: "Drop the pack", d: "IC memo, risk committee, or research PPTX. We read numbers, fonts, and colors." },
  { n: "02", t: "We draw the hard exhibit", d: "Fan charts, attribution, matrices, ridgelines — designed, filled, labeled. Not a template you retype." },
  { n: "03", t: "Paste into the book", d: "Native Office charts or PNG. Edit the sheet in studio the way you would in a real desk tool." },
];

const COMPARE = [
  ["How you start", "Blank chart, type the sheet", "Python notebook + screenshot", "Drop the pack you already have"],
  ["Hard charts", "Waterfalls, Mekkos", "You code it", "Fans, Brinson, corr, ridgelines, OHLC"],
  ["Who it’s for", "Consultants", "Quants who can plot", "Funds, PMs, risk, scientists"],
  ["Time to first exhibit", "Hours of data entry", "Hours of matplotlib", "Minutes, prefilled"],
  ["Output", "PowerPoint objects", "PNG / HTML", "Native PPTX + PNG, theme-matched"],
];

const PLANS = [
  {
    name: "Desk",
    price: "$0",
    cadence: "to start",
    points: [`${CHART_TYPES.length} chart types`, "PPTX in · PNG / PPTX out", "Fan, Brinson, corr, OHLC", "Deck theme matching"],
    cta: "Create account",
    featured: false,
  },
  {
    name: "Fund",
    price: "$79",
    cadence: "per user / month",
    points: ["Unlimited packs", "Cloud save", "Web-grounded market context", "Shared desk palettes", "Priority quant library"],
    cta: "Start Fund",
    featured: true,
  },
  {
    name: "Platform",
    price: "Custom",
    cadence: "SSO · admin · SLA",
    points: ["SAML / SSO", "Private model keys", "Usage analytics", "Air-gapped option", "Procurement-ready MSA"],
    cta: "Talk to us",
    featured: false,
  },
];

export default function MarketingHome({
  onUpload,
  onLogin,
  onStudio,
  onLibrary,
  onDemo,
  onPlan,
  dragOver,
  setDragOver,
  onDropFile,
  demos,
}) {
  const featured = FEATURED_IDS.map((id) => CHART_TYPES.find((t) => t.id === id)).filter(Boolean);

  return (
    <div className="mkt">
      <section className="hero" id="product">
        <div className="eyebrow">Complex market charts for hedge funds, PMs, and research scientists</div>
        <h2>The exhibits nobody on the desk can finish by Monday.</h2>
        <p>
          Fan forecasts, underwater drawdowns, Brinson attribution, correlation matrices, yield curves, ridgeline
          return distributions. ChartForge reads the pack you already have and draws the hard visualization — editable,
          not a picture, in your fonts and colors.
        </p>
        <div
          className={`hero-drop ${dragOver ? "over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) onDropFile(f);
          }}
          onClick={onUpload}
        >
          <div className="hero-drop-mark">PPTX</div>
          <strong>Drop an IC, risk, or research deck</strong>
          <span>We extract the series, theme, and story. You paste a chart a scientist would recognize.</span>
        </div>
        <div className="hero-cta">
          <button className="btn btn-primary" onClick={onUpload}>
            Upload PowerPoint
          </button>
          <button className="btn" onClick={onLogin}>
            Log in to workspace
          </button>
          <button className="btn btn-ghost" onClick={onLibrary}>
            See {CHART_TYPES.length} chart types
          </button>
        </div>
        <div className="trust-row">
          <span>P10–P90 fans</span>
          <span>Brinson & long/short</span>
          <span>Corr / factor matrices</span>
          <span>Native PPTX objects</span>
        </div>
      </section>

      <section className="mkt-band" id="solution">
        <div className="mkt-inner">
          <p className="mkt-kicker">Why this exists</p>
          <h3>Excel and Think-Cell stop at bars. Your book does not.</h3>
          <div className="framework">
            {STEPS.map((s) => (
              <article key={s.n} className="fw-card">
                <kbd>{s.n}</kbd>
                <h4>{s.t}</h4>
                <p>{s.d}</p>
              </article>
            ))}
          </div>
          <div className="compare-wrap">
            <table className="compare">
              <thead>
                <tr>
                  <th />
                  <th>Think-Cell</th>
                  <th>Python / Flourish</th>
                  <th className="on">ChartForge</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => (
                      <td key={i} className={i === 3 ? "on" : ""}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mkt-band alt" id="use-cases">
        <div className="mkt-inner">
          <p className="mkt-kicker">Desks we build for</p>
          <h3>If it takes a scientist a day to plot, we ship it as a chart type</h3>
          <div className="use-grid">
            {USE_CASES.map((u) => (
              <article key={u.title} className="use-card">
                <div className="cat">{u.tag}</div>
                <h4>{u.title}</h4>
                <p>{u.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lib-home" id="library">
        <h3>The hard library first</h3>
        <p className="mkt-lead">
          {CHART_TYPES.length} types. Fans, drawdowns, attribution, matrices, and curves sit in front — then the
          consulting bars you still need for the appendix.
        </p>
        <div className="lib-grid">
          {featured.map((t) => (
            <button key={t.id} className="type-card" onClick={onLibrary}>
              <ChartThumb type={t} />
              <div className="cat">{t.cat}</div>
              <h4>{t.name}</h4>
              <p>{t.desc}</p>
            </button>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="btn" onClick={onLibrary}>
            Open full library →
          </button>
        </div>
      </section>

      <section className="gallery">
        <h3>Open a finished example</h3>
        <div className="gallery-grid">
          {demos.map((d) => (
            <button key={d.id} className="demo-card" onClick={() => onDemo(d)}>
              <div className="firm">{d.firm}</div>
              <h4>{d.name}</h4>
              <p>{d.blurb}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mkt-band" id="pricing">
        <div className="mkt-inner">
          <p className="mkt-kicker">Pricing</p>
          <h3>Pay when the desk stops rebuilding plots by hand</h3>
          <div className="price-grid">
            {PLANS.map((p) => (
              <article key={p.name} className={`price-card ${p.featured ? "featured" : ""}`}>
                <h4>{p.name}</h4>
                <div className="price">
                  {p.price}
                  <small>{p.cadence}</small>
                </div>
                <ul>
                  {p.points.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <button className={`btn ${p.featured ? "btn-primary" : ""}`} onClick={() => onPlan(p.name)}>
                  {p.cta}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mkt-foot">
        <div>
          <strong>ChartForge</strong>
          <p>Hard market charts. Zero data entry on the first draft.</p>
        </div>
        <div className="mkt-foot-links">
          <button className="linkish" onClick={onStudio}>
            Studio
          </button>
          <button className="linkish" onClick={onLogin}>
            Log in
          </button>
          <a href="mailto:snghprakhar@gmail.com">Contact</a>
        </div>
      </footer>
    </div>
  );
}
