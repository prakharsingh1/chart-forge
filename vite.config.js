import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function configPlugin(env) {
  const body = `window.__CF_CONFIG__=${JSON.stringify({
    supabaseUrl: env.VITE_SUPABASE_URL || "",
    supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || "",
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
