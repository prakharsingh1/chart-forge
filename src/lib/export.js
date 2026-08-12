import * as XLSX from "xlsx";
import PptxGenJS from "pptxgenjs";
import { slug } from "./format.js";

export function svgToPngDataUrl(svgEl, title = "") {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const pad = title ? 72 : 16;
      canvas.width = Math.max(svgEl.clientWidth || 800, 800) * 2;
      canvas.height = (Math.max(svgEl.clientHeight || 420, 420) + (title ? 36 : 0)) * 2;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (title) {
        ctx.fillStyle = "#051C2C";
        ctx.font = "bold 28px 'Source Sans 3', sans-serif";
        ctx.fillText(title, 24, 48);
      }
      ctx.drawImage(img, 0, pad, canvas.width, canvas.height - pad);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  });
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function downloadSvg(svgEl, title) {
  const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.download = `${slug(title)}.svg`;
  a.href = URL.createObjectURL(blob);
  a.click();
}

export function exportExcel(charts, rawData) {
  const wb = XLSX.utils.book_new();
  if (rawData?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rawData), "Raw Data");
  charts.forEach((chart, i) => {
    const d = chart.data || {};
    let rows = [];
    if (d.items) rows = d.items.map((it) => ({ Label: it.label, Value: it.value, Type: it.type || "" }));
    else if (d.categories && d.series) {
      rows = d.categories.map((cat, ci) => {
        const row = { Category: typeof cat === "string" ? cat : cat.label };
        d.series.forEach((s) => {
          row[s.name] = s.values?.[ci] ?? "";
        });
        return row;
      });
    } else if (d.stages) rows = d.stages.map((s) => ({ Stage: s.label, Value: s.value }));
    else if (d.points) rows = d.points.map((p) => ({ Label: p.label, X: p.x, Y: p.y, Size: p.size }));
    if (rows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), `Chart ${i + 1}`.slice(0, 31));
  });
  XLSX.writeFile(wb, "ChartForge_deck.xlsx");
}

export async function exportPptx(slides, paletteName) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "ChartForge";
  pptx.title = "ChartForge deck";

  for (const { chart, png } of slides) {
    const slide = pptx.addSlide();
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.08, fill: { color: "051C2C" } });
    slide.addText(chart.title || "", {
      x: 0.45,
      y: 0.28,
      w: 12.4,
      h: 0.55,
      fontSize: 20,
      fontFace: "Calibri",
      bold: true,
      color: "051C2C",
    });
    slide.addText(chart.subtitle || "", {
      x: 0.45,
      y: 0.82,
      w: 12.4,
      h: 0.32,
      fontSize: 12,
      fontFace: "Calibri",
      color: "5C6B73",
    });
    if (png) {
      slide.addImage({ data: png, x: 0.4, y: 1.2, w: 12.5, h: 5.5 });
    }
    slide.addText(chart.source || "Source: ChartForge", {
      x: 0.45,
      y: 7.12,
      w: 9,
      h: 0.22,
      fontSize: 10,
      fontFace: "Calibri",
      color: "8C8C8C",
    });
    slide.addText(paletteName || "", {
      x: 10.2,
      y: 7.12,
      w: 2.7,
      h: 0.22,
      fontSize: 10,
      fontFace: "Calibri",
      color: "8C8C8C",
      align: "right",
    });
  }
  await pptx.writeFile({ fileName: "ChartForge_deck.pptx" });
}
