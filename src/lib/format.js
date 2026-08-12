export function fmt(v, unit = "") {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return "";
  const n = Number(v);
  const abs = Math.abs(n);
  let s;
  if (abs >= 1e9) s = (n / 1e9).toFixed(abs >= 1e11 ? 0 : 1) + "B";
  else if (abs >= 1e6) s = (n / 1e6).toFixed(abs >= 1e8 ? 0 : 1) + "M";
  else if (abs >= 1e3) s = (n / 1e3).toFixed(abs >= 1e5 ? 0 : 1) + "K";
  else s = Number.isInteger(n) ? String(n) : Math.abs(n) >= 10 ? n.toFixed(1) : n.toFixed(1);
  if (s.endsWith(".0")) s = s.slice(0, -2);
  if (unit === "%" || unit === "percent" || unit === "pp") return `${s}%`;
  if (unit && String(unit).startsWith("$")) return `$${s}`;
  if (unit === "€" || unit === "EUR") return `€${s}`;
  if (unit === "£") return `£${s}`;
  return s;
}

export function signed(v, unit) {
  const n = Number(v);
  const t = fmt(Math.abs(n), unit);
  if (n > 0) return `+${t}`;
  if (n < 0) return `−${t}`;
  return t;
}

export function wrapLabel(text, max = 14) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  words.forEach((w) => {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  });
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

export function parseJsonLoose(text) {
  const cleaned = String(text || "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const startArr = cleaned.indexOf("[");
    const startObj = cleaned.indexOf("{");
    const start = startArr === -1 ? startObj : startObj === -1 ? startArr : Math.min(startArr, startObj);
    if (start < 0) throw new Error("Model did not return JSON");
    const endArr = cleaned.lastIndexOf("]");
    const endObj = cleaned.lastIndexOf("}");
    const end = Math.max(endArr, endObj);
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

export function slug(s) {
  return String(s || "chart")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48) || "chart";
}
