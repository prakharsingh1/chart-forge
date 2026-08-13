import { createClient } from "@supabase/supabase-js";

function readConfig() {
  const injected = typeof window !== "undefined" ? window.__CF_CONFIG__ || {} : {};
  return {
    url: injected.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || "",
    key: injected.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  };
}

const { url, key } = readConfig();

export const supabaseConfigured = Boolean(url && key);

export const supabase = supabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "chartforge-auth",
      },
    })
  : null;
