import Papa from "papaparse";
import * as XLSX from "xlsx";

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = () => rej(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

async function extractPdfWithGemini(apiKey, file) {
  const b64 = await fileToBase64(file);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType: "application/pdf", data: b64 } },
              {
                text: `Extract ALL content from this PDF for consulting charting.
1. ALL text, headings, footnotes, captions
2. ALL numbers, percentages, currency
3. ALL tables as markdown tables with exact figures
4. ALL charts: axes, series, every labeled data point
5. Units and time periods

Format:
TITLE:
FULL TEXT:
TABLES:
NUMERICAL DATA:
CHARTS DESCRIBED:

Be exhaustive. Do not invent numbers.`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 16384 },
      }),
    }
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `PDF extract failed (${res.status})`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function tryParseTablesFromText(text) {
  const rows = [];
  const columns = [];
  const tableLines = text.match(/\|(.+)\|/g);
  if (tableLines && tableLines.length >= 3) {
    const headers = tableLines[0]
      .split("|")
      .map((h) => h.trim())
      .filter((h) => h && !h.match(/^[-:]+$/));
    if (headers.length) {
      columns.push(...headers);
      for (let i = 1; i < tableLines.length; i++) {
        const cells = tableLines[i]
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c && !c.match(/^[-:]+$/));
        if (cells.length >= headers.length - 1) {
          const row = {};
          headers.forEach((h, j) => {
            const val = cells[j] || "";
            const num = parseFloat(String(val).replace(/[,%$€£₹\s]/g, ""));
            row[h] = Number.isNaN(num) || val === "" ? val : num;
          });
          rows.push(row);
        }
      }
    }
  }
  return { data: rows, columns };
}

export async function extractTextFromFile(file, apiKey) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "csv" || ext === "tsv") {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (r) =>
          resolve({
            text: JSON.stringify(r.data, null, 2),
            data: r.data,
            columns: r.meta.fields || [],
            type: "tabular",
          }),
        error: () => resolve({ text: "", data: [], columns: [], type: "tabular" }),
      });
    });
  }
  if (["xlsx", "xls", "xlsm"].includes(ext)) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: "array" });
          let allData = [];
          let allCols = [];
          let allText = "";
          wb.SheetNames.forEach((name) => {
            const json = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
            const cols = json.length ? Object.keys(json[0]) : [];
            allText += `\n--- Sheet: ${name} ---\n${JSON.stringify(json, null, 2)}\n`;
            if (json.length > allData.length) {
              allData = json;
              allCols = cols;
            }
          });
          resolve({ text: allText, data: allData, columns: allCols, type: "tabular" });
        } catch {
          resolve({ text: "", data: [], columns: [], type: "tabular" });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
  if (ext === "pdf") {
    if (!apiKey) throw new Error("A Gemini API key is required to extract PDFs.");
    const text = await extractPdfWithGemini(apiKey, file);
    const { data, columns } = tryParseTablesFromText(text);
    return { text, data, columns, type: data.length ? "tabular" : "document", pdfExtracted: true };
  }
  if (ext === "txt" || ext === "md") {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ text: e.target.result, data: [], columns: [], type: "document" });
      reader.readAsText(file);
    });
  }
  throw new Error("Use CSV, Excel, PDF, or a text brief.");
}
