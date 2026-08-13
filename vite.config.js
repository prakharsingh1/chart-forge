import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import express from "express";
import { attachAiRoutes } from "./server/aiRoutes.js";

function configPlugin(env) {
  const body = `window.__CF_CONFIG__=${JSON.stringify({
    supabaseUrl: env.VITE_SUPABASE_URL || "https://wrlxmrzjdxkpdbcutgxv.supabase.co",
    supabaseAnonKey:
      env.VITE_SUPABASE_ANON_KEY || "sb_publishable_TetqLJfk9KeZwolwc6J-Zw_BaSUNSRg",
    aiEnabled: Boolean((env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim()),
  })};`;
  return {
    name: "chartforge-config",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { src: "/config.js" },
          injectTo: "head-prepend",
        },
      ];
    },
    configureServer(server) {
      if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
      const api = express();
      api.use(express.json({ limit: "20mb" }));
      attachAiRoutes(api);
      server.middlewares.use(api);
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/config.js") return next();
        res.setHeader("Content-Type", "application/javascript");
        res.end(body);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), configPlugin(env)],
    server: {
      host: "::",
      port: 5178,
      strictPort: true,
    },
  };
});
