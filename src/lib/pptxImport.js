import JSZip from "jszip";
import { uid } from "./deck.js";

export const CF_PREFIX = "CHARTFORGE::";
export const CF_JSON_PATH = "ppt/chartforge/deck.json";

function slideIndex(path) {
  const m = path.match(/slide(\d+)\.xml$/i);
  return m ? Number(m[1]) : 0;
}

function xmlTexts(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return parasFrom(doc).filter(Boolean);
}

function parasFrom(root) {
  return [...root.getElementsByTagName("a:p")]
    .map((p) => [...p.getElementsByTagName("a:t")].map((n) => n.textContent || "").join("").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function isJunkTitle(t) {
  const s = String(t || "").trim();
  if (!s) return true;
  if (s.length < 4) return true;
  if (/^\d+$/.test(s)) return true;
  if (/^(slide\s*)?\d+$/i.test(s)) return true;
  if (/^page\s*\d+/i.test(s)) return true;
  if (/^\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?$/.test(s)) return true;
  if (/^(confidential|internal( use)?|draft|do not distribute)$/i.test(s)) return true;
  if (/^(the|and|of|for|in|to|a)$/i.test(s)) return true;
  return false;
}

function parseSlideXml(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const blocks = [];
  for (const sp of [...doc.getElementsByTagName("p:sp"), ...doc.getElementsByTagName("p:cxnSp")]) {
    const ph = sp.getElementsByTagName("p:ph")[0];
    const type = (ph?.getAttribute("type") || "").toLowerCase();
    const name = sp.getElementsByTagName("p:cNvPr")[0]?.getAttribute("name") || "";
    const paras = parasFrom(sp);
    if (!paras.length) continue;
    blocks.push({ type, name, paras, text: paras.join("\n") });
  }

  const titleBlock = blocks.find((b) => /^(title|ctrtitle)$/.test(b.type) || /title/i.test(b.name) && !/subtitle/i.test(b.name));
  const subBlock = blocks.find((b) => /subtitle/.test(b.type) || /subtitle/i.test(b.name));
  let title = titleBlock?.paras.join(" ").trim() || "";
  let subtitle = subBlock?.paras.join(" ").trim() || "";

  const candidates = blocks
    .flatMap((b) => b.paras)
    .filter((p) => !isJunkTitle(p))
    .sort((a, b) => b.length - a.length);
  if (isJunkTitle(title)) title = candidates[0] || "";
  if (isJunkTitle(subtitle) || subtitle === title) {
    subtitle = candidates.find((c) => c !== title && c.length < 140) || "";
  }

  const bodyParas = blocks
    .filter((b) => !/^(title|ctrtitle|subtitle|ftr|sldnum|dt)$/.test(b.type))
    .flatMap((b) => b.paras)
    .filter((p) => p !== title && p !== subtitle && (!isJunkTitle(p) || p.length > 12));

  const tables = [];
  for (const tbl of doc.getElementsByTagName("a:tbl")) {
    const rows = [...tbl.getElementsByTagName("a:tr")].map((tr) =>
      [...tr.getElementsByTagName("a:tc")].map((tc) =>
        [...tc.getElementsByTagName("a:t")].map((n) => n.textContent || "").join("").replace(/\s+/g, " ").trim()
      )
    );
    if (rows.some((r) => r.some(Boolean))) tables.push(rows);
  }

  const originalTexts = [...new Set([...blocks.flatMap((b) => b.paras), ...tables.flat().flat()])];
  return { title, subtitle, bodyParas, tables, originalTexts };
}

function cachePts(parent, tag) {
  const cache = parent.getElementsByTagName(tag)[0];
  if (!cache) return [];
  return [...cache.getElementsByTagName("c:pt")]
    .sort((a, b) => Number(a.getAttribute("idx") || 0) - Number(b.getAttribute("idx") || 0))
    .map((pt) => (pt.getElementsByTagName("c:v")[0]?.textContent || "").trim());
}

function parseChartXml(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const series = [];
  let categories = [];
  for (const ser of doc.getElementsByTagName("c:ser")) {
    const tx = ser.getElementsByTagName("c:tx")[0];
    const name = (tx && cachePts(tx, "c:strCache")[0]) || tx?.getElementsByTagName("c:v")[0]?.textContent || `Series ${series.length + 1}`;
    const catNode = ser.getElementsByTagName("c:cat")[0];
    const valNode = ser.getElementsByTagName("c:val")[0];
    const cats = catNode ? cachePts(catNode, "c:strCache").concat(cachePts(catNode, "c:numCache")) : [];
    const values = valNode ? cachePts(valNode, "c:numCache") : [];
    if (cats.length && !categories.length) categories = cats;
    series.push({ name: String(name).trim() || `Series ${series.length + 1}`, values });
  }
  return { categories, series };
}

function resolveRelTarget(slidePath, target) {
  let t = (target || "").replace(/\\/g, "/");
  if (t.startsWith("/")) t = t.slice(1);
  if (t.startsWith("../")) t = "ppt/" + t.replace(/^(\.\.\/)+/, "");
  if (!t.startsWith("ppt/")) {
    t = slidePath.replace(/[^/]+$/, "") + t;
    t = t.replace(/slides\/\.\.\//, "");
  }
  return t.replace(/\/\.\.\//g, "/");
}

async function chartsForSlide(zip, slidePath) {
  const relsPath = slidePath.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels";
  const relsFile = zip.file(relsPath);
  if (!relsFile) return [];
  const rels = await relsFile.async("string");
  const targets = [...rels.matchAll(/Type="[^"]*\/relationships\/chart"[^>]*Target="([^"]+)"|Target="([^"]+)"[^>]*Type="[^"]*\/relationships\/chart"/gi)].map(
    (m) => m[1] || m[2]
  );
  const out = [];
  for (const t of targets) {
    const path = resolveRelTarget(slidePath, t);
    const f = zip.file(path) || zip.file(path.replace(/^ppt\/slides\//, "ppt/")) || zip.file(`ppt/charts/${t.split("/").pop()}`);
    if (!f) continue;
    try {
      out.push(parseChartXml(await f.async("string")));
    } catch {
      /* skip broken chart part */
    }
  }
  return out;
}

function parseCfPayload(notes) {
  if (!notes || !notes.includes(CF_PREFIX)) return null;
  const raw = notes.split(CF_PREFIX)[1] || "";
  const json = raw.trim().split(/\nCHARTFORGE_END|\n\n/)[0].trim();
  try {
    return JSON.parse(json);
  } catch {
    const start = json.indexOf("{");
    const end = json.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(json.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function notesForSlide(zip, slidePath) {
  const relsPath = slidePath.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels";
  const relsFile = zip.file(relsPath);
  if (!relsFile) return "";
  const rels = await relsFile.async("string");
  const m = rels.match(/Target="([^"]*notesSlide\d+\.xml)"/i);
  if (!m) return "";
  let target = m[1].replace(/^\.\.\//, "ppt/");
  if (target.startsWith("../")) target = "ppt/" + target.replace(/^(\.\.\/)+/, "");
  if (!target.startsWith("ppt/")) {
    const base = slidePath.replace(/slide\d+\.xml$/i, "");
    target = (base + target).replace(/slides\/\.\.\//, "");
  }
  const nf = zip.file(target) || zip.file(target.replace(/^ppt\/slides\//, "ppt/"));
  if (!nf) {
    const name = target.split("/").pop();
    const alt = zip.file(`ppt/notesSlides/${name}`);
    if (!alt) return "";
    return xmlTexts(await alt.async("string")).join("\n");
  }
  return xmlTexts(await nf.async("string")).join("\n");
}

export async function importPptx(file) {
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const cf = zip.file(CF_JSON_PATH);
  if (cf) {
    try {
      const saved = JSON.parse(await cf.async("string"));
      if (saved?.slides?.length) {
        return {
          ...saved,
          name: file.name,
          roundTrip: true,
        };
      }
    } catch {
      /* fall through to XML parse */
    }
  }

  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => slideIndex(a) - slideIndex(b));

  if (!slidePaths.length) throw new Error("No slides found in that PowerPoint file.");

  const slides = [];
  for (const path of slidePaths) {
    const xml = await zip.files[path].async("string");
    const parsed = parseSlideXml(xml);
    const notes = await notesForSlide(zip, path);
    const payload = parseCfPayload(notes);
    const embedded = await chartsForSlide(zip, path);
    const n = slideIndex(path);
    const tableText = parsed.tables
      .map((rows) => rows.map((r) => r.join(" | ")).join("\n"))
      .filter(Boolean)
      .map((t, i) => `TABLE ${i + 1}:\n${t}`)
      .join("\n");
    const chartText = embedded
      .map((c, i) => {
        const head = `CHART ${i + 1} categories: ${(c.categories || []).join(", ")}`;
        const rows = (c.series || []).map((s) => `${s.name}: ${(s.values || []).join(", ")}`);
        return [head, ...rows].join("\n");
      })
      .join("\n");
    const title = payload?.title || parsed.title || `Slide ${n}`;
    slides.push({
      id: uid("slide"),
      title,
      subtitle: payload?.subtitle || parsed.subtitle || "",
      source: payload?.source || "",
      insight: payload?.insight || "",
      body: [parsed.bodyParas.join("\n"), tableText, chartText].filter(Boolean).join("\n\n"),
      notes,
      originalTexts: parsed.originalTexts,
      tables: parsed.tables,
      embeddedCharts: embedded,
      chart: payload?.chart || null,
    });
  }

  return {
    name: file.name,
    insights: null,
    roundTrip: slides.some((s) => s.chart),
    slides,
  };
}

export function deckToFileContent(deck) {
  const text = (deck.slides || [])
    .map((s, i) => {
      const bits = [
        `--- Slide ${i + 1}: ${s.title} ---`,
        s.subtitle,
        s.body,
        (s.tables || []).length ? `Tables:\n${s.tables.map((rows) => rows.map((r) => r.join(" | ")).join("\n")).join("\n")}` : "",
      ];
      return bits.filter(Boolean).join("\n");
    })
    .join("\n\n");
  return { text, data: [], columns: [], type: "document", pptx: true };
}
