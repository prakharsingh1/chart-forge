export function publicConfig() {
  return {
    supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
  };
}

export function configScript() {
  return `window.__CF_CONFIG__=${JSON.stringify(publicConfig())};`;
}
