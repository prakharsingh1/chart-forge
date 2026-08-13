import { CHART_TYPES } from "../theme.js";
import ChartThumb from "./ChartThumb.jsx";

const USE_CASES = [
  {
    tag: "Strategy consulting",
    title: "Monday morning partner pack",
    body: "A client sends last week’s PPTX. ChartForge reads the EBIT walk, mix, and share slides, then returns Think-Cell-grade exhibits already filled — ready to paste before the 10am readout.",
  },
  {
    tag: "Corporate strategy / PE",
    title: "IC memo in one sitting",
    body: "Drop the CIM or board deck. Get a market-growth bar, a share Mekko, and a value bridge that match the document’s colors and type. Associates stop rebuilding charts in Excel.",
  },
  {
    tag: "Industry research",
    title: "EV, healthcare, SaaS — with web context",
    body: "If the file is about electric vehicles, we suggest TAM/CAGR and competitive share from public sources, labeled separately from your confidential figures. Same for any vertical.",
  },
  {
    tag: "IR & board",
    title: "Same fonts as the rest of the book",
    body: "Theme colors and typefaces come from the PPTX, so a new exhibit does not look like a clip-art insert. Export native PowerPoint objects or a PNG.",
  },
];

const STEPS = [
  { n: "01", t: "Drop the PPTX", d: "We parse every slide, table fragment, color scheme, and font." },
  { n: "02", t: "AI designs the exhibit", d: "Action titles, units, reconciled waterfalls. Industry charts use live web data." },
  { n: "03", t: "Paste or download", d: "Native Office charts (Edit Data in PowerPoint) or a clean PNG. Values stay editable in studio." },
];

const COMPARE = [
  ["How you start", "Blank chart + type the sheet", "Pretty template + type the sheet", "Drop the existing PPTX"],
  ["Data entry", "Required", "Required", "Eliminated on first draft"],
  ["Look", "McKinsey/BCG native", "Publishing / web", "Matches YOUR deck’s fonts & colors"],
  ["Output", "PowerPoint objects", "Image / web", "Native PPTX + PNG"],
  ["Industry context", "You research it", "You research it", "Suggested from the web, labeled"],
];

const PLANS = [
  {
    name: "Studio",
    price: "$0",
    cadence: "to start",
    points: ["3 decks / month", "All 56 chart types", "PPTX in · PNG / PPTX out", "Deck theme matching"],
    cta: "Create account",
    featured: false,
  },
  {
    name: "Team",
    price: "$49",
    cadence: "per user / month",
    points: ["Unlimited decks", "Cloud save (Supabase)", "Industry + web exhibits", "Shared firm palettes", "Priority chart library"],
    cta: "Start Team",
    featured: true,
  },
  {
    name: "Firm",
    price: "Custom",
    cadence: "SSO · admin · SLA",
    points: ["SAML / SSO", "Private model keys", "Usage analytics", "On-prem Gemini option", "Procurement-ready MSA"],
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
  return (
    <div className="mkt">
      <section className="hero" id="product">
        <div className="eyebrow">The Think-Cell competitor that starts from the deck you already have</div>
        <h2>Stop typing data into charts.</h2>
        <p>
          Consultants, corp strat, and IR teams lose hours rebuilding exhibits. ChartForge reads the PowerPoint,
          keeps the fonts and colors, and returns partner-ready charts — prefilled, pasteable, not pictures.
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
          <strong>Drop a client or board deck</strong>
          <span>We extract numbers, theme, and story. You paste into PowerPoint or download PNG.</span>
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
          <span>McKinsey-style waterfalls</span>
          <span>BCG Mekkos</span>
          <span>Native PPTX objects</span>
          <span>Theme-matched type</span>
        </div>
      </section>

      <section className="mkt-band" id="solution">
        <div className="mkt-inner">
          <p className="mkt-kicker">The operating system</p>
          <h3>A framework, not a chart toy</h3>
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
                  <th>Flourish</th>
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
          <p className="mkt-kicker">Used for</p>
          <h3>Where the hours actually go</h3>
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
        <h3>Every type, with a distinct picture</h3>
        <p className="mkt-lead">56 consulting exhibits. Each thumbnail is the actual shape — clustered bars are not a copy of clustered columns.</p>
        <div className="lib-grid">
          {CHART_TYPES.slice(0, 12).map((t) => (
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
          <h3>Pay when the team stops rebuilding charts</h3>
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
          <p>Think-Cell depth. Zero data entry on the first draft.</p>
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
