import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { configScript } from "./publicConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const dist = path.join(__dirname, "..", "dist");
const port = Number(process.env.PORT) || 8080;

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "chartforge" });
});

app.get("/config.js", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.type("application/javascript").send(configScript());
});

app.use(express.static(dist, { index: false, maxAge: "1h" }));
app.get("*", (_req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ChartForge listening on ${port}`);
});
