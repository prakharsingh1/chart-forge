const MODEL = "gemini-2.5-pro";
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TEXT = 40;
const MAX_PDF = 10;
const hits = new Map();

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function allow(ip, max) {
  const now = Date.now();
  const bucket = hits.get(ip) || [];
  const recent = bucket.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

function redact(msg) {
  return String(msg || "AI error")
    .replace(/key=[^&\s"]+/gi, "key=REDACTED")
    .replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]");
}

function apiKey() {
  return (process.env.GEMINI_API_KEY || "").trim();
}

export function aiEnabled() {
  return Boolean(apiKey());
}

async function googleGenerate(body) {
  const key = apiKey();
  if (!key) {
    const err = new Error("AI is not configured on the server.");
    err.status = 503;
    throw err;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(redact(data?.error?.message || `Gemini error ${res.status}`));
    err.status = res.status === 429 ? 429 : 502;
    throw err;
  }
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
  if (!text) {
    const err = new Error("Empty model response");
    err.status = 502;
    throw err;
  }
  return text;
}

function sendError(res, e) {
  const status = e.status || 500;
  res.status(status).json({ error: redact(e.message) });
}

export function attachAiRoutes(app) {
  app.post("/api/ai", async (req, res) => {
    if (!allow(clientIp(req), MAX_TEXT)) {
      return res.status(429).json({ error: "Too many AI requests. Try again in a few minutes." });
    }
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
    if (!prompt.trim()) return res.status(400).json({ error: "Missing prompt." });
    if (prompt.length > 120_000) return res.status(413).json({ error: "Prompt is too large." });
    const temperature = Number(req.body?.temperature);
    const search = Boolean(req.body?.search);
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: Number.isFinite(temperature) ? Math.min(1, Math.max(0, temperature)) : 0.15,
        maxOutputTokens: 16384,
      },
    };
    if (search) body.tools = [{ googleSearch: {} }];
    try {
      try {
        const text = await googleGenerate(body);
        return res.json({ text });
      } catch (e) {
        if (search) {
          delete body.tools;
          const text = await googleGenerate(body);
          return res.json({ text });
        }
        throw e;
      }
    } catch (e) {
      return sendError(res, e);
    }
  });

  app.post("/api/ai/pdf", async (req, res) => {
    if (!allow(clientIp(req), MAX_PDF)) {
      return res.status(429).json({ error: "Too many AI requests. Try again in a few minutes." });
    }
    const data = typeof req.body?.data === "string" ? req.body.data : "";
    const mimeType = req.body?.mimeType === "application/pdf" ? "application/pdf" : "";
    if (!data || !mimeType) return res.status(400).json({ error: "Missing PDF." });
    if (data.length > 18_000_000) return res.status(413).json({ error: "PDF is too large." });
    try {
      const text = await googleGenerate({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data } },
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
      });
      return res.json({ text });
    } catch (e) {
      return sendError(res, e);
    }
  });
}
