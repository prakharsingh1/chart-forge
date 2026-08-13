import JSZip from "jszip";

const HEX = /[0-9A-Fa-f]{6}/;

function allHex(xml) {
  const out = [];
  const re = /val="([0-9A-Fa-f]{6})"/g;
  let m;
  while ((m = re.exec(xml))) out.push(`#${m[1].toUpperCase()}`);
  return out;
}

function schemeColors(xml) {
  const keys = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  const found = {};
  keys.forEach((k) => {
    const block = xml.match(new RegExp(`<a:${k}[\\s\\S]*?</a:${k}>`, "i"));
    if (!block) return;
    const hex = block[0].match(/srgbClr[^>]*val="([0-9A-Fa-f]{6})"/i);
    const sys = block[0].match(/sysClr[^>]*lastClr="([0-9A-Fa-f]{6})"/i);
    if (hex) found[k] = `#${hex[1].toUpperCase()}`;
    else if (sys) found[k] = `#${sys[1].toUpperCase()}`;
  });
  return found;
}

function latinFonts(xml) {
  const faces = [];
  const re = /<(?:a:latin|a:ea|a:cs)[^>]*typeface="([^"]+)"/g;
  let m;
  while ((m = re.exec(xml))) {
    const f = m[1].replace(/^\+/g, "").split(",")[0].trim();
    if (f && !/^mn$|^mj$|^none$/i.test(f) && !faces.includes(f)) faces.push(f);
  }
  return faces;
}

function luminance(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function paletteFromTheme(theme) {
  const scheme = theme.scheme || {};
  const series = [
    scheme.accent1,
    scheme.accent2,
    scheme.accent3,
    scheme.accent4,
    scheme.accent5,
    scheme.accent6,
    scheme.dk1,
    scheme.dk2,
    scheme.hlink,
    ...(theme.colors || []),
  ]
    .filter((c) => c && HEX.test(c.replace("#", "")))
    .filter((c, i, a) => a.indexOf(c) === i)
    .slice(0, 10);
  while (series.length < 10) series.push(series[series.length - 1] || "#1F4E79");

  const ink = scheme.dk1 || series[0] || "#111118";
  const slide = scheme.lt1 && luminance(scheme.lt1) > 0.7 ? scheme.lt1 : "#FFFFFF";
  const primary = scheme.accent1 || series[0];
  const font = theme.fonts?.[0] || "Calibri";

  return {
    name: "From your deck",
    primary,
    secondary: scheme.dk2 || ink,
    accent: scheme.accent2 || series[1],
    positive: "#548235",
    negative: "#C00000",
    neutral: "#7F7F7F",
    ink,
    muted: "#595959",
    grid: "#EDEDED",
    slide,
    series,
    font: `'${font}', 'Calibri', 'Segoe UI', sans-serif`,
    fontFace: font,
  };
}

export async function extractPptxTheme(file, zip) {
  const pack = zip || (await JSZip.loadAsync(await file.arrayBuffer()));
  const themePath = Object.keys(pack.files).find((p) => /ppt\/theme\/theme\d+\.xml$/i.test(p));
  const themeXml = themePath ? await pack.file(themePath).async("string") : "";
  const masterPath = Object.keys(pack.files).find((p) => /ppt\/slideMasters\/slideMaster\d+\.xml$/i.test(p));
  const masterXml = masterPath ? await pack.file(masterPath).async("string") : "";

  const scheme = schemeColors(themeXml);
  const fonts = [...latinFonts(themeXml), ...latinFonts(masterXml)];
  const colors = [...allHex(themeXml), ...allHex(masterXml)].filter((c, i, a) => a.indexOf(c) === i);

  return {
    scheme,
    fonts: fonts.slice(0, 6),
    colors: colors.slice(0, 16),
    palette: paletteFromTheme({ scheme, fonts, colors }),
  };
}

export function deckCorpus(deck) {
  return (deck?.slides || [])
    .map((s, i) => {
      const texts = [s.title, s.subtitle, s.body, ...(s.originalTexts || [])].filter(Boolean);
      return `Slide ${i + 1}\n${texts.join("\n")}`;
    })
    .join("\n\n")
    .slice(0, 18000);
}

export function guessIndustry(text) {
  const t = (text || "").toLowerCase();
  const rules = [
    ["EV / mobility", /electric vehicle|\bev\b|battery|charging|oem|autonomous|lithium|gigafactory/],
    ["Healthcare", /hospital|pharma|patient|clinical|biotech|payer|provider/],
    ["Financial services", /bank|credit|aum|npl|fintech|insurance|underwrit/],
    ["Energy", /oil|gas|renewable|grid|lng|upstream|refin/],
    ["Retail / CPG", /sku|same-store|gmv|omnichannel|private label|cpg/],
    ["Technology", /saas|arr|cloud|ai |semiconductor|software/],
    ["Telecom", /arpu|subscriber|5g|spectrum|churn/],
    ["Industrials", /capex|throughput|plant|manufactur|aerospace/],
  ];
  return rules.find(([, re]) => re.test(t))?.[0] || "General strategy";
}
