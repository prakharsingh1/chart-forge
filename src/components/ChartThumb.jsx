function Bars({ n = 5, h = [70, 48, 86, 40, 62], clustered }) {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      {h.slice(0, n).map((v, i) =>
        clustered ? (
          <g key={i}>
            <rect x={10 + i * 22} y={72 - v} width="7" height={v} rx="1.5" className="t-a" />
            <rect x={18 + i * 22} y={72 - v * 0.62} width="7" height={v * 0.62} rx="1.5" className="t-b" />
          </g>
        ) : (
          <rect key={i} x={12 + i * 21} y={72 - v} width="14" height={v} rx="2" className={i === 2 ? "t-a" : "t-b"} />
        )
      )}
    </svg>
  );
}

function Stack() {
  const cols = [
    [30, 22, 18],
    [24, 28, 16],
    [18, 20, 30],
    [22, 16, 26],
  ];
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      {cols.map((seg, i) => {
        let y = 68;
        return (
          <g key={i}>
            {seg.map((h, j) => {
              y -= h;
              return <rect key={j} x={16 + i * 24} y={y} width="16" height={h} className={`t-${["a", "b", "c"][j]}`} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

function HBars() {
  const w = [88, 70, 54, 36];
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      {w.map((v, i) => (
        <rect key={i} x="8" y={10 + i * 15} width={v} height="10" rx="2" className={i === 0 ? "t-a" : "t-b"} />
      ))}
    </svg>
  );
}

function Waterfall() {
  const bars = [
    { x: 8, y: 18, h: 48, c: "t-a" },
    { x: 30, y: 18, h: 16, c: "t-c" },
    { x: 52, y: 34, h: 14, c: "t-neg" },
    { x: 74, y: 20, h: 18, c: "t-c" },
    { x: 96, y: 20, h: 46, c: "t-a" },
  ];
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <path d="M22 18 H30 M44 34 H52 M66 48 H74 M92 20 H96" className="t-line" fill="none" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width="16" height={b.h} rx="1.5" className={b.c} />
      ))}
    </svg>
  );
}

function Line() {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <polyline points="8,52 32,40 56,44 80,22 112,16" className="t-stroke-a" fill="none" />
      <polyline points="8,60 32,54 56,50 80,42 112,38" className="t-stroke-b" fill="none" />
      {[8, 32, 56, 80, 112].map((x, i) => (
        <circle key={x} cx={x} cy={[52, 40, 44, 22, 16][i]} r="3" className="t-a" />
      ))}
    </svg>
  );
}

function Area() {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <path d="M8 64 L8 48 L40 36 L72 40 L112 22 L112 64 Z" className="t-a" opacity="0.35" />
      <path d="M8 64 L8 58 L40 50 L72 54 L112 44 L112 64 Z" className="t-b" opacity="0.55" />
    </svg>
  );
}

function Pie() {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <circle cx="60" cy="36" r="26" className="t-b" />
      <path d="M60 36 L60 10 A26 26 0 0 1 84 48 Z" className="t-a" />
      <path d="M60 36 L84 48 A26 26 0 0 1 38 54 Z" className="t-c" />
      <circle cx="60" cy="36" r="12" fill="#0c0c14" />
    </svg>
  );
}

function Mekko() {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <rect x="8" y="12" width="48" height="28" className="t-a" />
      <rect x="8" y="40" width="48" height="22" className="t-b" />
      <rect x="56" y="12" width="28" height="18" className="t-c" />
      <rect x="56" y="30" width="28" height="32" className="t-a" opacity="0.55" />
      <rect x="84" y="12" width="28" height="50" className="t-b" opacity="0.7" />
    </svg>
  );
}

function Scatter() {
  const pts = [
    [24, 48],
    [40, 28],
    [58, 36],
    [74, 18],
    [92, 30],
    [50, 52],
  ];
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <line x1="10" y1="62" x2="110" y2="62" className="t-line" />
      <line x1="10" y1="10" x2="10" y2="62" className="t-line" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 3 ? 8 : 5} className={i % 2 ? "t-a" : "t-b"} opacity="0.9" />
      ))}
    </svg>
  );
}

function Heat() {
  const cells = [0.2, 0.5, 0.9, 0.35, 0.7, 0.15, 0.8, 0.45, 0.6, 0.25, 0.95, 0.4];
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      {cells.map((o, i) => (
        <rect key={i} x={12 + (i % 4) * 24} y={8 + Math.floor(i / 4) * 20} width="22" height="18" rx="2" className="t-a" opacity={0.25 + o * 0.75} />
      ))}
    </svg>
  );
}

function Sankey() {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <rect x="6" y="10" width="10" height="22" className="t-a" />
      <rect x="6" y="40" width="10" height="22" className="t-b" />
      <rect x="104" y="8" width="10" height="18" className="t-c" />
      <rect x="104" y="30" width="10" height="16" className="t-a" />
      <rect x="104" y="50" width="10" height="14" className="t-b" />
      <path d="M16 21 C50 21, 70 17, 104 17" className="t-stroke-a" fill="none" strokeWidth="8" opacity="0.45" />
      <path d="M16 51 C50 51, 70 38, 104 38" className="t-stroke-b" fill="none" strokeWidth="7" opacity="0.45" />
    </svg>
  );
}

function Funnel() {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <path d="M16 10 H104 L92 26 H28 Z" className="t-a" />
      <path d="M30 30 H90 L80 46 H40 Z" className="t-b" />
      <path d="M42 50 H78 L72 64 H48 Z" className="t-c" />
    </svg>
  );
}

function Gantt() {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <rect x="28" y="12" width="50" height="10" rx="2" className="t-a" />
      <rect x="44" y="30" width="58" height="10" rx="2" className="t-b" />
      <rect x="20" y="48" width="36" height="10" rx="2" className="t-c" />
    </svg>
  );
}

function Gauge() {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <path d="M20 56 A40 40 0 0 1 100 56" className="t-line" fill="none" strokeWidth="10" />
      <path d="M20 56 A40 40 0 0 1 86 24" className="t-stroke-a" fill="none" strokeWidth="10" />
    </svg>
  );
}

function Tree() {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <rect x="6" y="8" width="58" height="56" rx="2" className="t-a" />
      <rect x="66" y="8" width="48" height="28" rx="2" className="t-b" />
      <rect x="66" y="38" width="22" height="26" rx="2" className="t-c" />
      <rect x="90" y="38" width="24" height="26" rx="2" className="t-a" opacity="0.5" />
    </svg>
  );
}

function Tornado() {
  return (
    <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
      <rect x="18" y="12" width="36" height="10" className="t-neg" />
      <rect x="60" y="12" width="28" height="10" className="t-c" />
      <rect x="28" y="30" width="26" height="10" className="t-neg" />
      <rect x="60" y="30" width="42" height="10" className="t-c" />
      <rect x="36" y="48" width="18" height="10" className="t-neg" />
      <rect x="60" y="48" width="20" height="10" className="t-c" />
      <line x1="60" y1="8" x2="60" y2="64" className="t-line" />
    </svg>
  );
}

const BY_SHAPE = {
  series: <Bars clustered />,
  items: <HBars />,
  waterfall: <Waterfall />,
  stacked_waterfall: <Waterfall />,
  line: <Line />,
  combo: <Bars clustered />,
  mekko: <Mekko />,
  scatter: <Scatter />,
  heatmap: <Heat />,
  sankey: <Sankey />,
  funnel: <Funnel />,
  gantt: <Gantt />,
  gauge: <Gauge />,
  tornado: <Tornado />,
  hierarchy: <Tree />,
  dumbbell: <HBars />,
  bullet: <HBars />,
  box: <Bars />,
  kpis: <Bars n={3} />,
  slope: <Line />,
};

const BY_ID = {
  stacked_bar: <Stack />,
  "100_stacked": <Stack />,
  stacked_horizontal: <HBars />,
  pie_donut: <Pie />,
  nested_donut: <Pie />,
  treemap: <Tree />,
  area_stacked: <Area />,
  area_100: <Area />,
  streamgraph: <Area />,
  marimekko: <Mekko />,
  waterfall: <Waterfall />,
  line_trend: <Line />,
  combo: <Bars clustered />,
  sankey: <Sankey />,
  funnel: <Funnel />,
  gantt: <Gantt />,
  heatmap: <Heat />,
  scatter_bubble: <Scatter />,
  tornado: <Tornado />,
};

export default function ChartThumb({ type }) {
  const node = BY_ID[type.id] || BY_SHAPE[type.shape] || <Bars />;
  return <div className="chart-thumb">{node}</div>;
}
