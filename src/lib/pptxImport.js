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
  const nodes = [...doc.getElementsByTagName("a:t")];
  return nodes.map((n) => (n.textContent || "").trim()).filter(Boolean);
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
    const texts = xmlTexts(xml);
    const notes = await notesForSlide(zip, path);
    const payload = parseCfPayload(notes);
    const n = slideIndex(path);
    slides.push({
      id: uid("slide"),
      title: payload?.title || texts[0] || `Slide ${n}`,
      subtitle: payload?.subtitle || texts[1] || "",
      source: payload?.source || "",
      insight: payload?.insight || "",
      body: texts.slice(payload ? 0 : 2).join("\n"),
      notes,
      originalTexts: texts,
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
      const bits = [`--- Slide ${i + 1}: ${s.title} ---`, s.subtitle, s.body, (s.originalTexts || []).join(" | ")];
      return bits.filter(Boolean).join("\n");
    })
    .join("\n\n");
  return { text, data: [], columns: [], type: "document", pptx: true };
}
