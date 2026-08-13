const S = ({ children }) => (
  <svg viewBox="0 0 120 72" className="thumb-svg" aria-hidden>
    {children}
  </svg>
);

function ClusteredCols() {
  const h = [38, 58, 46, 62, 34, 50, 42, 56];
  return (
    <S>
      {h.map((v, i) => (
        <rect key={i} x={10 + i * 13} y={68 - v} width="10" height={v} rx="1.5" className={i % 2 ? "t-b" : "t-a"} />
      ))}
    </S>
  );
}
function StackedCols() {
  const cols = [[22, 18, 14], [16, 24, 18], [20, 12, 22], [14, 20, 16]];
  return (
    <S>
      {cols.map((seg, i) => {
        let y = 66;
        return seg.map((h, j) => {
          y -= h;
          return <rect key={`${i}${j}`} x={18 + i * 24} y={y} width="18" height={h} className={`t-${["a", "b", "c"][j]}`} />;
        });
      })}
    </S>
  );
}
function Stacked100() {
  return (
    <S>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={16 + i * 24} y={12} width="18" height={20} className="t-a" />
          <rect x={16 + i * 24} y={32} width="18" height={18} className="t-b" />
          <rect x={16 + i * 24} y={50} width="18" height={16} className="t-c" />
        </g>
      ))}
    </S>
  );
}
function Ranked() {
  const w = [92, 74, 58, 40];
  return (
    <S>
      {w.map((v, i) => (
        <rect key={i} x="10" y={10 + i * 15} width={v} height="11" rx="2" className={i === 0 ? "t-a" : "t-b"} />
      ))}
    </S>
  );
}
function ClusteredBars() {
  const rows = [[70, 48], [86, 40], [54, 62], [42, 30]];
  return (
    <S>
      {rows.map((pair, i) => (
        <g key={i}>
          <rect x="10" y={8 + i * 16} width={pair[0]} height="6" rx="1" className="t-a" />
          <rect x="10" y={15 + i * 16} width={pair[1]} height="6" rx="1" className="t-b" />
        </g>
      ))}
    </S>
  );
}
function StackedH() {
  const rows = [[40, 28, 18], [32, 22, 24], [24, 36, 16], [48, 16, 12]];
  return (
    <S>
      {rows.map((seg, i) => {
        let x = 10;
        return seg.map((w, j) => {
          const el = <rect key={`${i}${j}`} x={x} y={10 + i * 15} width={w} height="11" className={`t-${["a", "b", "c"][j]}`} />;
          x += w;
          return el;
        });
      })}
    </S>
  );
}
function StackedH100() {
  return (
    <S>
      {[
        [36, 36, 28],
        [28, 44, 28],
        [50, 22, 28],
        [20, 30, 50],
      ].map((seg, i) => {
        let x = 10;
        return seg.map((w, j) => {
          const el = <rect key={`${i}${j}`} x={x} y={10 + i * 15} width={w} height="11" className={`t-${["a", "b", "c"][j]}`} />;
          x += w;
          return el;
        });
      })}
    </S>
  );
}
function Lollipop() {
  const w = [88, 64, 50, 32];
  return (
    <S>
      {w.map((v, i) => (
        <g key={i}>
          <line x1="12" y1={16 + i * 15} x2={12 + v} y2={16 + i * 15} className="t-stroke-b" />
          <circle cx={12 + v} cy={16 + i * 15} r="5" className="t-a" />
        </g>
      ))}
    </S>
  );
}
function Dumbbell() {
  const rows = [[24, 78], [36, 92], [20, 60], [48, 84]];
  return (
    <S>
      {rows.map(([a, b], i) => (
        <g key={i}>
          <line x1={a} y1={14 + i * 15} x2={b} y2={14 + i * 15} className="t-line" />
          <circle cx={a} cy={14 + i * 15} r="4.5" className="t-b" />
          <circle cx={b} cy={14 + i * 15} r="4.5" className="t-a" />
        </g>
      ))}
    </S>
  );
}
function Bullet() {
  return (
    <S>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="12" y={12 + i * 20} width="96" height="12" rx="2" className="t-line" opacity="0.35" />
          <rect x="12" y={15 + i * 20} width={70 - i * 16} height="6" className="t-a" />
          <line x1={88 - i * 8} y1={10 + i * 20} x2={88 - i * 8} y2={26 + i * 20} className="t-stroke-b" />
        </g>
      ))}
    </S>
  );
}
function RangeBars() {
  const spans = [[28, 70], [40, 96], [18, 58], [50, 88]];
  return (
    <S>
      {spans.map(([a, b], i) => (
        <rect key={i} x={a} y={10 + i * 15} width={b - a} height="11" rx="5" className={i % 2 ? "t-b" : "t-a"} />
      ))}
    </S>
  );
}
function Waterfall() {
  const bars = [
    [8, 18, 48, "t-a"],
    [30, 18, 16, "t-c"],
    [52, 34, 14, "t-neg"],
    [74, 20, 18, "t-c"],
    [96, 20, 46, "t-a"],
  ];
  return (
    <S>
      <path d="M22 18 H30 M44 34 H52 M66 48 H74 M92 20 H96" className="t-line" fill="none" />
      {bars.map(([x, y, h, c], i) => (
        <rect key={i} x={x} y={y} width="16" height={h} rx="1.5" className={c} />
      ))}
    </S>
  );
}
function StackedWaterfall() {
  return (
    <S>
      <rect x="8" y="20" width="16" height="22" className="t-a" />
      <rect x="8" y="42" width="16" height="22" className="t-b" />
      <rect x="32" y="20" width="16" height="10" className="t-c" />
      <rect x="32" y="30" width="16" height="8" className="t-a" />
      <rect x="56" y="38" width="16" height="12" className="t-neg" />
      <rect x="80" y="16" width="16" height="24" className="t-a" />
      <rect x="80" y="40" width="16" height="24" className="t-b" />
    </S>
  );
}
function HWaterfall() {
  return (
    <S>
      <rect x="10" y="10" width="70" height="10" className="t-a" />
      <rect x="80" y="24" width="22" height="10" className="t-c" />
      <rect x="58" y="38" width="22" height="10" className="t-neg" />
      <rect x="10" y="52" width="70" height="10" className="t-a" />
    </S>
  );
}
function Pareto() {
  return (
    <S>
      {[52, 38, 28, 18, 12].map((h, i) => (
        <rect key={i} x={12 + i * 18} y={66 - h} width="14" height={h} className="t-a" />
      ))}
      <polyline points="19,14 37,22 55,30 73,40 91,48" className="t-stroke-b" fill="none" />
    </S>
  );
}
function WinLoss() {
  const v = [1, 1, -1, 1, -1, 1, -1, 1];
  return (
    <S>
      {v.map((s, i) => (
        <rect key={i} x={12 + i * 13} y={s > 0 ? 14 : 36} width="10" height="22" className={s > 0 ? "t-c" : "t-neg"} />
      ))}
    </S>
  );
}
function LineCagr() {
  return (
    <S>
      <polyline points="8,52 32,40 56,44 80,22 112,16" className="t-stroke-a" fill="none" />
      <polyline points="8,60 32,54 56,50 80,42 112,38" className="t-stroke-b" fill="none" />
      {[8, 32, 56, 80, 112].map((x, i) => (
        <circle key={x} cx={x} cy={[52, 40, 44, 22, 16][i]} r="3" className="t-a" />
      ))}
    </S>
  );
}
function StepLine() {
  return (
    <S>
      <polyline points="8,50 28,50 28,38 52,38 52,28 78,28 78,18 112,18" className="t-stroke-a" fill="none" />
    </S>
  );
}
function Area() {
  return (
    <S>
      <path d="M8 64 L8 48 L40 36 L72 40 L112 22 L112 64 Z" className="t-a" opacity="0.4" />
      <path d="M8 64 L8 58 L40 50 L72 54 L112 44 L112 64 Z" className="t-b" opacity="0.6" />
    </S>
  );
}
function Area100() {
  return (
    <S>
      <path d="M8 12 L112 18 L112 36 L8 32 Z" className="t-a" opacity="0.7" />
      <path d="M8 32 L112 36 L112 52 L8 50 Z" className="t-b" opacity="0.7" />
      <path d="M8 50 L112 52 L112 64 L8 64 Z" className="t-c" opacity="0.7" />
    </S>
  );
}
function Stream() {
  return (
    <S>
      <path d="M8 36 C30 18, 50 50, 70 28 C90 10, 100 40, 112 24 L112 48 C100 60, 90 40, 70 50 C50 66, 30 40, 8 52 Z" className="t-a" opacity="0.7" />
      <path d="M8 52 C28 62, 50 48, 70 58 C92 68, 102 50, 112 56 L112 64 L8 64 Z" className="t-b" opacity="0.7" />
    </S>
  );
}
function Combo() {
  return (
    <S>
      {[40, 52, 36, 58, 44].map((h, i) => (
        <rect key={i} x={14 + i * 20} y={66 - h} width="12" height={h} className="t-a" opacity="0.85" />
      ))}
      <polyline points="20,28 40,22 60,30 80,16 100,20" className="t-stroke-b" fill="none" />
    </S>
  );
}
function Slope() {
  return (
    <S>
      <line x1="28" y1="8" x2="28" y2="64" className="t-line" />
      <line x1="92" y1="8" x2="92" y2="64" className="t-line" />
      <line x1="28" y1="48" x2="92" y2="18" className="t-stroke-a" />
      <line x1="28" y1="30" x2="92" y2="42" className="t-stroke-b" />
      <circle cx="28" cy="48" r="4" className="t-a" />
      <circle cx="92" cy="18" r="4" className="t-a" />
    </S>
  );
}
function Bump() {
  return (
    <S>
      <polyline points="12,18 40,28 70,14 108,22" className="t-stroke-a" fill="none" />
      <polyline points="12,36 40,22 70,40 108,32" className="t-stroke-b" fill="none" />
      <polyline points="12,54 40,50 70,46 108,58" className="t-line" fill="none" />
    </S>
  );
}
function ConnScatter() {
  return (
    <S>
      <polyline points="18,54 36,40 52,46 70,22 96,28" className="t-stroke-a" fill="none" />
      {[18, 36, 52, 70, 96].map((x, i) => (
        <circle key={x} cx={x} cy={[54, 40, 46, 22, 28][i]} r="4" className="t-b" />
      ))}
    </S>
  );
}
function Pie() {
  return (
    <S>
      <circle cx="60" cy="36" r="26" className="t-b" />
      <path d="M60 36 L60 10 A26 26 0 0 1 84 48 Z" className="t-a" />
      <path d="M60 36 L84 48 A26 26 0 0 1 38 54 Z" className="t-c" />
      <circle cx="60" cy="36" r="11" fill="#0c0c14" />
    </S>
  );
}
function NestedDonut() {
  return (
    <S>
      <circle cx="60" cy="36" r="28" className="t-a" />
      <circle cx="60" cy="36" r="20" className="t-b" />
      <circle cx="60" cy="36" r="12" className="t-c" />
      <circle cx="60" cy="36" r="6" fill="#0c0c14" />
    </S>
  );
}
function Tree() {
  return (
    <S>
      <rect x="6" y="8" width="58" height="56" rx="2" className="t-a" />
      <rect x="66" y="8" width="48" height="28" rx="2" className="t-b" />
      <rect x="66" y="38" width="22" height="26" rx="2" className="t-c" />
      <rect x="90" y="38" width="24" height="26" rx="2" className="t-a" opacity="0.5" />
    </S>
  );
}
function Sunburst() {
  return (
    <S>
      <circle cx="60" cy="36" r="28" className="t-a" />
      <path d="M60 36 L88 36 A28 28 0 0 1 60 64 Z" className="t-b" />
      <path d="M60 36 L60 8 A28 28 0 0 1 84 20 Z" className="t-c" />
      <circle cx="60" cy="36" r="10" fill="#0c0c14" />
    </S>
  );
}
function Waffle() {
  return (
    <S>
      {Array.from({ length: 40 }, (_, i) => (
        <rect key={i} x={16 + (i % 10) * 9} y={10 + Math.floor(i / 10) * 14} width="7" height="11" rx="1" className={i < 23 ? "t-a" : "t-line"} />
      ))}
    </S>
  );
}
function Packed() {
  const cs = [
    [40, 36, 18],
    [70, 24, 12],
    [78, 48, 14],
    [24, 22, 9],
    [22, 52, 10],
  ];
  return (
    <S>
      {cs.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} className={i % 2 ? "t-b" : "t-a"} opacity="0.9" />
      ))}
    </S>
  );
}
function Nightingale() {
  return (
    <S>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a0 = (i * Math.PI) / 3 - Math.PI / 2;
        const a1 = a0 + Math.PI / 3;
        const r = 12 + (i % 3) * 8;
        const x0 = 60 + Math.cos(a0) * r;
        const y0 = 36 + Math.sin(a0) * r;
        const x1 = 60 + Math.cos(a1) * r;
        const y1 = 36 + Math.sin(a1) * r;
        return <path key={i} d={`M60 36 L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z`} className={i % 2 ? "t-b" : "t-a"} opacity="0.85" />;
      })}
    </S>
  );
}
function Polar() {
  return (
    <S>
      <circle cx="60" cy="36" r="26" className="t-line" fill="none" />
      <circle cx="60" cy="36" r="16" className="t-a" opacity="0.35" />
      <circle cx="60" cy="36" r="8" className="t-b" />
    </S>
  );
}
function Mekko() {
  return (
    <S>
      <rect x="8" y="12" width="48" height="28" className="t-a" />
      <rect x="8" y="40" width="48" height="22" className="t-b" />
      <rect x="56" y="12" width="28" height="18" className="t-c" />
      <rect x="56" y="30" width="28" height="32" className="t-a" opacity="0.55" />
      <rect x="84" y="12" width="28" height="50" className="t-b" opacity="0.7" />
    </S>
  );
}
function Scatter() {
  const pts = [[24, 48], [40, 28], [58, 36], [74, 18], [92, 30], [50, 52]];
  return (
    <S>
      <line x1="10" y1="62" x2="110" y2="62" className="t-line" />
      <line x1="10" y1="10" x2="10" y2="62" className="t-line" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 3 ? 8 : 5} className={i % 2 ? "t-a" : "t-b"} />
      ))}
    </S>
  );
}
function Quadrant() {
  return (
    <S>
      <line x1="60" y1="8" x2="60" y2="64" className="t-line" />
      <line x1="10" y1="36" x2="110" y2="36" className="t-line" />
      <circle cx="34" cy="22" r="6" className="t-a" />
      <circle cx="82" cy="20" r="5" className="t-b" />
      <circle cx="40" cy="50" r="5" className="t-c" />
      <circle cx="88" cy="52" r="7" className="t-a" />
    </S>
  );
}
function Beeswarm() {
  const xs = [20, 28, 36, 44, 52, 58, 66, 74, 82, 90, 98];
  const ys = [40, 28, 48, 34, 22, 44, 30, 50, 26, 38, 46];
  return (
    <S>
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="4" className={i % 3 === 0 ? "t-a" : "t-b"} />
      ))}
    </S>
  );
}
function Hexbin() {
  return (
    <S>
      {[20, 44, 68, 92].map((x, i) => (
        <polygon key={i} points={`${x},18 ${x + 10},26 ${x + 10},40 ${x},48 ${x - 10},40 ${x - 10},26`} className={i % 2 ? "t-b" : "t-a"} opacity={0.5 + i * 0.12} />
      ))}
      {[32, 56, 80].map((x, i) => (
        <polygon key={`b${i}`} points={`${x},32 ${x + 10},40 ${x + 10},54 ${x},62 ${x - 10},54 ${x - 10},40`} className="t-c" opacity="0.7" />
      ))}
    </S>
  );
}
function Box() {
  return (
    <S>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line x1={22 + i * 26} y1="14" x2={22 + i * 26} y2="58" className="t-line" />
          <rect x={14 + i * 26} y={24 + i} width="16" height="22" className={i % 2 ? "t-b" : "t-a"} />
        </g>
      ))}
    </S>
  );
}
function Hist() {
  const h = [18, 28, 44, 56, 40, 24, 14];
  return (
    <S>
      {h.map((v, i) => (
        <rect key={i} x={12 + i * 14} y={66 - v} width="12" height={v} className="t-a" />
      ))}
    </S>
  );
}
function Heat() {
  const cells = [0.2, 0.5, 0.9, 0.35, 0.7, 0.15, 0.8, 0.45, 0.6, 0.25, 0.95, 0.4];
  return (
    <S>
      {cells.map((o, i) => (
        <rect key={i} x={12 + (i % 4) * 24} y={8 + Math.floor(i / 4) * 20} width="22" height="18" rx="2" className="t-a" opacity={0.25 + o * 0.75} />
      ))}
    </S>
  );
}
function Cohort() {
  return (
    <S>
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={16 + (i % 4) * 22} y={8 + Math.floor(i / 4) * 15} width="20" height="13" className="t-b" opacity={1 - (i % 4) * 0.2 - Math.floor(i / 4) * 0.08} />
      ))}
    </S>
  );
}
function Calendar() {
  return (
    <S>
      {Array.from({ length: 28 }, (_, i) => (
        <rect key={i} x={16 + (i % 7) * 13} y={10 + Math.floor(i / 7) * 14} width="11" height="11" rx="1" className={i % 5 === 0 ? "t-a" : "t-line"} />
      ))}
    </S>
  );
}
function Radar() {
  return (
    <S>
      <polygon points="60,12 92,30 80,60 40,60 28,30" className="t-a" opacity="0.35" />
      <polygon points="60,20 80,32 74,52 46,52 40,32" className="t-b" opacity="0.5" />
      <circle cx="60" cy="36" r="2" className="t-c" />
    </S>
  );
}
function Sankey() {
  return (
    <S>
      <rect x="6" y="10" width="10" height="22" className="t-a" />
      <rect x="6" y="40" width="10" height="22" className="t-b" />
      <rect x="104" y="8" width="10" height="18" className="t-c" />
      <rect x="104" y="30" width="10" height="16" className="t-a" />
      <rect x="104" y="50" width="10" height="14" className="t-b" />
      <path d="M16 21 C50 21, 70 17, 104 17" className="t-stroke-a" fill="none" strokeWidth="8" opacity="0.45" />
      <path d="M16 51 C50 51, 70 38, 104 38" className="t-stroke-b" fill="none" strokeWidth="7" opacity="0.45" />
    </S>
  );
}
function Funnel() {
  return (
    <S>
      <path d="M16 10 H104 L92 26 H28 Z" className="t-a" />
      <path d="M30 30 H90 L80 46 H40 Z" className="t-b" />
      <path d="M42 50 H78 L72 64 H48 Z" className="t-c" />
    </S>
  );
}
function Chord() {
  return (
    <S>
      <circle cx="60" cy="36" r="26" className="t-line" fill="none" />
      <path d="M40 18 Q60 36 86 22" className="t-stroke-a" fill="none" />
      <path d="M34 48 Q60 36 88 50" className="t-stroke-b" fill="none" />
    </S>
  );
}
function Alluvial() {
  return (
    <S>
      <rect x="8" y="10" width="8" height="50" className="t-a" />
      <rect x="104" y="10" width="8" height="18" className="t-b" />
      <rect x="104" y="32" width="8" height="28" className="t-c" />
      <path d="M16 20 C50 20, 70 16, 104 16" className="t-stroke-a" fill="none" strokeWidth="10" opacity="0.4" />
      <path d="M16 48 C50 48, 70 48, 104 48" className="t-stroke-b" fill="none" strokeWidth="14" opacity="0.4" />
    </S>
  );
}
function Tornado() {
  return (
    <S>
      <rect x="18" y="12" width="36" height="10" className="t-neg" />
      <rect x="60" y="12" width="28" height="10" className="t-c" />
      <rect x="28" y="30" width="26" height="10" className="t-neg" />
      <rect x="60" y="30" width="42" height="10" className="t-c" />
      <rect x="36" y="48" width="18" height="10" className="t-neg" />
      <rect x="60" y="48" width="20" height="10" className="t-c" />
      <line x1="60" y1="8" x2="60" y2="64" className="t-line" />
    </S>
  );
}
function Diverging() {
  return (
    <S>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={60 - (30 - i * 4)} y={10 + i * 15} width={30 - i * 4} height="10" className="t-neg" />
          <rect x="60" y={10 + i * 15} width={24 + i * 6} height="10" className="t-c" />
        </g>
      ))}
    </S>
  );
}
function Pyramid() {
  return (
    <S>
      {[40, 32, 24, 16].map((w, i) => (
        <g key={i}>
          <rect x={60 - w} y={12 + i * 14} width={w} height="11" className="t-a" />
          <rect x="60" y={12 + i * 14} width={w * 0.85} height="11" className="t-b" />
        </g>
      ))}
    </S>
  );
}
function Gauge() {
  return (
    <S>
      <path d="M20 56 A40 40 0 0 1 100 56" className="t-line" fill="none" strokeWidth="10" />
      <path d="M20 56 A40 40 0 0 1 86 24" className="t-stroke-a" fill="none" strokeWidth="10" />
    </S>
  );
}
function Kpis() {
  return (
    <S>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={10 + i * 36} y="16" width="32" height="40" rx="4" className={["t-a", "t-b", "t-c"][i]} opacity="0.85" />
      ))}
    </S>
  );
}
function Rings() {
  return (
    <S>
      <circle cx="30" cy="36" r="16" className="t-line" fill="none" strokeWidth="6" />
      <circle cx="30" cy="36" r="16" className="t-stroke-a" fill="none" strokeWidth="6" strokeDasharray="60 40" />
      <circle cx="70" cy="36" r="16" className="t-line" fill="none" strokeWidth="6" />
      <circle cx="70" cy="36" r="16" className="t-stroke-b" fill="none" strokeWidth="6" strokeDasharray="40 60" />
      <circle cx="100" cy="36" r="12" className="t-c" opacity="0.5" />
    </S>
  );
}
function Gantt() {
  return (
    <S>
      <rect x="28" y="12" width="50" height="10" rx="2" className="t-a" />
      <rect x="44" y="30" width="58" height="10" rx="2" className="t-b" />
      <rect x="20" y="48" width="36" height="10" rx="2" className="t-c" />
    </S>
  );
}
function Timeline() {
  return (
    <S>
      <line x1="10" y1="36" x2="110" y2="36" className="t-line" />
      {[18, 42, 70, 98].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="36" r="5" className={i % 2 ? "t-b" : "t-a"} />
          <rect x={x - 8} y={i % 2 ? 10 : 46} width="16" height="8" rx="2" className="t-c" />
        </g>
      ))}
    </S>
  );
}

const BY_ID = {
  grouped_bar: ClusteredCols,
  stacked_bar: StackedCols,
  "100_stacked": Stacked100,
  horizontal_bar: Ranked,
  grouped_horizontal: ClusteredBars,
  stacked_horizontal: StackedH,
  "100_stacked_horizontal": StackedH100,
  lollipop: Lollipop,
  dumbbell: Dumbbell,
  bullet: Bullet,
  range_bar: RangeBars,
  waterfall: Waterfall,
  stacked_waterfall: StackedWaterfall,
  waterfall_horizontal: HWaterfall,
  pareto: Pareto,
  win_loss: WinLoss,
  line_trend: LineCagr,
  step_line: StepLine,
  area_stacked: Area,
  area_100: Area100,
  streamgraph: Stream,
  combo: Combo,
  slope: Slope,
  bump: Bump,
  connected_scatter: ConnScatter,
  pie_donut: Pie,
  nested_donut: NestedDonut,
  treemap: Tree,
  sunburst: Sunburst,
  waffle: Waffle,
  packed_circles: Packed,
  nightingale: Nightingale,
  polar_area: Polar,
  marimekko: Mekko,
  scatter_bubble: Scatter,
  quadrant: Quadrant,
  beeswarm: Beeswarm,
  hexbin: Hexbin,
  boxplot: Box,
  histogram: Hist,
  heatmap: Heat,
  cohort: Cohort,
  calendar_heatmap: Calendar,
  radar: Radar,
  sankey: Sankey,
  funnel: Funnel,
  chord: Chord,
  alluvial: Alluvial,
  tornado: Tornado,
  diverging_bar: Diverging,
  population_pyramid: Pyramid,
  gauge: Gauge,
  kpi_cards: Kpis,
  progress_ring: Rings,
  gantt: Gantt,
  timeline: Timeline,
};

export default function ChartThumb({ type }) {
  const Node = BY_ID[type?.id] || ClusteredCols;
  return (
    <div className="chart-thumb">
      <Node />
    </div>
  );
}
